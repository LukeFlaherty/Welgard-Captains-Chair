/**
 * One-time seed script to import vendors from a CSV export.
 * Usage: npx tsx scripts/seed-vendors.ts [path/to/Vendor.csv]
 *
 * Default CSV path: scripts/data/Vendor.csv
 * Place the exported Vendor.csv in that location, then run:
 *   npm run seed-vendors
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

const CSV_PATH = process.argv[2] ?? path.join(__dirname, "data", "Vendor.csv");

// The CSV encodes "Available After Hours = true" as an HTML span with glyphicon-ok
function parseAfterHours(raw: string): boolean {
  return raw.includes("glyphicon-ok");
}

// Parse MM/DD/YYYY or other date strings — returns null if invalid/empty
function parseDate(raw: string): Date | null {
  if (!raw.trim()) return null;
  const d = new Date(raw.trim());
  return isNaN(d.getTime()) ? null : d;
}

// Clean empty strings to null
function clean(v: string): string | null {
  const trimmed = v?.trim();
  return trimmed ? trimmed : null;
}

// Rating field holds "1" | "2" | "3" | "Prospect" | ""
function parseRating(raw: string): string | null {
  const v = raw.trim();
  if (["1", "2", "3", "Prospect"].includes(v)) return v;
  return null;
}

// Normalize vendor type — strip junk, return null if unrecognised
const VALID_TYPES = new Set([
  "Contractor", "Inspector", "Water Treatment",
  "Real Estate Agent", "Admin", "Other",
]);

function parseVendorType(raw: string): string | null {
  const v = raw.trim();
  return VALID_TYPES.has(v) ? v : null;
}

interface CsvRow {
  Name: string;
  "Email Address": string;
  "Vendor Type": string;
  "Phone Number": string;
  "Phone Number 2": string;
  "Phone Number 3": string;
  "Street Address 1": string;
  "Street Address 2": string;
  City: string;
  County: string;
  State: string;
  "ZIP Code": string;
  "Tax ID": string;
  "Vendor Rating": string;
  Notes: string;
  "Available After Hours": string;
  "Availability Notes": string;
  "Start Date": string;
  "Website URL": string;
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\nCSV file not found: ${CSV_PATH}`);
    console.error(`Place the Vendor.csv file at: scripts/data/Vendor.csv\n`);
    process.exit(1);
  }

  const raw = fs.readFileSync(CSV_PATH);
  const rows: CsvRow[] = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    // The file starts with a UTF-8 BOM (ï»¿) — strip it
    bom: true,
    relax_column_count: true,
  });

  console.log(`\nParsed ${rows.length} rows from CSV.\n`);

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const row of rows) {
    const companyName = clean(row["Name"]);
    if (!companyName) {
      skipped++;
      continue;
    }

    // Skip rows that are clearly internal tracking entries with no real data
    const email = clean(row["Email Address"]);
    if (!email && !clean(row["Phone Number"]) && !clean(row["City"])) {
      // Only skip if also no vendor type (e.g. blank admin placeholder rows)
      if (!clean(row["Vendor Type"])) {
        skipped++;
        continue;
      }
    }

    // Deduplicate: if a vendor with the same name already exists, skip
    const existing = await prisma.vendor.findFirst({
      where: { companyName },
      select: { id: true },
    });
    if (existing) {
      console.log(`  [skip] Already exists: ${companyName}`);
      skipped++;
      continue;
    }

    try {
      await prisma.vendor.create({
        data: {
          companyName,
          vendorType:          parseVendorType(row["Vendor Type"]),
          email,
          phone:               clean(row["Phone Number"]),
          phone2:              clean(row["Phone Number 2"]),
          phone3:              clean(row["Phone Number 3"]),
          streetAddress:       clean(row["Street Address 1"]),
          streetAddress2:      clean(row["Street Address 2"]),
          city:                clean(row["City"]),
          county:              clean(row["County"]),
          state:               clean(row["State"]),
          zip:                 clean(row["ZIP Code"]),
          taxId:               clean(row["Tax ID"]),
          rating:              parseRating(row["Vendor Rating"]),
          notes:               clean(row["Notes"]),
          availableAfterHours: parseAfterHours(row["Available After Hours"]),
          availabilityNotes:   clean(row["Availability Notes"]),
          startDate:           parseDate(row["Start Date"]),
          websiteUrl:          clean(row["Website URL"]),
        },
      });
      console.log(`  [ok]   ${companyName}`);
      inserted++;
    } catch (err) {
      console.error(`  [err]  ${companyName}:`, err);
      errors++;
    }
  }

  console.log(`\n─────────────────────────────`);
  console.log(`  Inserted: ${inserted}`);
  console.log(`  Skipped:  ${skipped}`);
  console.log(`  Errors:   ${errors}`);
  console.log(`─────────────────────────────\n`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
