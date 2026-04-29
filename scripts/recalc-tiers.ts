/**
 * One-time script: recalculate membershipTier, systemStatus, finalStatus
 * for all inspections using the stored category statuses.
 *
 * The seed script used a simplified deriveStatus() that only produced
 * "green" or "yellow". This script applies the real tier logic.
 *
 * Tier rules (mirrors calculateInspection() in src/lib/inspection-calc.ts):
 *   Premium    – all 4 categories pass + state not in [CA, TX, FL]  → "green"
 *   Superior   – eligibleForSuperior === true                         → "yellow"
 *   Ineligible – internal OR cycle needs_attention, OR ineligible state → "ineligible"
 *   Standard   – everything else (determined but no higher tier)      → "red"
 *
 * Category statuses were imported directly from the source system CSV
 * and are authoritative; we trust them here.
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const INELIGIBLE_STATES = ["CA", "TX", "FL"];

function normalizeState(state: string | null): string {
  if (!state) return "";
  const abbrevMap: Record<string, string> = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR",
    "california": "CA", "colorado": "CO", "connecticut": "CT", "delaware": "DE",
    "florida": "FL", "georgia": "GA", "hawaii": "HI", "idaho": "ID",
    "illinois": "IL", "indiana": "IN", "iowa": "IA", "kansas": "KS",
    "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS",
    "missouri": "MO", "montana": "MT", "nebraska": "NE", "nevada": "NV",
    "new hampshire": "NH", "new jersey": "NJ", "new mexico": "NM", "new york": "NY",
    "north carolina": "NC", "north dakota": "ND", "ohio": "OH", "oklahoma": "OK",
    "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT",
    "vermont": "VT", "virginia": "VA", "washington": "WA", "west virginia": "WV",
    "wisconsin": "WI", "wyoming": "WY",
  };
  const cleaned = state.trim().replace(/\.$/, ""); // strip trailing dot
  return abbrevMap[cleaned.toLowerCase()] ?? cleaned.toUpperCase();
}

async function main() {
  const rows = await prisma.inspection.findMany({
    select: {
      id: true,
      externalEquipmentStatus: true,
      internalEquipmentStatus: true,
      cycleTimeStatus:          true,
      wellYieldStatus:          true,
      eligibleForSuperior:      true,
      state:                    true,
    },
  });

  console.log(`\nLoaded ${rows.length} inspections. Computing tiers...\n`);

  const tierGroups: Record<string, string[]> = {
    premium:    [],
    superior:   [],
    ineligible: [],
    standard:   [],
    indeterminate: [],
  };

  for (const row of rows) {
    const { externalEquipmentStatus: ext, internalEquipmentStatus: int_,
            cycleTimeStatus: cycle, wellYieldStatus: yield_, eligibleForSuperior, state } = row;

    const allDetermined = ext !== null && int_ !== null && cycle !== null && yield_ !== null;

    if (!allDetermined) {
      tierGroups.indeterminate.push(row.id);
      continue;
    }

    const normalizedState = normalizeState(state);
    const stateIneligible = !!normalizedState && INELIGIBLE_STATES.includes(normalizedState);
    const majorItemsFail = int_ === "needs_attention" || cycle === "needs_attention";
    const allPass = ext === "pass" && int_ === "pass" && cycle === "pass" && yield_ === "pass";

    if (allPass && !stateIneligible) {
      tierGroups.premium.push(row.id);
    } else if (eligibleForSuperior === true) {
      tierGroups.superior.push(row.id);
    } else if (stateIneligible || majorItemsFail) {
      tierGroups.ineligible.push(row.id);
    } else {
      tierGroups.standard.push(row.id);
    }
  }

  console.log("Computed distribution:");
  console.log(`  Premium    : ${tierGroups.premium.length}`);
  console.log(`  Superior   : ${tierGroups.superior.length}`);
  console.log(`  Standard   : ${tierGroups.standard.length}`);
  console.log(`  Ineligible : ${tierGroups.ineligible.length}`);
  console.log(`  Indeterminate: ${tierGroups.indeterminate.length}`);
  console.log();

  const updates: Array<Promise<unknown>> = [];

  if (tierGroups.premium.length) {
    updates.push(prisma.inspection.updateMany({
      where: { id: { in: tierGroups.premium } },
      data: { membershipTier: "premium", systemStatus: "green", finalStatus: "green" },
    }));
  }
  if (tierGroups.superior.length) {
    updates.push(prisma.inspection.updateMany({
      where: { id: { in: tierGroups.superior } },
      data: { membershipTier: "superior", systemStatus: "yellow", finalStatus: "yellow" },
    }));
  }
  if (tierGroups.ineligible.length) {
    updates.push(prisma.inspection.updateMany({
      where: { id: { in: tierGroups.ineligible } },
      data: { membershipTier: "ineligible", systemStatus: "ineligible", finalStatus: "ineligible" },
    }));
  }
  if (tierGroups.standard.length) {
    updates.push(prisma.inspection.updateMany({
      where: { id: { in: tierGroups.standard } },
      data: { membershipTier: "standard", systemStatus: "red", finalStatus: "red" },
    }));
  }
  // Indeterminate: leave as-is (no complete data to decide)

  console.log("Writing updates...");
  await Promise.all(updates);
  console.log("Done.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
