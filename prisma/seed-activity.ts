/**
 * Retroactive activity log seed.
 * Creates "created" entries for all existing records using their real createdAt timestamps.
 * Safe to run on the production DB — append-only, never deletes anything.
 *
 * Run: npx tsx prisma/seed-activity.ts
 */

import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding retroactive activity log…\n");

  // Fetch all existing records
  const [inspections, serviceTickets, vendors, inspectors, pdfGenerations, users] =
    await Promise.all([
      prisma.inspection.findMany({
        select: {
          id: true, homeownerName: true, propertyAddress: true, createdAt: true,
          finalStatus: true, isDraft: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.serviceTicket.findMany({
        select: {
          id: true, ticketNumber: true, memberFirstName: true, memberLastName: true,
          streetAddress: true, city: true, createdAt: true,
        },
        orderBy: { createdAt: "asc" },
      }),
      prisma.vendor.findMany({
        select: { id: true, companyName: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.inspector.findMany({
        select: { id: true, name: true, company: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.pdfGeneration.findMany({
        select: {
          id: true, inspectionId: true, url: true, generatedAt: true,
          inspection: { select: { homeownerName: true, propertyAddress: true } },
        },
        orderBy: { generatedAt: "asc" },
      }),
      prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const logs: Parameters<typeof prisma.activityLog.create>[0]["data"][] = [];

  // Inspections
  for (const insp of inspections) {
    const label = `${insp.homeownerName} – ${insp.propertyAddress}`;
    logs.push({
      createdAt:   insp.createdAt,
      actorName:   "System (historical)",
      entityType:  "inspection",
      entityId:    insp.id,
      entityLabel: label,
      action:      "created",
      description: `Inspection created for ${label}${insp.isDraft ? " (draft)" : ""}`,
    });
  }

  // Service tickets
  for (const ticket of serviceTickets) {
    const memberName = `${ticket.memberFirstName} ${ticket.memberLastName}`.trim();
    const label = `Ticket #${ticket.ticketNumber} – ${memberName}`;
    logs.push({
      createdAt:   ticket.createdAt,
      actorName:   "System (historical)",
      entityType:  "service_ticket",
      entityId:    ticket.id,
      entityLabel: label,
      action:      "created",
      description: `Service ticket created: ${label} at ${ticket.streetAddress}${ticket.city ? `, ${ticket.city}` : ""}`,
    });
  }

  // Vendors
  for (const vendor of vendors) {
    logs.push({
      createdAt:   vendor.createdAt,
      actorName:   "System (historical)",
      entityType:  "vendor",
      entityId:    vendor.id,
      entityLabel: vendor.companyName,
      action:      "created",
      description: `Vendor company added: "${vendor.companyName}"`,
    });
  }

  // Inspectors
  for (const inspector of inspectors) {
    logs.push({
      createdAt:   inspector.createdAt,
      actorName:   "System (historical)",
      entityType:  "inspector",
      entityId:    inspector.id,
      entityLabel: inspector.name,
      action:      "created",
      description: `Inspector added: "${inspector.name}"${inspector.company ? ` (${inspector.company})` : ""}`,
    });
  }

  // PDF generations
  for (const pdf of pdfGenerations) {
    const label = pdf.inspection
      ? `${pdf.inspection.homeownerName} – ${pdf.inspection.propertyAddress}`
      : pdf.inspectionId;
    logs.push({
      createdAt:   pdf.generatedAt,
      actorName:   "System (historical)",
      entityType:  "pdf",
      entityId:    pdf.inspectionId,
      entityLabel: label,
      action:      "generated",
      description: `PDF report generated for ${label}`,
    });
  }

  // Users (skip system/default accounts with no meaningful context)
  for (const user of users) {
    const displayName = user.name ?? user.email;
    logs.push({
      createdAt:   user.createdAt,
      actorName:   "System (historical)",
      entityType:  "user",
      entityId:    user.id,
      entityLabel: displayName,
      action:      "created",
      description: `${user.role} account created for "${displayName}"`,
    });
  }

  // Write in batches of 100
  const BATCH = 100;
  let inserted = 0;
  for (let i = 0; i < logs.length; i += BATCH) {
    await prisma.activityLog.createMany({ data: logs.slice(i, i + BATCH) });
    inserted += Math.min(BATCH, logs.length - i);
    process.stdout.write(`\r  Inserted ${inserted}/${logs.length}`);
  }

  console.log(`\n\nDone — seeded ${logs.length} historical activity entries.`);
  console.log(`  Inspections:     ${inspections.length}`);
  console.log(`  Service tickets: ${serviceTickets.length}`);
  console.log(`  Vendors:         ${vendors.length}`);
  console.log(`  Inspectors:      ${inspectors.length}`);
  console.log(`  PDFs:            ${pdfGenerations.length}`);
  console.log(`  Users:           ${users.length}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
