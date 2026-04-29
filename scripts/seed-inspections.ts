/**
 * Seed script: wipe all existing inspections and import from the real CSV export.
 * Usage: npm run seed-inspections
 *   or:  npx tsx scripts/seed-inspections.ts [path/to/file.csv]
 *
 * What it does:
 *  1. Deletes all Inspection rows (cascades to YieldTest, InspectionPhoto, PdfGeneration)
 *  2. Preloads Vendor / Inspector / Member caches from the DB
 *  3. For each CSV row: find-or-create Vendor, Inspector, Member; insert Inspection
 *  4. Backfills createdAt from the CSV's "Created Date/Time" column via raw SQL
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CSV_PATH =
  process.argv[2] ??
  path.join(process.cwd(), "seed-data", "WelGard Inspections 04282026.csv");

// ─── Parsers ─────────────────────────────────────────────────────────────────

function clean(v: string | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

function parseGlyphicon(raw: string): boolean {
  return raw.includes("glyphicon-ok");
}

function parseBoolean(raw: string): boolean {
  const t = raw.trim().toLowerCase();
  return t === "yes" || t === "true" || raw.includes("glyphicon-ok");
}

function parseNum(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
}

function parseInt_(raw: string): number | null {
  const n = parseNum(raw);
  return n == null ? null : Math.round(n);
}

function parseAmperage(raw: string): number | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (t.includes("less than 5")) return 4.0;
  if (t.includes("over 11.99")) return 13.0;
  const m = t.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (m) return (parseFloat(m[1]) + parseFloat(m[2])) / 2;
  return parseNum(raw);
}

function parseInspectionDate(dateRaw: string, timeRaw: string): Date | null {
  const d = dateRaw.trim();
  if (!d) return null;
  const t = timeRaw.trim() || "00:00";
  const dt = new Date(`${d} ${t}`);
  return isNaN(dt.getTime()) ? null : dt;
}

function parseTimestamp(raw: string): Date | null {
  if (!raw.trim()) return null;
  const dt = new Date(raw.trim());
  return isNaN(dt.getTime()) ? null : dt;
}

// ─── Enum mappers ─────────────────────────────────────────────────────────────

function mapWellType(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v === "drilled") return "drilled";
  if (v === "bored") return "bored";
  if (v === "hand dug") return "hand_dug";
  if (v === "stick") return "stick";
  if (v === "artesian") return "artesian";
  if (v === "driven point") return "driven_point";
  return "other";
}

function mapPumpType(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v === "submersible") return "submersible";
  if (v.includes("jet")) return "jet";
  if (v.includes("constant")) return "constant_pressure";
  if (v === "hand") return "hand";
  return "other";
}

function mapPumpManufacturer(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v === "unknown") return "unknown";
  if (v === "franklin") return "franklin";
  if (v === "goulds") return "goulds";
  if (v === "grundfos") return "grundfos";
  return "other";
}

function mapPumpHp(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (v === "1/2") return "0_5hp";
  if (v === "3/4") return "0_75hp";
  if (v === "1") return "1hp";
  if (v === "1 1/2" || v === "1.5") return "1_5hp";
  if (v === "2") return "2hp";
  if (v.toLowerCase() === "unknown") return "unknown";
  return "other";
}

function mapCasingType(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v === "pvc") return "pvc";
  if (v === "steel") return "steel";
  return "other";
}

function mapWellCap(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v.includes("not applicable") || v.includes("buried")) return "not_applicable_buried";
  if (v.includes("sealed") || v.includes("contamination")) return "sealed_contamination_resistant";
  if (v.includes("secured") || v.includes("bolted")) return "secured_bolted";
  if (v.includes("bored well")) return "bored_well";
  if (v.includes("unsecured") || v.includes("open")) return "unsecured_open";
  if (v.includes("missing") || v.includes("damaged") || v === "faulty") return "missing_damaged";
  return "other";
}

function mapObstruction(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v === "none") return "none";
  if (v === "ornamental") return "ornamental";
  if (v === "buried") return "buried";
  if (v === "structure" || v === "structural") return "structural";
  if (v.includes("vegetation") || v.includes("overgrowth")) return "vegetation";
  if (v.includes("debris")) return "debris";
  if (v.includes("interior") || v.includes("basement") || v.includes("crawl")) return "structural";
  return "other";
}

function mapWellDataSource(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v || v.includes("no data")) return "other";
  if (v.includes("homeowner")) return "homeowner";
  if (v.includes("official") || v.includes("permit")) return "official";
  if (v.includes("notation")) return "notation_near_well";
  return "other";
}

function mapTankCondition(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v.includes("good")) return "good";
  if (v.includes("fair")) return "fair";
  if (v.includes("poor")) return "poor";
  if (v.includes("replace") || v.includes("waterlogged") || v.includes("failed")) return "failed";
  return null;
}

function mapTankBrand(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v || v === "other") return "other";
  if (v.includes("wel x trol") || v.includes("welxtrol")) return "welxtrol";
  if (v === "state") return "state";
  return "other";
}

function mapPsiSettings(raw: string): string | null {
  const v = raw.trim().replace(/\s/g, "");
  if (!v) return null;
  if (v === "30/50") return "30_50";
  if (v === "40/60") return "40_60";
  return "other";
}

function mapWaterTreatment(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v || v === "n/a" || v === "none") return null;
  if (v.includes("softener")) return "softener";
  if (v.includes("sediment")) return "sediment_filter";
  return "other";
}

function mapWireType(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  if (v.startsWith("8")) return "8";
  if (v.startsWith("10")) return "10";
  if (v.startsWith("12")) return "12";
  if (v.toLowerCase().includes("2 wire") || v.toLowerCase().includes("2-wire")) return "2_wire";
  if (v.toLowerCase().includes("3 wire") || v.toLowerCase().includes("3-wire")) return "3_wire";
  return "other";
}

function mapControlBox(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v === "ok") return "ok";
  if (v.includes("not present")) return "not_present";
  if (v.includes("damaged")) return "damaged";
  return null;
}

function mapPressureComponent(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v.includes("visibly present") || v.includes("intact")) return "visibly_present_intact";
  if (v.includes("not present") || v.includes("not visible")) return "not_present";
  if (v.includes("non functional") || v.includes("needs attention") || v.includes("damaged")) return "damaged";
  return null;
}

function mapEquipmentStatus(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v) return null;
  if (v.includes("within acceptable range") || v.includes("pass")) return "pass";
  if (v.includes("needs attention")) return "needs_attention";
  return null;
}

function deriveStatus(row: CsvRow): string {
  const statuses = [
    row["External Equipment"],
    row["Internal Equipment"],
    row["Cycle Time Observation"],
    row["Well Yield Observation"],
  ];
  if (statuses.every((s) => s.trim().toLowerCase().includes("within acceptable range"))) {
    return "green";
  }
  return "yellow";
}

// ─── Entity caches ────────────────────────────────────────────────────────────

const vendorCache = new Map<string, string>(); // normalizedName → id
const inspectorCache = new Map<string, string>(); // "name|company" → id
const memberCache = new Map<string, string>(); // "email:x" or "name:f|l|phone" → id

function normalizeCompany(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function inspectorCacheKey(name: string, company: string): string {
  return `${name.toLowerCase().trim()}|${company.toLowerCase().trim()}`;
}

function memberCacheKey(
  email: string | null,
  firstName: string,
  lastName: string,
  phone: string | null,
): string {
  if (email) return `email:${email.toLowerCase().trim()}`;
  return `name:${firstName.toLowerCase()}|${lastName.toLowerCase()}|${(phone ?? "").replace(/\D/g, "")}`;
}

function parseMemberName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  const lastName = parts[parts.length - 1];
  const firstName = parts.slice(0, -1).join(" ");
  return { firstName, lastName };
}

async function preloadCaches(): Promise<void> {
  const vendors = await prisma.vendor.findMany({
    select: { id: true, companyName: true },
  });
  for (const v of vendors) {
    vendorCache.set(normalizeCompany(v.companyName), v.id);
  }

  const inspectors = await prisma.inspector.findMany({
    select: { id: true, name: true, company: true },
  });
  for (const i of inspectors) {
    inspectorCache.set(inspectorCacheKey(i.name, i.company ?? ""), i.id);
  }

  const members = await prisma.member.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, phone: true },
  });
  for (const m of members) {
    const key = memberCacheKey(m.email ?? null, m.firstName, m.lastName, m.phone ?? null);
    memberCache.set(key, m.id);
  }

  console.log(
    `Preloaded caches — vendors: ${vendors.length}, inspectors: ${inspectors.length}, members: ${members.length}`,
  );
}

async function findOrCreateVendor(
  companyName: string,
  phone: string | null,
  email: string | null,
): Promise<string> {
  const key = normalizeCompany(companyName);
  if (vendorCache.has(key)) return vendorCache.get(key)!;

  const vendor = await prisma.vendor.create({
    data: { companyName, vendorType: "Inspector", phone, email },
    select: { id: true },
  });
  console.log(`    [vendor+] ${companyName}`);
  vendorCache.set(key, vendor.id);
  return vendor.id;
}

async function findOrCreateInspector(
  name: string,
  company: string,
  phone: string | null,
  email: string | null,
  vendorId: string | null,
): Promise<string> {
  const key = inspectorCacheKey(name, company);
  if (inspectorCache.has(key)) return inspectorCache.get(key)!;

  const inspector = await prisma.inspector.create({
    data: { name, company, phone, email, vendorId },
    select: { id: true },
  });
  console.log(`    [inspector+] ${name} @ ${company}`);
  inspectorCache.set(key, inspector.id);
  return inspector.id;
}

async function findOrCreateMember(
  fullName: string,
  email: string | null,
  phone: string | null,
  address: string | null,
): Promise<string> {
  const { firstName, lastName } = parseMemberName(fullName);
  const key = memberCacheKey(email, firstName, lastName, phone);
  if (memberCache.has(key)) return memberCache.get(key)!;

  const member = await prisma.member.create({
    data: { firstName, lastName, email, phone, serviceAddress: address },
    select: { id: true },
  });
  memberCache.set(key, member.id);
  return member.id;
}

// ─── CSV row type ─────────────────────────────────────────────────────────────

interface CsvRow {
  "Complete": string;
  "Reviewed By": string;
  "Inspection Date": string;
  "Inspection Time": string;
  "Inspection Company": string;
  "Inspector": string;
  "Inspector Phone Number": string;
  "Inspector Email Address": string;
  "Member Name": string;
  "Member Phone Number": string;
  "Member Email Address": string;
  "Street Address 1": string;
  "Street Address 2": string;
  "City": string;
  "County": string;
  "State": string;
  "ZIP Code": string;
  "Member Email Address 2": string;
  "Realtor Involved": string;
  "Requested by Realtor": string;
  "Realtor Name": string;
  "Realtor Email Address": string;
  "Realtor Phone Number": string;
  "Realtor Phone Number Type": string;
  "Well Type": string;
  "Completion Month/Year": string;
  "Well Permit Number": string;
  "Obstruction": string;
  "Depth": string;
  "Data Source": string;
  "Casing Type": string;
  "Well Cap": string;
  "Pump Manufacturer": string;
  "HP": string;
  "Type": string;
  "Amperage Reading": string;
  "Tank Brand": string;
  "Tank Model": string;
  "Tank Size": string;
  "Tank Condition": string;
  "PSI Settings": string;
  "Control Box Condition": string;
  "Water Conditioning Equipment Description": string;
  "Wire Gauge": string;
  "Constant Pressure System": string;
  "Pressure Switch": string;
  "Pressure Gauge": string;
  "Total Gallons": string;
  "Well Yield": string;
  "Calculated Daily Yield (GPM)": string;
  "Cycle Time": string;
  "External Equipment": string;
  "Internal Equipment": string;
  "Cycle Time Observation": string;
  "Well Yield Observation": string;
  "Eligible for Superior": string;
  "Date Completed": string;
  "Primary Facility ID": string;
  "Created Date/Time": string;
  "Modified Date/Time": string;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\nCSV not found: ${CSV_PATH}\n`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_PATH);
  const rows: CsvRow[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    relax_column_count: true,
    relax_quotes: true,
  });
  console.log(`\nParsed ${rows.length} rows from CSV.\n`);

  // Step 1: wipe all inspections (cascades to YieldTest, InspectionPhoto, PdfGeneration)
  console.log("Deleting all existing inspections...");
  const { count: deleted } = await prisma.inspection.deleteMany({});
  console.log(`Deleted ${deleted} inspection(s).\n`);

  // Step 2: preload entity caches
  await preloadCaches();
  console.log();

  let inserted = 0;
  let skipped = 0;
  let errors = 0;
  const createdAtUpdates: Array<{ id: string; createdAt: Date }> = [];

  for (const row of rows) {
    const homeownerName = clean(row["Member Name"]);
    const propertyAddress = clean(row["Street Address 1"]);

    if (!homeownerName || !propertyAddress) {
      skipped++;
      continue;
    }

    const inspectionDate = parseInspectionDate(row["Inspection Date"], row["Inspection Time"]);
    if (!inspectionDate) {
      console.log(`  [skip] Bad date: ${homeownerName}`);
      skipped++;
      continue;
    }

    try {
      const companyName = clean(row["Inspection Company"]);
      const inspectorName = clean(row["Inspector"]);
      const inspectorPhone = clean(row["Inspector Phone Number"]);
      const inspectorEmail = clean(row["Inspector Email Address"]);

      // Find or create Vendor (inspection company)
      let vendorId: string | null = null;
      if (companyName) {
        vendorId = await findOrCreateVendor(companyName, inspectorPhone, inspectorEmail);
      }

      // Find or create Inspector (individual)
      let inspectorId: string | null = null;
      if (inspectorName && companyName) {
        inspectorId = await findOrCreateInspector(
          inspectorName,
          companyName,
          inspectorPhone,
          inspectorEmail,
          vendorId,
        );
      }

      // Find or create Member
      const memberEmail = clean(row["Member Email Address"]);
      const memberPhone = clean(row["Member Phone Number"]);
      const memberId = await findOrCreateMember(
        homeownerName,
        memberEmail,
        memberPhone,
        propertyAddress,
      );

      // Depth handling: ranges and "Unknown" can't map to a float
      const depthRaw = row["Depth"].trim().toLowerCase();
      const wellDepthUnknown = depthRaw === "unknown" || depthRaw === "";
      const wellDepthFt = wellDepthUnknown ? null : parseNum(row["Depth"]);

      const isComplete = parseGlyphicon(row["Complete"]);

      const inspection = await prisma.inspection.create({
        data: {
          // Relations
          memberId,
          vendorId,
          inspectorId,

          // Member & Property
          homeownerName,
          homeownerEmail:   memberEmail,
          homeownerEmail2:  clean(row["Member Email Address 2"]),
          homeownerPhone:   memberPhone,
          propertyAddress,
          propertyAddress2: clean(row["Street Address 2"]),
          city:             clean(row["City"]),
          county:           clean(row["County"]),
          state:            clean(row["State"]),
          zip:              clean(row["ZIP Code"]),

          // Realtor
          realtorInvolved:    parseBoolean(row["Realtor Involved"]),
          requestedByRealtor: parseBoolean(row["Requested by Realtor"]),
          realtorName:        clean(row["Realtor Name"]),
          realtorEmail:       clean(row["Realtor Email Address"]),
          realtorPhone:       clean(row["Realtor Phone Number"]),
          realtorPhoneType:   clean(row["Realtor Phone Number Type"]),

          // Source
          inspectorName:     inspectorName,
          inspectionCompany: companyName,
          inspectionDate,

          // Well System
          wellType:         mapWellType(row["Well Type"]),
          wellDepthFt,
          wellDepthUnknown,
          pumpType:         mapPumpType(row["Type"]),
          pumpManufacturer: mapPumpManufacturer(row["Pump Manufacturer"]),
          pumpHp:           mapPumpHp(row["HP"]),

          // External Equipment
          wellCompletionDate:        clean(row["Completion Month/Year"]),
          wellCompletionDateUnknown: !row["Completion Month/Year"].trim(),
          wellPermit:                clean(row["Well Permit Number"]),
          wellPermitUnknown:         !row["Well Permit Number"].trim(),
          wellDataSource:            mapWellDataSource(row["Data Source"]),
          wellObstructions:          mapObstruction(row["Obstruction"]),
          wellCap:                   mapWellCap(row["Well Cap"]),
          casingType:                mapCasingType(row["Casing Type"]),

          // Internal Equipment
          amperageReading:       parseAmperage(row["Amperage Reading"]),
          tankCondition:         mapTankCondition(row["Tank Condition"]),
          tankBrand:             mapTankBrand(row["Tank Brand"]),
          tankModel:             clean(row["Tank Model"]),
          tankSizeGal:           parseNum(row["Tank Size"]),
          psiSettings:           mapPsiSettings(row["PSI Settings"]),
          controlBoxCondition:   mapControlBox(row["Control Box Condition"]),
          waterTreatment:        mapWaterTreatment(row["Water Conditioning Equipment Description"]),
          wireType:              mapWireType(row["Wire Gauge"]),
          constantPressureSystem: parseBoolean(row["Constant Pressure System"]),
          pressureSwitch:        mapPressureComponent(row["Pressure Switch"]),
          pressureGauge:         mapPressureComponent(row["Pressure Gauge"]),

          // Computed / yield (stored from CSV — recalculated on edit)
          totalGallons:  parseNum(row["Total Gallons"]),
          wellYieldGpm:  parseNum(row["Well Yield"]),
          gallonsPerDay: parseInt_(row["Calculated Daily Yield (GPM)"]),
          cycleTime:     parseNum(row["Cycle Time"]),

          // Category statuses
          externalEquipmentStatus: mapEquipmentStatus(row["External Equipment"]),
          internalEquipmentStatus: mapEquipmentStatus(row["Internal Equipment"]),
          cycleTimeStatus:         mapEquipmentStatus(row["Cycle Time Observation"]),
          wellYieldStatus:         mapEquipmentStatus(row["Well Yield Observation"]),

          // Eligibility — CSV uses HTML checkmark div, empty, or "Yes"/"No" text
          eligibleForSuperior: parseGlyphicon(row["Eligible for Superior"])
            ? true
            : row["Eligible for Superior"].trim().toLowerCase() === "no"
            ? false
            : null,

          // Notes
          internalReviewerNotes: clean(row["Reviewed By"]),

          // Status derived from the 4 category fields
          systemStatus: deriveStatus(row),
          finalStatus:  deriveStatus(row),

          isDraft: !isComplete,
          wellCalculationVersion: 2,
        },
        select: { id: true },
      });

      const createdAt = parseTimestamp(row["Created Date/Time"]);
      if (createdAt) createdAtUpdates.push({ id: inspection.id, createdAt });

      console.log(`  [ok] ${homeownerName} @ ${propertyAddress}`);
      inserted++;
    } catch (err) {
      console.error(`  [err] ${homeownerName} @ ${propertyAddress}:`, err);
      errors++;
    }
  }

  // Step 3: backfill createdAt in batched transactions (avoid 5s default timeout)
  if (createdAtUpdates.length) {
    console.log(`\nBackfilling createdAt for ${createdAtUpdates.length} records...`);
    const CHUNK = 200;
    for (let i = 0; i < createdAtUpdates.length; i += CHUNK) {
      const chunk = createdAtUpdates.slice(i, i + CHUNK);
      await prisma.$transaction(
        chunk.map(({ id, createdAt }) =>
          prisma.$executeRaw`UPDATE "Inspection" SET "createdAt" = ${createdAt} WHERE id = ${id}`,
        ),
        { timeout: 30000 },
      );
    }
    console.log("createdAt backfill complete.");
  }

  console.log(`\n─────────────────────────────────────`);
  console.log(`  Inserted : ${inserted}`);
  console.log(`  Skipped  : ${skipped}`);
  console.log(`  Errors   : ${errors}`);
  console.log(`  Vendors  : ${vendorCache.size} in cache`);
  console.log(`  Inspectors: ${inspectorCache.size} in cache`);
  console.log(`  Members  : ${memberCache.size} in cache`);
  console.log(`─────────────────────────────────────\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
