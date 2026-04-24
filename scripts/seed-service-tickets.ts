/**
 * One-time seed script for service tickets.
 * Usage: npx tsx scripts/seed-service-tickets.ts [path/to/Inspection.csv]
 * Default: scripts/data/ServiceTicket.csv
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

// ─── Hardcoded CSV data (from export) ────────────────────────────────────────
// The 5 records from the export, newest first (100635→100631)

const RECORDS = [
  {
    ticketNumber: 100635,
    memberFirstName: "Neal",
    memberLastName: "Barton",
    memberEmail: "neal.barton@zbmidatlantic.com",
    memberPhone: "703-678-9690",
    memberPhoneType: "Cell",
    streetAddress: "3814 Donerin Way",
    city: "Phoenix",
    county: "Baltimore County",
    state: "Maryland",
    zip: "21131",
    serviceType: "general_maintenance",
    status: "scheduled",
    callReceivedAt: new Date("2026-04-24T08:30:00"),
    scheduledFor: new Date("2026-04-27T13:00:00"),
    lastServiceDate: new Date("2023-12-29"),
    serviceCompletedBy: "R&G Water Systems",
    customerInquiry:
      "Experiencing lower pressure after hot water heater was installed. Water pressure initially seems good at hose, but gauge dips to < 20 psi, with no switch turning on - for pump to come on. Member is avail after 1 PM daily.",
    rightOfFirstRefusal: true,
    valvesOpen: "dont_know",
    filterClogged: "dont_know",
    circuitBreakerReset: "dont_know",
    lowPressureSwitch: "dont_know",
    backwashCycle: "yes",
    isComplete: false,
  },
  {
    ticketNumber: 100634,
    memberFirstName: "Cindy",
    memberLastName: "Beavers",
    memberEmail: "cindy.beavers@icloud.com",
    memberPhone: "770-689-6895",
    memberPhoneType: "Cell",
    memberAltPhone: "443-255-7075",
    memberAltPhoneType: "Cell",
    streetAddress: "1640 St Paul St",
    city: "Hampstead",
    county: "Carroll County",
    state: "Maryland",
    zip: "21074",
    serviceType: "emergency",
    status: "completed",
    callReceivedAt: new Date("2026-04-18T21:50:00"),
    scheduledFor: new Date("2026-04-19T12:00:00"),
    lastServiceDate: new Date("2022-07-28"),
    serviceCompletedBy: "Easterday-Wilson Water Services",
    customerInquiry:
      "Member was showering and slowly lost water pressure until it finally stopped. PSI is 10. Resetting the breaker did not restore water. No filtration to be clogged. Son will be home for tech visit.",
    technicianResponse:
      "Eqpmnt and well head under home. Tech found the wiring melted, and the tank leaking due to erosion at base and fittings. Pump working overtime due to smaller tank. Submersible pump, tank, fittings, and wiring were removed and replaced. Water restored.",
    rightOfFirstRefusal: true,
    valvesOpen: "no",
    filterClogged: "yes",
    circuitBreakerReset: "no",
    lowPressureSwitch: "no",
    backwashCycle: "yes",
    invoiceAmount: 5701.18,
    invoicePaymentType: "Credit Card",
    invoiceAttachment: "Easterday - $5701.18 - 1640 St Paul 04192026.pdf",
    isComplete: true,
    ticketCompletedBy: "williams.angelmarie@gmail.com",
  },
  {
    ticketNumber: 100633,
    memberFirstName: "Sal",
    memberLastName: "Espinoza",
    memberEmail: "sal507@aol.com",
    memberPhone: "708-275-7546",
    streetAddress: "4454 Robert Drive",
    city: "Valdosta",
    county: "Lowndes County",
    state: "Georgia",
    zip: "31605",
    serviceType: "emergency",
    status: "in_progress",
    callReceivedAt: new Date("2026-04-14T01:45:00"),
    scheduledFor: new Date("2026-04-14T15:00:00"),
    lastServiceDate: new Date("2025-12-21"),
    serviceCompletedBy: "Creasy Well Drilling",
    customerInquiry:
      "Sal (Member) called. Suddenly Out of Water - Psi at 0; circuit breakers checked. Nothing tripped.",
    technicianResponse:
      "Service call completed, with problem being an obstructed/dirty switch. Switch cleaned and system operating normally.",
    rightOfFirstRefusal: true,
    valvesOpen: "no",
    filterClogged: "no",
    circuitBreakerReset: "dont_know",
    lowPressureSwitch: "dont_know",
    invoiceAmount: 150,
    invoicePaymentType: "Credit Card",
    amperageReading: 13.0, // "Over 11.99 amps"
    isComplete: false,
    completedBy: "Gary Baker",
  },
  {
    ticketNumber: 100632,
    memberFirstName: "Crystal",
    memberLastName: "Cuffley",
    memberEmail: "crystalcuffley@gmail.com",
    memberPhone: "804-400-2648",
    streetAddress: "80 Choctaw Ridge",
    city: "Aylett",
    county: "King William County",
    state: "Virginia",
    zip: "23009",
    serviceType: "emergency",
    status: "in_progress",
    callReceivedAt: new Date("2026-04-08T09:50:00"),
    scheduledFor: new Date("2026-04-08T14:00:00"),
    lastServiceDate: new Date("2026-03-29"),
    serviceCompletedBy: "Royall Pump & Well Co., Inc.",
    customerInquiry:
      "Member expressed concern over declining water pressure since switch was installed. No water treatment equipment present. Cannot check pressure gauge.",
    technicianResponse: "Tech checked system. All operating normally.",
    isComplete: false,
    completedBy: "Gary Baker",
  },
  {
    ticketNumber: 100631,
    memberFirstName: "Craig",
    memberLastName: "Weller",
    memberEmail: "cweller426@verizon.net",
    memberPhone: "410-688-6409",
    memberPhoneType: "Cell",
    memberAltPhone: "410-688-6410",
    memberAltPhoneType: "Cell",
    streetAddress: "1515 Ryan Road",
    city: "Fallston",
    county: "Harford County",
    state: "Maryland",
    zip: "21047",
    serviceType: "emergency",
    status: "completed",
    callReceivedAt: new Date("2026-04-04T10:00:00"),
    scheduledFor: new Date("2026-04-04T12:00:00"),
    lastServiceDate: new Date("2023-04-21"),
    serviceCompletedBy: "Liberty Pure Solutions Inc.",
    customerInquiry:
      "Called 4.3.26 OOW. Reset circuit breaker and water returned. Called 4.4.26 and is having water inconsistently - on and off. Pump installed 4.21.23.",
    technicianResponse:
      "Pressure tank was waterlogged, prematurely placed the pump in thermal overload. Replaced tank, switch, gauge, and pump. System operating normally.",
    rightOfFirstRefusal: true,
    valvesOpen: "no",
    filterClogged: "yes",
    circuitBreakerReset: "dont_know",
    lowPressureSwitch: "dont_know",
    backwashCycle: "yes",
    invoiceNumber: "135173636",
    invoiceAmount: 4000,
    invoicePaymentType: "Credit Card",
    invoiceAttachment: "Liberty Pure #135173636 - $4000 - 1515 Ryan Road 04042026.pdf",
    isComplete: true,
    ticketCompletedBy: "Gary Baker",
  },
] as const;

async function findVendorId(name: string): Promise<string | null> {
  if (!name) return null;
  const n = name.toLowerCase();
  const vendors = await prisma.vendor.findMany({ select: { id: true, companyName: true } });
  const exact = vendors.find(
    (v) => v.companyName.toLowerCase() === n
  );
  if (exact) return exact.id;
  const partial = vendors.find(
    (v) => v.companyName.toLowerCase().includes(n.split(" ")[0])
  );
  return partial?.id ?? null;
}

async function main() {
  console.log("\nSeeding service tickets...\n");

  let inserted = 0;
  let skipped = 0;
  let errors = 0;

  for (const rec of RECORDS) {
    const existing = await prisma.serviceTicket.findUnique({
      where: { ticketNumber: rec.ticketNumber },
      select: { id: true },
    });
    if (existing) {
      console.log(`  [skip] #${rec.ticketNumber} already exists`);
      skipped++;
      continue;
    }

    const vendorId = await findVendorId(rec.serviceCompletedBy);

    try {
      await prisma.serviceTicket.create({
        data: {
          ticketNumber:       rec.ticketNumber,
          memberFirstName:    rec.memberFirstName,
          memberLastName:     rec.memberLastName,
          memberEmail:        rec.memberEmail ?? null,
          memberPhone:        rec.memberPhone ?? null,
          memberPhoneType:    (rec as { memberPhoneType?: string }).memberPhoneType ?? null,
          memberAltPhone:     (rec as { memberAltPhone?: string }).memberAltPhone ?? null,
          memberAltPhoneType: (rec as { memberAltPhoneType?: string }).memberAltPhoneType ?? null,
          streetAddress:      rec.streetAddress,
          city:               rec.city ?? null,
          county:             rec.county ?? null,
          state:              rec.state ?? null,
          zip:                rec.zip ?? null,
          serviceType:        rec.serviceType,
          status:             rec.status,
          callReceivedAt:     rec.callReceivedAt,
          scheduledFor:       rec.scheduledFor ?? null,
          lastServiceDate:    rec.lastServiceDate ?? null,
          vendorId,
          serviceCompletedBy: rec.serviceCompletedBy,
          customerInquiry:    rec.customerInquiry ?? null,
          technicianResponse: (rec as { technicianResponse?: string }).technicianResponse ?? null,
          rightOfFirstRefusal: (rec as { rightOfFirstRefusal?: boolean }).rightOfFirstRefusal ?? null,
          valvesOpen:         (rec as { valvesOpen?: string }).valvesOpen ?? null,
          filterClogged:      (rec as { filterClogged?: string }).filterClogged ?? null,
          circuitBreakerReset: (rec as { circuitBreakerReset?: string }).circuitBreakerReset ?? null,
          lowPressureSwitch:  (rec as { lowPressureSwitch?: string }).lowPressureSwitch ?? null,
          backwashCycle:      (rec as { backwashCycle?: string }).backwashCycle ?? null,
          amperageReading:    (rec as { amperageReading?: number }).amperageReading ?? null,
          invoiceNumber:      (rec as { invoiceNumber?: string }).invoiceNumber ?? null,
          invoiceAmount:      (rec as { invoiceAmount?: number }).invoiceAmount ?? null,
          invoicePaymentType: (rec as { invoicePaymentType?: string }).invoicePaymentType ?? null,
          invoiceAttachment:  (rec as { invoiceAttachment?: string }).invoiceAttachment ?? null,
          isComplete:         rec.isComplete,
          completedBy:        (rec as { completedBy?: string }).completedBy ?? null,
          ticketCompletedBy:  (rec as { ticketCompletedBy?: string }).ticketCompletedBy ?? null,
        },
      });
      console.log(`  [ok]   #${rec.ticketNumber} — ${rec.memberFirstName} ${rec.memberLastName}`);
      inserted++;
    } catch (err) {
      console.error(`  [err]  #${rec.ticketNumber}:`, err);
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
