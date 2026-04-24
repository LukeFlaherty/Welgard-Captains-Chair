/**
 * One-time seed script to import inspections from a CSV export.
 * Usage: npx tsx scripts/seed-inspections.ts [path/to/Inspection.csv]
 *
 * Default CSV path: scripts/data/Inspection.csv
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

const CSV_PATH = process.argv[2] ?? path.join(__dirname, "data", "Inspection.csv");

// ─── Value parsers ─────────────────────────────────────────────────────────────

function clean(v: string | undefined): string | null {
  const t = v?.trim();
  return t ? t : null;
}

function parseBoolean(raw: string): boolean {
  return raw.trim().toLowerCase() === "yes" || raw.includes("glyphicon-ok");
}

function parseComplete(raw: string): boolean {
  return raw.includes("glyphicon-ok");
}

function parseFloat_(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = parseFloat(t);
  return isNaN(n) ? null : n;
}

function parseInt_(raw: string): number | null {
  const n = parseFloat_(raw);
  return n == null ? null : Math.round(n);
}

// Amperage ranges → float midpoint
function parseAmperage(raw: string): number | null {
  const t = raw.trim().toLowerCase();
  if (!t) return null;
  if (t.includes("less than 5")) return 4.0;
  if (t.includes("over 11.99")) return 13.0;
  // "X - Y amps" → midpoint
  const m = t.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (m) return (parseFloat(m[1]) + parseFloat(m[2])) / 2;
  return null;
}

// Parse "MM/DD/YYYY" + optional "HH:MM" into DateTime
function parseInspectionDate(dateRaw: string, timeRaw: string): Date | null {
  const d = dateRaw.trim();
  if (!d) return null;
  const t = timeRaw.trim() || "00:00";
  const dt = new Date(`${d} ${t}`);
  return isNaN(dt.getTime()) ? null : dt;
}

// ─── Enum mappers ──────────────────────────────────────────────────────────────

function mapWellType(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v === "drilled") return "drilled";
  if (v === "bored") return "bored";
  if (v === "hand dug") return "hand_dug";
  if (v === "stick") return "stick";
  if (v === "artesian") return "artesian";
  if (v === "driven point") return "driven_point";
  if (!v) return null;
  return "other";
}

function mapPumpType(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v === "submersible") return "submersible";
  if (v.includes("jet")) return "jet";
  if (v.includes("constant")) return "constant_pressure";
  if (v === "hand") return "hand";
  if (!v) return null;
  return "other";
}

function mapPumpManufacturer(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v === "unknown" || v === "") return "unknown";
  if (v === "franklin") return "franklin";
  if (v === "goulds") return "goulds";
  if (v === "grundfos") return "grundfos";
  if (!raw.trim()) return null;
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
  if (v === "pvc") return "pvc";
  if (v === "steel") return "steel";
  if (!v) return null;
  return "other";
}

function mapWellCap(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v.includes("not applicable") || v.includes("buried")) return "not_applicable_buried";
  if (v.includes("secured") || v.includes("bolted")) return "secured_bolted";
  if (v.includes("sealed") || v.includes("contamination")) return "sealed_contamination_resistant";
  if (v.includes("bored well")) return "bored_well";
  if (v.includes("unsecured") || v.includes("open")) return "unsecured_open";
  if (v.includes("missing") || v.includes("damaged")) return "missing_damaged";
  if (!v) return null;
  return "other";
}

function mapObstruction(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v === "none") return "none";
  if (v === "ornamental") return "ornamental";
  if (v === "buried") return "buried";
  if (v.includes("vegetation") || v.includes("overgrowth")) return "vegetation";
  if (v.includes("debris")) return "debris";
  if (v.includes("interior") || v.includes("basement") || v.includes("crawl")) return "structural";
  if (!v) return null;
  return "other";
}

function mapWellDataSource(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v.includes("homeowner")) return "homeowner";
  if (v.includes("official") || v.includes("permit")) return "official";
  if (v.includes("notation")) return "notation_near_well";
  if (!v || v.includes("no data")) return "other";
  return "other";
}

function mapTankCondition(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v.includes("good")) return "good";
  if (v.includes("fair")) return "fair";
  if (v.includes("poor")) return "poor";
  if (v.includes("failed") || v.includes("replace") || v.includes("waterlogged")) return "failed";
  if (!v) return null;
  return null;
}

function mapTankBrand(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v || v === "other") return "other";
  if (v.includes("welxtrol") || v.includes("wel x trol") || v.includes("wsx") || v.includes("lpt")) return "welxtrol";
  if (v === "state") return "state";
  return "other";
}

function mapPsiSettings(raw: string): string | null {
  const v = raw.trim().replace(/\s/g, "");
  if (v === "30/50") return "30_50";
  if (v === "40/60") return "40_60";
  if (!raw.trim()) return null;
  return "other";
}

function mapWaterTreatment(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (!v || v === "n/a") return null;
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
  if (v === "ok") return "ok";
  if (v.includes("not present")) return "not_present";
  if (v.includes("damaged")) return "damaged";
  if (!v) return null;
  return null;
}

function mapPressureComponent(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v.includes("visibly present") || v.includes("intact")) return "visibly_present_intact";
  if (v.includes("not present") || v.includes("not visible")) return "not_present";
  if (v.includes("non functional") || v.includes("needs attention") || v.includes("damaged")) return "damaged";
  if (!v) return null;
  return null;
}

function mapEquipmentStatus(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  if (v.includes("within acceptable range") || v.includes("pass")) return "pass";
  if (v.includes("needs attention")) return "needs_attention";
  if (!v) return null;
  return null;
}

// Map PSI settings from display format "40 / 60" to enum
// (already handled in mapPsiSettings but PSI Settings in CSV uses spaces around slash)
function mapTankBrandFromModel(brand: string, model: string): string | null {
  const b = brand.trim().toLowerCase();
  const m = model.trim().toLowerCase();
  if (b === "other") {
    // Try to infer from model number
    if (m.includes("lpt") || m.includes("wsx") || m.includes("wel")) return "welxtrol";
    return "other";
  }
  return mapTankBrand(brand);
}

// ─── Vendor slug → vendorId lookup ───────────────────────────────────────────

async function findVendorId(slug: string): Promise<string | null> {
  if (!slug) return null;
  const s = slug.trim().toLowerCase();
  const vendors = await prisma.vendor.findMany({ select: { id: true, companyName: true } });
  // Exact slug match (case-insensitive) against companyName with spaces removed
  const normalized = vendors.find(
    (v) => v.companyName.toLowerCase().replace(/\s+/g, "") === s.replace(/\s+/g, "")
  );
  if (normalized) return normalized.id;
  // Partial: vendor name contains slug
  const partial = vendors.find(
    (v) => v.companyName.toLowerCase().includes(s) || s.includes(v.companyName.toLowerCase().split(" ")[0])
  );
  return partial?.id ?? null;
}

// ─── Inspector name → inspectorId lookup ─────────────────────────────────────

async function findInspectorId(name: string): Promise<string | null> {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  const inspectors = await prisma.inspector.findMany({ select: { id: true, name: true } });
  const match = inspectors.find((i) => i.name.toLowerCase() === n);
  return match?.id ?? null;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

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

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\nCSV file not found: ${CSV_PATH}`);
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

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const homeownerName = clean(row["Member Name"]);
    const propertyAddress = clean(row["Street Address 1"]);

    if (!homeownerName || !propertyAddress) {
      console.log(`  [skip] Missing required fields`);
      skipped++;
      continue;
    }

    const inspectionDate = parseInspectionDate(row["Inspection Date"], row["Inspection Time"]);
    if (!inspectionDate) {
      console.log(`  [skip] Invalid date for ${homeownerName}`);
      skipped++;
      continue;
    }

    // Dedup: check for existing inspection with same address + date
    const existing = await prisma.inspection.findFirst({
      where: {
        propertyAddress: { equals: propertyAddress, mode: "insensitive" },
        inspectionDate,
      },
      select: { id: true },
    });
    if (existing) {
      console.log(`  [skip] Already exists: ${homeownerName} @ ${propertyAddress}`);
      skipped++;
      continue;
    }

    const vendorId = await findVendorId(row["Primary Facility ID"]);
    const inspectorId = await findInspectorId(row["Inspector"]);

    const depthRaw = row["Depth"].trim().toLowerCase();
    const wellDepthUnknown = depthRaw === "unknown" || depthRaw === "";
    const wellDepthFt = wellDepthUnknown ? null : parseFloat_(row["Depth"]);

    const isComplete = parseComplete(row["Complete"]);

    const tankBrand = mapTankBrandFromModel(row["Tank Brand"], row["Tank Model"]);

    try {
      await prisma.inspection.create({
        data: {
          // Relations
          vendorId,
          inspectorId,

          // Member & Property
          homeownerName,
          homeownerEmail:   clean(row["Member Email Address"]),
          homeownerEmail2:  clean(row["Member Email Address 2"]),
          homeownerPhone:   clean(row["Member Phone Number"]),
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

          // Inspection Source
          inspectorName:     clean(row["Inspector"]),
          inspectionCompany: clean(row["Inspection Company"]),
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
          amperageReading:     parseAmperage(row["Amperage Reading"]),
          tankCondition:       mapTankCondition(row["Tank Condition"]),
          tankBrand,
          tankModel:           clean(row["Tank Model"]),
          tankSizeGal:         parseFloat_(row["Tank Size"]),
          psiSettings:         mapPsiSettings(row["PSI Settings"]),
          controlBoxCondition: mapControlBox(row["Control Box Condition"]),
          waterTreatment:      mapWaterTreatment(row["Water Conditioning Equipment Description"]),
          wireType:            mapWireType(row["Wire Gauge"]),
          constantPressureSystem: parseBoolean(row["Constant Pressure System"]),
          pressureSwitch:      mapPressureComponent(row["Pressure Switch"]),
          pressureGauge:       mapPressureComponent(row["Pressure Gauge"]),

          // Computed fields (stored as-is from CSV)
          totalGallons:        parseFloat_(row["Total Gallons"]),
          wellYieldGpm:        parseFloat_(row["Well Yield"]),
          gallonsPerDay:       parseInt_(row["Calculated Daily Yield (GPM)"]),
          cycleTime:           parseFloat_(row["Cycle Time"]),

          // Category statuses
          externalEquipmentStatus: mapEquipmentStatus(row["External Equipment"]),
          internalEquipmentStatus: mapEquipmentStatus(row["Internal Equipment"]),
          cycleTimeStatus:         mapEquipmentStatus(row["Cycle Time Observation"]),
          wellYieldStatus:         mapEquipmentStatus(row["Well Yield Observation"]),

          // Eligibility (empty in this CSV batch)
          eligibleForSuperior: row["Eligible for Superior"].trim() === "Yes"
            ? true
            : row["Eligible for Superior"].trim() === "No"
            ? false
            : null,

          // Notes & Review
          internalReviewerNotes: clean(row["Reviewed By"]),

          // Status (derive from category statuses)
          systemStatus: deriveStatus(row),
          finalStatus:  deriveStatus(row),

          isDraft: !isComplete,
          wellCalculationVersion: 2,
        },
      });
      console.log(`  [ok]   ${homeownerName} @ ${propertyAddress}`);
      inserted++;
    } catch (err) {
      console.error(`  [err]  ${homeownerName}:`, err);
      errors++;
    }
  }

  console.log(`\n─────────────────────────────`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Errors:   ${errors}`);
  console.log(`─────────────────────────────\n`);
}

// Derive a simple systemStatus from the 4 category fields
function deriveStatus(row: CsvRow): string {
  const statuses = [
    row["External Equipment"],
    row["Internal Equipment"],
    row["Cycle Time Observation"],
    row["Well Yield Observation"],
  ];
  if (statuses.every((s) => s.trim().toLowerCase().includes("within acceptable range"))) return "green";
  return "yellow";
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
