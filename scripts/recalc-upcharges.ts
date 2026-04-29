/**
 * One-time script: backfill the `upcharges` array on all existing inspections.
 * Rules (mirrors calculateInspection() in src/lib/inspection-calc.ts):
 *   "cps"        — constantPressureSystem = true
 *   "deep_well"  — wellDepthFt > 500 (skipped if wellDepthUnknown = true or depth is null)
 *   "large_tank" — tankSizeGal > 60 (skipped if null)
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rows = await prisma.inspection.findMany({
    select: {
      id:                    true,
      constantPressureSystem: true,
      wellDepthFt:           true,
      wellDepthUnknown:      true,
      tankSizeGal:           true,
    },
  });

  console.log(`\nLoaded ${rows.length} inspections. Computing upcharges...\n`);

  const groups: Record<string, string[][]> = {};
  const dist: Record<string, number> = {};

  const updates: Array<{ id: string; upcharges: string[] }> = [];

  for (const row of rows) {
    const upcharges: string[] = [];
    if (row.constantPressureSystem) upcharges.push("cps");
    if (!row.wellDepthUnknown && row.wellDepthFt != null && row.wellDepthFt > 500) upcharges.push("deep_well");
    if (row.tankSizeGal != null && row.tankSizeGal > 60) upcharges.push("large_tank");
    updates.push({ id: row.id, upcharges });

    const key = upcharges.length === 0 ? "(none)" : upcharges.join("+");
    dist[key] = (dist[key] ?? 0) + 1;
  }

  console.log("Upcharge distribution:");
  for (const [key, count] of Object.entries(dist).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${count.toString().padStart(4)}  ${key}`);
  }
  console.log();

  // Batch updates — 200 at a time
  const CHUNK = 200;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    await prisma.$transaction(
      chunk.map(({ id, upcharges }) =>
        prisma.inspection.update({ where: { id }, data: { upcharges } })
      ),
      { timeout: 30000 }
    );
  }

  const total = updates.filter((u) => u.upcharges.length > 0).length;
  console.log(`Updated ${updates.length} inspections. ${total} have at least one upcharge flag.\n`);
  console.log("Done.\n");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
