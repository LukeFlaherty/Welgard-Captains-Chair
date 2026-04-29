/**
 * One-time seed: import service ticket history from CSV.
 * Deletes ALL existing service tickets, then imports from seed-data CSV.
 * Tries to link each ticket to an existing Vendor by company name.
 * Unmatched companies are stored as free-text serviceCompletedBy with no vendorId.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type CsvRow = Record<string, string>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clean(v: string): string | null {
  const t = v?.trim();
  return t || null;
}

function parseGlyphicon(v: string): boolean {
  return v?.includes("glyphicon-ok") ?? false;
}

/** Parse MM/DD/YYYY or YYYY-MM-DD → Date (local midnight) */
function parseDate(v: string): Date | null {
  const s = v?.trim();
  if (!s) return null;
  const mdy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (mdy) {
    const d = new Date(parseInt(mdy[3]), parseInt(mdy[1]) - 1, parseInt(mdy[2]));
    return isNaN(d.getTime()) ? null : d;
  }
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (ymd) {
    const d = new Date(parseInt(ymd[1]), parseInt(ymd[2]) - 1, parseInt(ymd[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Combine MM/DD/YYYY date string with HH:MM (24h) time string */
function parseDateAndTime(dateStr: string, timeStr: string): Date | null {
  const d = parseDate(dateStr);
  if (!d) return null;
  const t = timeStr?.trim();
  if (t) {
    const hm = t.match(/^(\d{1,2}):(\d{2})$/);
    if (hm) d.setHours(parseInt(hm[1]), parseInt(hm[2]), 0, 0);
  }
  return d;
}

/**
 * scheduledFor: use Service Scheduled For Date for the date (reliable),
 * extract time from Service Scheduled For Time (which embeds a full datetime
 * "YYYY-MM-DD HH:MM AM/PM" — but the date part mismatches in 124/138 rows).
 */
function parseScheduledFor(dateStr: string, timeStr: string): Date | null {
  const d = parseDate(dateStr);
  if (!d) return null;
  const t = timeStr?.trim();
  if (t) {
    const ampm = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (ampm) {
      let hours = parseInt(ampm[1]);
      const mins = parseInt(ampm[2]);
      const period = ampm[3].toUpperCase();
      if (period === "AM" && hours === 12) hours = 0;
      if (period === "PM" && hours !== 12) hours += 12;
      d.setHours(hours, mins, 0, 0);
    }
  }
  return d;
}

function mapServiceType(v: string): string {
  return v?.trim().toLowerCase() === "emergency" ? "emergency" : "general_maintenance";
}

function mapTriState(v: string): string | null {
  const s = v?.trim().toLowerCase();
  if (s === "yes") return "yes";
  if (s === "no") return "no";
  if (s === "don't know") return "dont_know";
  return null;
}

function parseAmount(v: string): number | null {
  const s = v?.trim().replace(/[$,\s]/g, "");
  if (!s) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseFloat_(v: string): number | null {
  const s = v?.trim();
  if (!s) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function parseTimestamp(v: string): Date | null {
  const s = v?.trim();
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function mapPaymentType(v: string): string | null {
  const s = v?.trim().toLowerCase();
  if (!s) return null;
  if (s === "cash") return "cash";
  if (s === "check") return "check";
  if (s === "credit card") return "credit_card";
  return s;
}

// ─── Vendor name normalization ────────────────────────────────────────────────

const KNOWN_ALIASES: Record<string, string> = {
  "valley drillilng corp":                              "valley drilling corp",
  "r and g water systems":                              "r&g water systems",
  "tlc well sevice":                                    "tlc well service",
  "kim snyder acme well repair & drilling llc":         "acme well repair & drilling llc",
};

function normalizeName(name: string): string {
  const n = name.trim().toLowerCase().replace(/\s+/g, " ");
  return KNOWN_ALIASES[n] ?? n;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = path.join(
    process.cwd(),
    "seed-data",
    "WelGard Service Ticket History 04292026.csv"
  );
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV not found: ${csvPath}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(csvPath, { encoding: "utf-8" });
  const allRows: CsvRow[] = parse(raw, { columns: true, skip_empty_lines: true, bom: true });
  const rows = allRows.filter((r) => /^\d+$/.test(r["ID"]?.trim()));
  console.log(`\nLoaded ${rows.length} service ticket rows.\n`);

  // ── Preload vendor cache ──────────────────────────────────────────────────
  const vendors = await prisma.vendor.findMany({ select: { id: true, companyName: true } });
  const vendorMap = new Map<string, string>(); // normalized name → id
  for (const v of vendors) vendorMap.set(normalizeName(v.companyName), v.id);
  console.log(`Loaded ${vendors.length} vendors for matching.\n`);

  // ── Delete existing service tickets ───────────────────────────────────────
  const { count: deleted } = await prisma.serviceTicket.deleteMany({});
  console.log(`Deleted ${deleted} existing service tickets.\n`);

  // ── Insert ────────────────────────────────────────────────────────────────
  let inserted = 0;
  let errors = 0;
  let linked = 0;
  let unlinked = 0;
  const createdAtUpdates: Array<{ id: string; createdAt: Date }> = [];

  for (const row of rows) {
    const ticketNumber    = parseInt(row["ID"].trim(), 10);
    const memberFirstName = clean(row["Member First Name"]) ?? "Unknown";
    const memberLastName  = clean(row["Member Last Name"]) ?? "";
    const streetAddress   = clean(row["Street Address 1"]) ?? "Unknown";

    try {
      const companyName = clean(row["Service Completed By"]);
      let vendorId: string | null = null;
      if (companyName) {
        vendorId = vendorMap.get(normalizeName(companyName)) ?? null;
        if (vendorId) linked++; else unlinked++;
      }

      const isComplete = parseGlyphicon(row["Service Ticket Complete"]);

      const ticket = await prisma.serviceTicket.create({
        data: {
          ticketNumber,

          memberFirstName,
          memberLastName,
          memberEmail:        clean(row["Member Email"]),
          memberAltEmail:     clean(row["Member Alternate Email"]),
          memberPhone:        clean(row["Phone Number"]),
          memberPhoneType:    clean(row["Phone Type"]),
          memberAltPhone:     clean(row["Alternate Phone Number"]),
          memberAltPhoneType: clean(row["Alternate Phone Type"]),

          streetAddress,
          streetAddress2: clean(row["Street Address 2"]),
          city:           clean(row["City"]),
          county:         clean(row["County"]),
          state:          clean(row["State"]),
          zip:            clean(row["ZIP Code"]),

          serviceType: mapServiceType(row["Service Type"]),
          status:      isComplete ? "completed" : "open",

          callReceivedAt:  parseDateAndTime(row["Service Call Received Date"], row["Service Call Received Time"]) ?? new Date(),
          scheduledFor:    parseScheduledFor(row["Service Scheduled For Date"], row["Service Scheduled For Time"]),
          lastServiceDate: parseDate(row["Last Service Date"]),

          vendorId,
          serviceCompletedBy: companyName,

          callInNumber:        clean(row["Call In Number"]),
          customerInquiry:     clean(row["Customer Inquiry"]),
          customerFollowUp:    clean(row["Customer Follow Up"]),
          specialInstructions: clean(row["Special Instructions"]),

          rightOfFirstRefusal: null,
          valvesOpen:          mapTriState(row["Valves Open"]),
          filterClogged:       mapTriState(row["Filter Clogged"]),
          circuitBreakerReset: mapTriState(row["Circuit Breaker Reset"]),
          lowPressureSwitch:   mapTriState(row["Low Pressure Switch"]),
          backwashCycle:       mapTriState(row["Backwash Cycle"]),
          pressureGauge:       mapTriState(row["Pressure Gauge"]),

          technicianResponse: clean(row["Technician Response"]),
          amperageReading:    parseFloat_(row["Amperage Reading"]),

          invoiceNumber:      clean(row["Invoice Number"]),
          invoiceAmount:      parseAmount(row["Invoice Amount"]),
          invoicePaymentType: mapPaymentType(row["Invoice Payment Type"]),
          invoiceAttachment:  clean(row["Invoice Attachment"]),

          isComplete,
          ticketCompletedBy: clean(row["Ticket Completed By"]),
        },
        select: { id: true },
      });

      const createdAt = parseTimestamp(row["Created Date/Time"]);
      if (createdAt) createdAtUpdates.push({ id: ticket.id, createdAt });

      const suffix = vendorId ? "" : ` (unlinked: ${companyName ?? "no company"})`;
      console.log(`  [ok] #${ticketNumber} ${memberFirstName} ${memberLastName}${suffix}`);
      inserted++;
    } catch (err) {
      console.error(`  [err] #${ticketNumber} ${memberFirstName} ${memberLastName}:`, err);
      errors++;
    }
  }

  console.log(`\nInserted: ${inserted}  Errors: ${errors}`);
  console.log(`Vendor links: ${linked} linked, ${unlinked} unlinked (free-text only)\n`);

  // ── Backfill createdAt ────────────────────────────────────────────────────
  if (createdAtUpdates.length) {
    const CHUNK = 200;
    for (let i = 0; i < createdAtUpdates.length; i += CHUNK) {
      const chunk = createdAtUpdates.slice(i, i + CHUNK);
      const stmts = chunk.map(
        ({ id, createdAt }) =>
          prisma.$executeRaw`UPDATE "ServiceTicket" SET "createdAt" = ${createdAt} WHERE "id" = ${id}`
      );
      await prisma.$transaction(stmts as unknown as Parameters<typeof prisma.$transaction>[0], { timeout: 30000 });
    }
    console.log(`Backfilled createdAt for ${createdAtUpdates.length} tickets.\n`);
  }

  console.log("Done.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
