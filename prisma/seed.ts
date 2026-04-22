import { config } from "dotenv";
config({ path: ".env.local" });
config();

// Safety: refuse to run against a production database URL
const dbUrl = process.env.DATABASE_URL ?? "";
if (!dbUrl.includes("localhost") && process.env.ALLOW_PROD_SEED !== "true") {
  const host = dbUrl.match(/@([^/]+)\//)?.[1] ?? "unknown";
  console.error(`\nSeed aborted — looks like a remote database (${host}).`);
  console.error("This script DELETES ALL DATA. If you really mean it, re-run with:");
  console.error("  ALLOW_PROD_SEED=true npx tsx prisma/seed.ts\n");
  process.exit(1);
}

import { PrismaClient } from "../src/generated/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clear existing seed data
  await prisma.inspectionPhoto.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.member.deleteMany();

  // Vendors
  const vendor1 = await prisma.vendor.create({
    data: {
      companyName: "ClearWater Inspection Services",
      inspectorName: "Marcus Webb",
      email: "marcus@clearwater-inspect.com",
      phone: "555-201-4400",
      licenseNumber: "WI-2024-0881",
    },
  });

  const vendor2 = await prisma.vendor.create({
    data: {
      companyName: "Summit Well & Pump",
      inspectorName: "Diana Reyes",
      email: "diana@summitwellpump.com",
      phone: "555-308-7722",
      licenseNumber: "WI-2023-0445",
    },
  });

  // Members
  const member1 = await prisma.member.create({
    data: {
      firstName: "James",
      lastName: "Hartwell",
      email: "james.hartwell@email.com",
      phone: "555-100-2233",
      serviceAddress: "14 Maple Creek Rd, Ashford, VA 22801",
    },
  });

  const member2 = await prisma.member.create({
    data: {
      firstName: "Patricia",
      lastName: "Nguyen",
      email: "p.nguyen@homemail.net",
      phone: "555-400-8811",
      serviceAddress: "302 Birchwood Lane, Elkton, MD 21921",
    },
  });

  const member3 = await prisma.member.create({
    data: {
      firstName: "Robert",
      lastName: "Caldwell",
      email: "rcaldwell@outlook.com",
      phone: "555-777-3344",
      serviceAddress: "88 Stonemill Drive, Winchester, VA 22601",
    },
  });

  // Inspection 1 — Green / Approved
  await prisma.inspection.create({
    data: {
      memberId: member1.id,
      vendorId: vendor1.id,
      homeownerName: "James Hartwell",
      homeownerEmail: member1.email,
      homeownerPhone: member1.phone,
      propertyAddress: "14 Maple Creek Rd",
      city: "Ashford",
      state: "VA",
      zip: "22801",
      inspectorName: vendor1.inspectorName,
      inspectionCompany: vendor1.companyName,
      inspectionDate: new Date("2026-03-15"),
      wellType: "drilled",
      wellDepthFt: 220,
      pumpType: "submersible",
      pumpAgeYears: 4,
      pressureTankAgeYears: 4,
      casingCondition: "good",
      wellCapCondition: "good",
      wiringCondition: "good",
      visibleLeaks: false,
      safetyIssues: false,
      contaminationRisk: false,
      systemOperational: true,
      pressureOk: true,
      flowOk: true,
      siteClearanceOk: true,
      inspectorNotes: "System in excellent condition. Recent pump installation with proper permits. No concerns noted.",
      memberFacingSummary: "Your well system is in great shape. All components are functioning properly and within expected service life.",
      systemScore: 92,
      systemStatus: "green",
      finalStatus: "green",
      statusRationale: ["All conditions rated good", "No safety concerns", "System fully operational", "Equipment within normal age range"],
      reportId: "WRP-2026-00001",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // Inspection 2 — Yellow / Conditional
  await prisma.inspection.create({
    data: {
      memberId: member2.id,
      vendorId: vendor2.id,
      homeownerName: "Patricia Nguyen",
      homeownerEmail: member2.email,
      homeownerPhone: member2.phone,
      propertyAddress: "302 Birchwood Lane",
      city: "Elkton",
      state: "MD",
      zip: "21921",
      inspectorName: vendor2.inspectorName,
      inspectionCompany: vendor2.companyName,
      inspectionDate: new Date("2026-04-02"),
      wellType: "drilled",
      wellDepthFt: 180,
      pumpType: "submersible",
      pumpAgeYears: 11,
      pressureTankAgeYears: 9,
      casingCondition: "fair",
      wellCapCondition: "fair",
      wiringCondition: "good",
      visibleLeaks: false,
      safetyIssues: false,
      contaminationRisk: false,
      systemOperational: true,
      pressureOk: true,
      flowOk: true,
      siteClearanceOk: true,
      inspectorNotes: "Pump is approaching end of expected service life at 11 years. Casing shows minor surface oxidation but no structural compromise. Recommend proactive pump replacement within 12 months.",
      requiredRepairs: "None immediate.",
      recommendedRepairs: "Replace submersible pump within 12 months. Reseal well cap.",
      memberFacingSummary: "Your well is currently operational, but the pump is aging and we recommend scheduling a replacement soon to avoid an unexpected failure.",
      systemScore: 62,
      systemStatus: "yellow",
      finalStatus: "yellow",
      statusRationale: ["Pump age 11 years exceeds recommended threshold", "Casing condition rated fair", "Well cap condition rated fair"],
      reportId: "WRP-2026-00002",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // Inspection 3 — Red / Not Approved
  await prisma.inspection.create({
    data: {
      memberId: member3.id,
      vendorId: vendor1.id,
      homeownerName: "Robert Caldwell",
      homeownerEmail: member3.email,
      homeownerPhone: member3.phone,
      propertyAddress: "88 Stonemill Drive",
      city: "Winchester",
      state: "VA",
      zip: "22601",
      inspectorName: vendor1.inspectorName,
      inspectionCompany: vendor1.companyName,
      inspectionDate: new Date("2026-04-18"),
      wellType: "bored",
      wellDepthFt: 45,
      pumpType: "jet",
      pumpAgeYears: 18,
      pressureTankAgeYears: 14,
      casingCondition: "poor",
      wellCapCondition: "poor",
      wiringCondition: "poor",
      visibleLeaks: true,
      safetyIssues: true,
      contaminationRisk: true,
      systemOperational: false,
      pressureOk: false,
      flowOk: false,
      siteClearanceOk: false,
      inspectorNotes: "Significant deterioration throughout. Bored well casing cracked with visible surface water infiltration risk. Electrical wiring to pump is corroded and presents a safety hazard. System was not operational at time of inspection. Immediate remediation required.",
      requiredRepairs: "Full well rehabilitation or replacement. Immediate electrical inspection and rewiring. Pressure tank replacement.",
      internalReviewerNotes: "Claim denied pending remediation. Member has been notified. Follow up in 30 days.",
      memberFacingSummary: "Unfortunately your well system does not meet our coverage standards at this time due to safety and operational issues. Please contact a licensed well contractor for remediation.",
      systemScore: 12,
      systemStatus: "red",
      finalStatus: "red",
      statusRationale: [
        "Safety issues present — immediate action required",
        "Contamination risk identified",
        "System not operational at inspection",
        "Casing condition poor",
        "Well cap condition poor",
        "Wiring condition poor",
        "Visible leaks detected",
      ],
      reportId: "WRP-2026-00003",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // Inspection 4 — Draft (in progress, partial data intentional)
  await prisma.inspection.create({
    data: {
      homeownerName: "Sandra Flores",
      homeownerEmail: "s.flores@gmail.com",
      homeownerPhone: "555-622-9900",
      propertyAddress: "221 Oakridge Court",
      city: "Front Royal",
      state: "VA",
      zip: "22630",
      inspectorName: vendor2.inspectorName,
      inspectionCompany: vendor2.companyName,
      inspectionDate: new Date("2026-04-21"),
      wellType: "drilled",
      wellDepthFt: 195,
      pumpType: "submersible",
      pumpAgeYears: 6,
      pressureTankAgeYears: 6,
      casingCondition: "good",
      wellCapCondition: "good",
      wiringCondition: "good",
      systemOperational: true,
      pressureOk: true,
      flowOk: true,
      siteClearanceOk: true,
      visibleLeaks: false,
      safetyIssues: false,
      contaminationRisk: false,
      inspectorNotes: "Inspection in progress — awaiting lab results for water quality. Visual inspection of all mechanical components completed with no concerns noted.",
      systemScore: 85,
      systemStatus: "green",
      finalStatus: "green",
      statusRationale: ["All visible conditions rated good", "Equipment within normal age range"],
      isDraft: true,
      ghlSyncStatus: "pending",
    },
  });

  console.log("Seed complete — 2 vendors, 3 members, 4 inspections (3 published + 1 draft)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
