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
  await prisma.pdfGeneration.deleteMany();
  await prisma.yieldTest.deleteMany();
  await prisma.inspectionPhoto.deleteMany();
  await prisma.inspection.deleteMany();
  await prisma.user.deleteMany({ where: { role: "vendor" } });
  await prisma.inspector.deleteMany();
  await prisma.vendor.deleteMany();
  await prisma.member.deleteMany();

  // ─── Vendor Companies ─────────────────────────────────────────────────────

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

  // ─── Inspectors (linked to their vendor companies) ─────────────────────────

  const marcus = await prisma.inspector.create({
    data: {
      name: "Marcus Webb",
      email: "marcus@clearwater-inspect.com",
      phone: "555-201-4400",
      company: "ClearWater Inspection Services",
      licenseNumber: "WI-2024-0881",
      licenseStates: ["VA", "MD", "WV"],
      certifications: ["NGWA Certified Well Driller", "VA Licensed Well Inspector"],
      yearsExperience: 12,
      status: "active",
      notes: "Senior inspector. Specializes in drilled wells and deep aquifer systems across the Shenandoah Valley corridor.",
      vendorId: vendor1.id,
    },
  });

  const diana = await prisma.inspector.create({
    data: {
      name: "Diana Reyes",
      email: "diana@summitwellpump.com",
      phone: "555-308-7722",
      company: "Summit Well & Pump",
      licenseNumber: "WI-2023-0445",
      licenseStates: ["MD", "PA", "WV"],
      certifications: ["NGWA Certified Well Inspector", "MD Licensed Water Well Contractor"],
      yearsExperience: 9,
      status: "active",
      notes: "Highly experienced with bored and drilled wells in the Cumberland and Hagerstown areas.",
      vendorId: vendor2.id,
    },
  });

  // ─── Members ──────────────────────────────────────────────────────────────

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

  // ─── 14 Inspections ───────────────────────────────────────────────────────
  // Odd-numbered → Marcus Webb / ClearWater  |  Even-numbered → Diana Reyes / Summit

  // #1 — Premium
  await prisma.inspection.create({
    data: {
      memberId: member1.id,
      vendorId: vendor1.id,
      inspectorId: marcus.id,
      homeownerName: "James Hartwell",
      homeownerEmail: member1.email,
      homeownerPhone: member1.phone,
      propertyAddress: "14 Maple Creek Rd",
      city: "Ashford",
      state: "VA",
      zip: "22801",
      inspectorName: marcus.name,
      inspectionCompany: marcus.company,
      inspectionDate: new Date("2026-03-15"),
      wellType: "drilled",
      wellDepthFt: 220,
      pumpType: "submersible",
      wellCap: "sealed_contamination_resistant",
      casingHeightInches: 12,
      wellObstructions: "none",
      amperageReading: 8.5,
      tankCondition: "good",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      secondsToHighReading: 120,
      secondsToLowReading: 90,
      inspectorNotes: "System in excellent condition. Recent pump installation with proper permits. No concerns noted.",
      memberFacingSummary: "Your well system is in great shape. All components are functioning properly and within expected service life.",
      systemStatus: "green",
      finalStatus: "green",
      membershipTier: "premium",
      eligibleForSuperior: true,
      statusRationale: ["All conditions rated good", "No safety concerns", "System fully operational", "Equipment within normal age range"],
      reportId: "WRP-2026-00001",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #2 — Superior
  await prisma.inspection.create({
    data: {
      memberId: member2.id,
      vendorId: vendor2.id,
      inspectorId: diana.id,
      homeownerName: "Patricia Nguyen",
      homeownerEmail: member2.email,
      homeownerPhone: member2.phone,
      propertyAddress: "302 Birchwood Lane",
      city: "Elkton",
      state: "MD",
      zip: "21921",
      inspectorName: diana.name,
      inspectionCompany: diana.company,
      inspectionDate: new Date("2026-04-02"),
      wellType: "drilled",
      wellDepthFt: 180,
      pumpType: "submersible",
      wellCap: "secured_bolted",
      casingHeightInches: 10,
      wellObstructions: "ornamental",
      amperageReading: 9.2,
      tankCondition: "fair",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      secondsToHighReading: 200,
      secondsToLowReading: 160,
      inspectorNotes: "Tank showing minor wear. Casing shows minor surface oxidation but no structural compromise. Recommend proactive tank inspection within 12 months.",
      requiredRepairs: "None immediate.",
      recommendedRepairs: "Inspect pressure tank bladder within 12 months. Reseal well cap.",
      memberFacingSummary: "Your well is currently operational, but the tank is aging and we recommend scheduling an inspection soon.",
      systemStatus: "yellow",
      finalStatus: "yellow",
      membershipTier: "superior",
      eligibleForSuperior: true,
      statusRationale: ["Tank condition rated fair", "Well cap condition rated secured but not sealed"],
      reportId: "WRP-2026-00002",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #3 — Standard / Not Approved
  await prisma.inspection.create({
    data: {
      memberId: member3.id,
      vendorId: vendor1.id,
      inspectorId: marcus.id,
      homeownerName: "Robert Caldwell",
      homeownerEmail: member3.email,
      homeownerPhone: member3.phone,
      propertyAddress: "88 Stonemill Drive",
      city: "Winchester",
      state: "VA",
      zip: "22601",
      inspectorName: marcus.name,
      inspectionCompany: marcus.company,
      inspectionDate: new Date("2026-04-18"),
      wellType: "bored",
      wellDepthFt: 45,
      pumpType: "jet",
      wellCap: "unsecured_open",
      casingHeightInches: 4,
      wellObstructions: "debris",
      amperageReading: 15.0,
      tankCondition: "poor",
      controlBoxCondition: "damaged",
      pressureSwitch: "damaged",
      pressureGauge: "not_present",
      secondsToHighReading: 500,
      secondsToLowReading: 480,
      inspectorNotes: "Significant deterioration throughout. Bored well casing cracked with visible surface water infiltration risk. Electrical system damaged. System was not operational at time of inspection.",
      requiredRepairs: "Full well rehabilitation or replacement. Immediate electrical inspection and rewiring. Pressure tank replacement.",
      internalReviewerNotes: "Claim denied pending remediation. Member has been notified. Follow up in 30 days.",
      memberFacingSummary: "Unfortunately your well system does not meet our coverage standards at this time due to safety and operational issues.",
      systemStatus: "red",
      finalStatus: "red",
      membershipTier: "standard",
      eligibleForSuperior: false,
      statusRationale: [
        "Well type bored — does not qualify for external equipment pass",
        "Well cap unsecured — contamination risk",
        "Tank condition poor",
        "Control box damaged",
        "Amperage reading exceeds 12A threshold",
        "Cycle time out of valid range",
      ],
      reportId: "WRP-2026-00003",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #4 — Draft (in progress) — Diana / Summit
  await prisma.inspection.create({
    data: {
      vendorId: vendor2.id,
      inspectorId: diana.id,
      homeownerName: "Sandra Flores",
      homeownerEmail: "s.flores@gmail.com",
      homeownerPhone: "555-622-9900",
      propertyAddress: "221 Oakridge Court",
      city: "Front Royal",
      state: "VA",
      zip: "22630",
      inspectorName: diana.name,
      inspectionCompany: diana.company,
      inspectionDate: new Date("2026-04-21"),
      wellType: "drilled",
      wellDepthFt: 195,
      pumpType: "submersible",
      wellCap: "sealed_contamination_resistant",
      casingHeightInches: 12,
      wellObstructions: "none",
      amperageReading: 7.8,
      tankCondition: "good",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      inspectorNotes: "Inspection in progress — awaiting yield test completion. Visual inspection of all mechanical components completed with no concerns noted.",
      systemStatus: "green",
      finalStatus: "green",
      statusRationale: ["All visible conditions rated good", "Equipment within normal age range"],
      isDraft: true,
      ghlSyncStatus: "pending",
    },
  });

  // #5 — Premium, WV — Marcus / ClearWater
  await prisma.inspection.create({
    data: {
      vendorId: vendor1.id,
      inspectorId: marcus.id,
      homeownerName: "Thomas Greer",
      homeownerEmail: "t.greer@email.com",
      homeownerPhone: "555-512-0033",
      propertyAddress: "74 Ridgeline Hollow Rd",
      city: "Martinsburg",
      state: "WV",
      zip: "25401",
      inspectorName: marcus.name,
      inspectionCompany: marcus.company,
      inspectionDate: new Date("2026-01-08"),
      wellType: "drilled",
      wellDepthFt: 310,
      pumpType: "submersible",
      wellCap: "sealed_contamination_resistant",
      casingHeightInches: 14,
      wellObstructions: "none",
      amperageReading: 6.2,
      tankCondition: "good",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      secondsToHighReading: 100,
      secondsToLowReading: 80,
      inspectorNotes: "Brand new installation — 2024 build. All permits on file. Excellent pressure, flow rate above threshold. No issues identified.",
      memberFacingSummary: "Your well system is in excellent condition. The equipment is nearly new and all systems are functioning within optimal parameters.",
      systemStatus: "green",
      finalStatus: "green",
      membershipTier: "premium",
      eligibleForSuperior: true,
      statusRationale: ["All conditions rated good", "Equipment within 2 years old", "Optimal pressure and flow", "No concerns identified"],
      reportId: "WRP-2026-00005",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #6 — Superior, PA — Diana / Summit
  await prisma.inspection.create({
    data: {
      vendorId: vendor2.id,
      inspectorId: diana.id,
      homeownerName: "Beverly Okafor",
      homeownerEmail: "b.okafor@netmail.com",
      homeownerPhone: "555-934-2201",
      propertyAddress: "519 Penn Valley Drive",
      city: "Chambersburg",
      state: "PA",
      zip: "17201",
      inspectorName: diana.name,
      inspectionCompany: diana.company,
      inspectionDate: new Date("2026-02-14"),
      wellType: "drilled",
      wellDepthFt: 150,
      pumpType: "jet",
      wellCap: "secured_bolted",
      casingHeightInches: 8,
      wellObstructions: "none",
      amperageReading: 10.5,
      tankCondition: "fair",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      secondsToHighReading: 250,
      secondsToLowReading: 200,
      inspectorNotes: "System showing normal wear. Tank has minor aging. Recommend monitoring and proactive replacement planning.",
      recommendedRepairs: "Plan tank inspection within 18 months. Inspect and reseal casing exterior.",
      memberFacingSummary: "Your well is currently working but several components are aging and warrant attention in the near term.",
      systemStatus: "yellow",
      finalStatus: "yellow",
      membershipTier: "superior",
      eligibleForSuperior: true,
      statusRationale: ["Tank condition rated fair — age-related deterioration noted"],
      reportId: "WRP-2026-00006",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #7 — Standard, NC — Marcus / ClearWater
  await prisma.inspection.create({
    data: {
      vendorId: vendor1.id,
      inspectorId: marcus.id,
      homeownerName: "Harold Stinson",
      homeownerEmail: "hstinson@homemail.net",
      homeownerPhone: "555-388-7701",
      propertyAddress: "12 Blue Ridge Gap Rd",
      city: "Boone",
      state: "NC",
      zip: "28607",
      inspectorName: marcus.name,
      inspectionCompany: marcus.company,
      inspectionDate: new Date("2026-03-01"),
      wellType: "bored",
      wellDepthFt: 38,
      pumpType: "jet",
      wellCap: "missing_damaged",
      casingHeightInches: 2,
      wellObstructions: "debris",
      amperageReading: 18.0,
      tankCondition: "poor",
      controlBoxCondition: "damaged",
      pressureSwitch: "not_present",
      pressureGauge: "not_present",
      inspectorNotes: "Bored well in critically poor condition. Open well cap allowing debris ingress. Evidence of surface water contamination. Wiring bare and dangerous.",
      requiredRepairs: "Complete well abandonment per state regulations OR full rehabilitation to modern drilled standard. Immediate pump and electrical replacement.",
      internalReviewerNotes: "Coverage denied. Member advised to contact state well authority. Risk flag added to account.",
      memberFacingSummary: "Your well system has failed our inspection and cannot be covered in its current state.",
      systemStatus: "red",
      finalStatus: "red",
      membershipTier: "standard",
      eligibleForSuperior: false,
      statusRationale: ["Well type bored — external equipment fails", "Well cap missing/damaged", "Tank condition poor", "Control box damaged", "Amperage exceeds 12A"],
      reportId: "WRP-2026-00007",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #8 — Premium, TN — Diana / Summit
  await prisma.inspection.create({
    data: {
      vendorId: vendor2.id,
      inspectorId: diana.id,
      homeownerName: "Angela Drummond",
      homeownerEmail: "a.drummond@outlook.com",
      homeownerPhone: "555-701-4488",
      propertyAddress: "3302 Cedarwood Circle",
      city: "Kingsport",
      state: "TN",
      zip: "37660",
      inspectorName: diana.name,
      inspectionCompany: diana.company,
      inspectionDate: new Date("2026-03-10"),
      wellType: "drilled",
      wellDepthFt: 260,
      pumpType: "submersible",
      wellCap: "sealed_contamination_resistant",
      casingHeightInches: 12,
      wellObstructions: "none",
      amperageReading: 7.5,
      tankCondition: "good",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      secondsToHighReading: 130,
      secondsToLowReading: 100,
      inspectorNotes: "Well maintained. Owner has annual servicing records on file. Pressure tank pre-charge verified.",
      memberFacingSummary: "Your well is in great shape. You clearly maintain it well — keep up the annual servicing schedule.",
      systemStatus: "green",
      finalStatus: "green",
      membershipTier: "premium",
      eligibleForSuperior: true,
      statusRationale: ["All conditions rated good", "Annual service records verified"],
      reportId: "WRP-2026-00008",
      isDraft: false,
      ghlSyncStatus: "synced",
    },
  });

  // #9 — Superior → Premium override — Marcus / ClearWater
  await prisma.inspection.create({
    data: {
      vendorId: vendor1.id,
      inspectorId: marcus.id,
      homeownerName: "Curtis Langley",
      homeownerEmail: "clangley@gmail.com",
      homeownerPhone: "555-209-3344",
      propertyAddress: "88 Sycamore Bend",
      city: "Hagerstown",
      state: "MD",
      zip: "21740",
      inspectorName: marcus.name,
      inspectionCompany: marcus.company,
      inspectionDate: new Date("2026-03-22"),
      wellType: "drilled",
      wellDepthFt: 200,
      pumpType: "submersible",
      wellCap: "sealed_contamination_resistant",
      casingHeightInches: 11,
      wellObstructions: "none",
      amperageReading: 8.0,
      tankCondition: "fair",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      secondsToHighReading: 150,
      secondsToLowReading: 120,
      inspectorNotes: "Tank has minor surface corrosion consistent with soil chemistry in this region — not structural. Pump performing well. New pressure switch installed last year.",
      internalReviewerNotes: "Tank rated fair due to benign regional issue. Overriding to premium per senior reviewer.",
      memberFacingSummary: "Your well system is approved. The minor tank condition noted is a regional characteristic and not a structural or operational concern.",
      systemStatus: "yellow",
      finalStatus: "green",
      membershipTier: "premium",
      eligibleForSuperior: true,
      overrideReason: "Regional soil chemistry causes surface oxidation — confirmed benign by senior reviewer.",
      statusRationale: ["Tank rated fair — surface oxidation noted", "All operational checks passed"],
      reportId: "WRP-2026-00009",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #10 — Superior → Standard override — Diana / Summit
  await prisma.inspection.create({
    data: {
      vendorId: vendor2.id,
      inspectorId: diana.id,
      homeownerName: "Marlene Hutchins",
      homeownerEmail: "m.hutchins@verizon.net",
      homeownerPhone: "555-811-6600",
      propertyAddress: "44 Old Orchard Lane",
      city: "Roanoke",
      state: "VA",
      zip: "24012",
      inspectorName: diana.name,
      inspectionCompany: diana.company,
      inspectionDate: new Date("2026-03-28"),
      wellType: "drilled",
      wellDepthFt: 175,
      pumpType: "submersible",
      wellCap: "secured_bolted",
      casingHeightInches: 10,
      wellObstructions: "vegetation",
      amperageReading: 9.0,
      tankCondition: "good",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      secondsToHighReading: 300,
      secondsToLowReading: 280,
      inspectorNotes: "Mechanical systems in reasonable condition. Cycle time borderline. Well cap not sealed per premium standard.",
      requiredRepairs: "Upgrade well cap to sealed contamination-resistant model.",
      internalReviewerNotes: "Despite passing most checks, well cap and cycle time issues trigger standard override per policy.",
      memberFacingSummary: "While your well equipment is in reasonable mechanical condition, some components do not meet our coverage standards.",
      systemStatus: "yellow",
      finalStatus: "red",
      membershipTier: "standard",
      eligibleForSuperior: true,
      overrideReason: "Policy override: well cap not sealed and cycle time borderline — standard tier assigned.",
      statusRationale: ["Well cap secured but not sealed — does not meet premium external standard", "Cycle time approaches upper limit"],
      reportId: "WRP-2026-00010",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #11 — Premium, VA — Marcus / ClearWater
  await prisma.inspection.create({
    data: {
      vendorId: vendor1.id,
      inspectorId: marcus.id,
      homeownerName: "George Pemberton",
      homeownerEmail: "gpemberton@email.com",
      homeownerPhone: "555-444-2299",
      propertyAddress: "1821 Foxcroft Road",
      city: "Charlottesville",
      state: "VA",
      zip: "22901",
      inspectorName: marcus.name,
      inspectionCompany: marcus.company,
      inspectionDate: new Date("2026-04-03"),
      wellType: "drilled",
      wellDepthFt: 285,
      pumpType: "submersible",
      wellCap: "sealed_contamination_resistant",
      casingHeightInches: 12,
      wellObstructions: "none",
      amperageReading: 8.8,
      tankCondition: "good",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      secondsToHighReading: 140,
      secondsToLowReading: 110,
      inspectorNotes: "Older system but well maintained. Owner has maintenance records. All operational checks pass.",
      recommendedRepairs: "Budget for pump replacement within 2 years.",
      internalReviewerNotes: "Borderline but all operational checks pass and maintenance history is strong. Approving premium.",
      memberFacingSummary: "Your well is approved. It is older but clearly well maintained.",
      systemStatus: "green",
      finalStatus: "green",
      membershipTier: "premium",
      eligibleForSuperior: true,
      statusRationale: ["System operational with verified maintenance history", "All category checks passed"],
      reportId: "WRP-2026-00011",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #12 — Standard, WV — Diana / Summit
  await prisma.inspection.create({
    data: {
      vendorId: vendor2.id,
      inspectorId: diana.id,
      homeownerName: "Renee Castillo",
      homeownerEmail: "r.castillo@wvmail.com",
      homeownerPhone: "555-623-8800",
      propertyAddress: "56 Spruce Hollow",
      city: "Morgantown",
      state: "WV",
      zip: "26505",
      inspectorName: diana.name,
      inspectionCompany: diana.company,
      inspectionDate: new Date("2026-04-07"),
      wellType: "drilled",
      wellDepthFt: 220,
      pumpType: "submersible",
      wellCap: "sealed_contamination_resistant",
      casingHeightInches: 12,
      wellObstructions: "none",
      amperageReading: 9.5,
      tankCondition: "failed",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      secondsToHighReading: 180,
      secondsToLowReading: 140,
      inspectorNotes: "Pressure tank waterlogged — bladder failure. System can draw water but pressure is inconsistent and drops rapidly under load.",
      requiredRepairs: "Replace pressure tank immediately.",
      memberFacingSummary: "Your well pump is operational but the pressure tank has failed and needs replacement.",
      systemStatus: "red",
      finalStatus: "red",
      membershipTier: "standard",
      eligibleForSuperior: true,
      statusRationale: ["Tank condition failed — bladder failure confirmed"],
      reportId: "WRP-2026-00012",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #13 — Premium, MD — Marcus / ClearWater
  await prisma.inspection.create({
    data: {
      vendorId: vendor1.id,
      inspectorId: marcus.id,
      homeownerName: "Diane Whitmore",
      homeownerEmail: "dwhitmore@gmail.com",
      homeownerPhone: "555-201-9900",
      propertyAddress: "7 Creekside Court",
      city: "Frederick",
      state: "MD",
      zip: "21701",
      inspectorName: marcus.name,
      inspectionCompany: marcus.company,
      inspectionDate: new Date("2026-04-10"),
      wellType: "drilled",
      wellDepthFt: 240,
      pumpType: "submersible",
      wellCap: "sealed_contamination_resistant",
      casingHeightInches: 14,
      wellObstructions: "none",
      amperageReading: 6.0,
      tankCondition: "good",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      secondsToHighReading: 90,
      secondsToLowReading: 70,
      inspectorNotes: "New construction — 2025 installation. Water quality test clear. All equipment under manufacturer warranty.",
      memberFacingSummary: "Your well system is new and in perfect condition. Welcome to Welgard — your system is fully approved.",
      systemStatus: "green",
      finalStatus: "green",
      membershipTier: "premium",
      eligibleForSuperior: true,
      statusRationale: ["All conditions rated good", "New installation 2025", "Water quality test clear"],
      reportId: "WRP-2026-00013",
      isDraft: false,
      ghlSyncStatus: "synced",
    },
  });

  // #14 — Draft, PA — Diana / Summit
  await prisma.inspection.create({
    data: {
      vendorId: vendor2.id,
      inspectorId: diana.id,
      homeownerName: "Victor Salinas",
      homeownerEmail: "vsalinas@email.net",
      homeownerPhone: "555-512-7733",
      propertyAddress: "302 Laurel Ridge Road",
      city: "Gettysburg",
      state: "PA",
      zip: "17325",
      inspectorName: diana.name,
      inspectionCompany: diana.company,
      inspectionDate: new Date("2026-04-20"),
      wellType: "drilled",
      wellDepthFt: 195,
      pumpType: "submersible",
      wellCap: "sealed_contamination_resistant",
      casingHeightInches: 12,
      wellObstructions: "none",
      amperageReading: 8.2,
      tankCondition: "good",
      controlBoxCondition: "ok",
      pressureSwitch: "visibly_present_intact",
      pressureGauge: "visibly_present_intact",
      inspectorNotes: "Inspection complete. Water sample submitted to lab — results pending. Yield tests not yet completed.",
      systemStatus: "green",
      finalStatus: "green",
      statusRationale: ["All conditions rated good", "Equipment within normal age range"],
      isDraft: true,
      ghlSyncStatus: "pending",
    },
  });

  console.log("Seed complete — 2 vendors, 2 inspectors, 3 members, 14 inspections (12 published + 2 drafts)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
