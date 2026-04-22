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
  await prisma.inspector.deleteMany();

  // ─── 20 Inspectors ────────────────────────────────────────────────────────

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
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Aaron Mitchell",
      email: "a.mitchell@blueridgewell.com",
      phone: "555-445-0099",
      company: "Blue Ridge Well Services",
      licenseNumber: "WI-NC-2022-1120",
      licenseStates: ["VA", "NC"],
      certifications: ["NGWA Certified Well Inspector", "NC Licensed Well Contractor"],
      yearsExperience: 7,
      status: "active",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Susan Park",
      email: "s.park@appalachianwater.com",
      phone: "555-612-3344",
      company: "Appalachian Water Systems",
      licenseNumber: "WI-WV-2021-0332",
      licenseStates: ["WV", "VA"],
      certifications: ["NGWA Water Well Systems Professional"],
      yearsExperience: 14,
      status: "active",
      notes: "Expert in mountain geology and high-yield aquifer assessment.",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Brian Kowalski",
      email: "b.kowalski@eshore-well.com",
      phone: "555-733-8822",
      company: "Eastern Shore Well Co",
      licenseNumber: "WI-MD-2020-0678",
      licenseStates: ["MD", "VA"],
      certifications: ["MD Licensed Well Inspector", "NGWA Certified Pump Installer"],
      yearsExperience: 11,
      status: "active",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Lisa Thornton",
      email: "l.thornton@truewellinspect.com",
      phone: "555-901-2255",
      company: "TrueWell Inspections",
      licenseNumber: "WI-TN-2023-0219",
      licenseStates: ["TN", "NC"],
      certifications: ["TN Licensed Well Inspector", "NGWA Certified Well Driller"],
      yearsExperience: 6,
      status: "active",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Carlos Mendez",
      email: "c.mendez@mtnstatewater.com",
      phone: "555-877-4411",
      company: "Mountain State Water",
      licenseNumber: "WI-WV-2019-0501",
      licenseStates: ["WV", "PA"],
      certifications: ["NGWA Certified Well Inspector", "WV Licensed Well Contractor"],
      yearsExperience: 16,
      status: "active",
      notes: "Specializes in coal region well assessments and remediation.",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Rachel Foster",
      email: "r.foster@capitalwellsvc.com",
      phone: "555-322-7700",
      company: "Capital Region Well Services",
      licenseNumber: "WI-VA-2022-0998",
      licenseStates: ["VA", "MD"],
      certifications: ["VA Licensed Well Inspector", "NGWA Water Well Systems Professional"],
      yearsExperience: 5,
      status: "active",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Kevin O'Brien",
      email: "k.obrien@keystonewell.com",
      phone: "555-588-3310",
      company: "Keystone Well Inspectors",
      licenseNumber: "WI-PA-2018-0344",
      licenseStates: ["PA"],
      certifications: ["PA Licensed Water Well Driller", "NGWA Certified Well Inspector"],
      yearsExperience: 18,
      status: "active",
      notes: "Licensed in PA only — does not cross state lines.",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Sandra Williams",
      email: "s.williams@shenandoahwellco.com",
      phone: "555-419-6688",
      company: "Shenandoah Valley Well Co",
      licenseNumber: "WI-VA-2021-0771",
      licenseStates: ["VA", "WV"],
      certifications: ["NGWA Certified Well Inspector"],
      yearsExperience: 8,
      status: "active",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "David Chen",
      email: "d.chen@atlanticwellsvc.com",
      phone: "555-650-2299",
      company: "Atlantic Well Services",
      licenseNumber: "WI-MD-2023-0841",
      licenseStates: ["MD", "NC"],
      certifications: ["MD Licensed Well Inspector", "EPA Section 5 Certified"],
      yearsExperience: 4,
      status: "active",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Patricia Moore",
      email: "p.moore@cumberlandwellsys.com",
      phone: "555-744-5500",
      company: "Cumberland Well Systems",
      licenseNumber: "WI-MD-2017-0203",
      licenseStates: ["MD", "WV", "PA"],
      certifications: ["NGWA Certified Well Inspector", "MD & WV Dual Licensed Well Contractor"],
      yearsExperience: 20,
      status: "active",
      notes: "Most experienced inspector on the roster. Available for complex or contested inspections.",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "James Wilson",
      email: "j.wilson@tidewaterinspect.com",
      phone: "555-811-3322",
      company: "Tidewater Inspection Group",
      licenseNumber: "WI-VA-2020-0556",
      licenseStates: ["VA"],
      certifications: ["VA Licensed Well Inspector", "NGWA Certified Pump Installer"],
      yearsExperience: 10,
      status: "active",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Jennifer Hayes",
      email: "j.hayes@bluemountainwell.com",
      phone: "555-522-9900",
      company: "Blue Mountain Well Services",
      licenseNumber: "WI-PA-2022-0714",
      licenseStates: ["PA"],
      certifications: ["PA Licensed Water Well Driller", "NGWA Water Well Systems Professional"],
      yearsExperience: 6,
      status: "active",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Michael Torres",
      email: "m.torres@olddominion-water.com",
      phone: "555-300-1144",
      company: "Old Dominion Water Services",
      licenseNumber: "WI-VA-2016-0122",
      licenseStates: ["VA"],
      certifications: ["VA Licensed Well Inspector", "NGWA Certified Well Driller", "Backflow Prevention Certified"],
      yearsExperience: 22,
      status: "active",
      notes: "Veteran inspector — 22 years experience. Preferred for large or complex residential systems.",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Kimberly Ross",
      email: "k.ross@appalachianwellexp.com",
      phone: "555-678-4433",
      company: "Appalachian Well Experts",
      licenseNumber: "WI-WV-2020-0889",
      licenseStates: ["WV", "KY"],
      certifications: ["WV Licensed Well Contractor", "NGWA Certified Well Inspector"],
      yearsExperience: 9,
      status: "inactive",
      notes: "Currently on extended leave — expected return Q3 2026.",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Robert Taylor",
      email: "r.taylor@chesapeakewellsys.com",
      phone: "555-455-7700",
      company: "Chesapeake Well Systems",
      licenseNumber: "WI-MD-2019-0667",
      licenseStates: ["MD", "VA"],
      certifications: ["MD Licensed Well Inspector", "NGWA Certified Well Inspector"],
      yearsExperience: 13,
      status: "active",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Nancy Anderson",
      email: "n.anderson@potomacvalleyinspect.com",
      phone: "555-211-8866",
      company: "Potomac Valley Inspectors",
      licenseNumber: "WI-VA-2021-0309",
      licenseStates: ["VA", "MD"],
      certifications: ["VA Licensed Well Inspector", "Water Quality Testing Certified"],
      yearsExperience: 7,
      status: "active",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Christopher Lee",
      email: "c.lee@highlandwellsvc.com",
      phone: "555-388-2211",
      company: "Highland Well Services",
      licenseNumber: "WI-WV-2023-0144",
      licenseStates: ["WV", "VA"],
      certifications: ["NGWA Certified Well Inspector"],
      yearsExperience: 3,
      status: "active",
      notes: "Newer inspector — working under senior supervision for complex cases.",
    },
  });

  await prisma.inspector.create({
    data: {
      name: "Amanda Johnson",
      email: "a.johnson@mountaineerinspect.com",
      phone: "555-700-9988",
      company: "Mountaineer Well Inspectors",
      licenseNumber: "WI-WV-2018-0733",
      licenseStates: ["WV"],
      certifications: ["WV Licensed Well Contractor", "NGWA Certified Well Driller", "NGWA Certified Pump Installer"],
      yearsExperience: 15,
      status: "active",
      notes: "Specializes in rural and off-grid well systems in eastern WV.",
    },
  });

  // ─── Vendors ──────────────────────────────────────────────────────────────

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
  // Odd-numbered → Marcus Webb  |  Even-numbered → Diana Reyes

  // #1 — Green / Approved
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
      pumpAgeYears: 4,
      pressureTankAgeYears: 4,
      casingCondition: "good",
      wellCapCondition: "good",
      wiringCondition: "good",
      visibleLeaks: false, safetyIssues: false, contaminationRisk: false,
      systemOperational: true, pressureOk: true, flowOk: true, siteClearanceOk: true,
      inspectorNotes: "System in excellent condition. Recent pump installation with proper permits. No concerns noted.",
      memberFacingSummary: "Your well system is in great shape. All components are functioning properly and within expected service life.",
      systemScore: 92, systemStatus: "green", finalStatus: "green",
      statusRationale: ["All conditions rated good", "No safety concerns", "System fully operational", "Equipment within normal age range"],
      reportId: "WRP-2026-00001",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #2 — Yellow / Conditional
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
      pumpAgeYears: 11,
      pressureTankAgeYears: 9,
      casingCondition: "fair",
      wellCapCondition: "fair",
      wiringCondition: "good",
      visibleLeaks: false, safetyIssues: false, contaminationRisk: false,
      systemOperational: true, pressureOk: true, flowOk: true, siteClearanceOk: true,
      inspectorNotes: "Pump is approaching end of expected service life at 11 years. Casing shows minor surface oxidation but no structural compromise. Recommend proactive pump replacement within 12 months.",
      requiredRepairs: "None immediate.",
      recommendedRepairs: "Replace submersible pump within 12 months. Reseal well cap.",
      memberFacingSummary: "Your well is currently operational, but the pump is aging and we recommend scheduling a replacement soon to avoid an unexpected failure.",
      systemScore: 62, systemStatus: "yellow", finalStatus: "yellow",
      statusRationale: ["Pump age 11 years exceeds recommended threshold", "Casing condition rated fair", "Well cap condition rated fair"],
      reportId: "WRP-2026-00002",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #3 — Red / Not Approved
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
      pumpAgeYears: 18,
      pressureTankAgeYears: 14,
      casingCondition: "poor",
      wellCapCondition: "poor",
      wiringCondition: "poor",
      visibleLeaks: true, safetyIssues: true, contaminationRisk: true,
      systemOperational: false, pressureOk: false, flowOk: false, siteClearanceOk: false,
      inspectorNotes: "Significant deterioration throughout. Bored well casing cracked with visible surface water infiltration risk. Electrical wiring to pump is corroded and presents a safety hazard. System was not operational at time of inspection. Immediate remediation required.",
      requiredRepairs: "Full well rehabilitation or replacement. Immediate electrical inspection and rewiring. Pressure tank replacement.",
      internalReviewerNotes: "Claim denied pending remediation. Member has been notified. Follow up in 30 days.",
      memberFacingSummary: "Unfortunately your well system does not meet our coverage standards at this time due to safety and operational issues. Please contact a licensed well contractor for remediation.",
      systemScore: 12, systemStatus: "red", finalStatus: "red",
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

  // #4 — Draft (in progress)
  await prisma.inspection.create({
    data: {
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
      pumpAgeYears: 6,
      pressureTankAgeYears: 6,
      casingCondition: "good",
      wellCapCondition: "good",
      wiringCondition: "good",
      systemOperational: true, pressureOk: true, flowOk: true, siteClearanceOk: true,
      visibleLeaks: false, safetyIssues: false, contaminationRisk: false,
      inspectorNotes: "Inspection in progress — awaiting lab results for water quality. Visual inspection of all mechanical components completed with no concerns noted.",
      systemScore: 85, systemStatus: "green", finalStatus: "green",
      statusRationale: ["All visible conditions rated good", "Equipment within normal age range"],
      isDraft: true,
      ghlSyncStatus: "pending",
    },
  });

  // #5 — Green, WV, deep drilled well
  await prisma.inspection.create({
    data: {
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
      pumpAgeYears: 2,
      pressureTankAgeYears: 2,
      casingCondition: "good",
      wellCapCondition: "good",
      wiringCondition: "good",
      visibleLeaks: false, safetyIssues: false, contaminationRisk: false,
      systemOperational: true, pressureOk: true, flowOk: true, siteClearanceOk: true,
      inspectorNotes: "Brand new installation — 2024 build. All permits on file. Excellent pressure, flow rate above threshold. No issues identified.",
      memberFacingSummary: "Your well system is in excellent condition. The equipment is nearly new and all systems are functioning within optimal parameters.",
      systemScore: 97, systemStatus: "green", finalStatus: "green",
      statusRationale: ["All conditions rated good", "Equipment within 2 years old", "Optimal pressure and flow", "No concerns identified"],
      reportId: "WRP-2026-00005",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #6 — Yellow, PA, jet pump aging
  await prisma.inspection.create({
    data: {
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
      pumpAgeYears: 13,
      pressureTankAgeYears: 10,
      casingCondition: "fair",
      wellCapCondition: "good",
      wiringCondition: "fair",
      visibleLeaks: false, safetyIssues: false, contaminationRisk: false,
      systemOperational: true, pressureOk: true, flowOk: true, siteClearanceOk: true,
      inspectorNotes: "Jet pump showing normal wear for its age. Suction line has minor corrosion. Casing has surface oxidation but integrity intact. Recommend monitoring and proactive replacement planning.",
      recommendedRepairs: "Plan pump replacement within 18 months. Inspect and reseal casing exterior. Replace wiring conduit.",
      memberFacingSummary: "Your well is currently working but several components are aging and warrant attention in the near term.",
      systemScore: 58, systemStatus: "yellow", finalStatus: "yellow",
      statusRationale: ["Pump age 13 years exceeds recommended service life", "Casing rated fair", "Wiring rated fair — age-related deterioration noted"],
      reportId: "WRP-2026-00006",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #7 — Red, NC, safety + contamination
  await prisma.inspection.create({
    data: {
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
      pumpAgeYears: 22,
      pressureTankAgeYears: 16,
      casingCondition: "poor",
      wellCapCondition: "poor",
      wiringCondition: "poor",
      visibleLeaks: true, safetyIssues: true, contaminationRisk: true,
      systemOperational: false, pressureOk: false, flowOk: false, siteClearanceOk: true,
      inspectorNotes: "Bored well in critically poor condition. Open well cap allowing debris ingress. Evidence of surface water contamination. Pump seized — non-operational. Wiring bare and dangerous.",
      requiredRepairs: "Complete well abandonment per state regulations OR full rehabilitation to modern drilled standard. Immediate pump and electrical replacement. Decontamination testing required.",
      internalReviewerNotes: "Coverage denied. Member advised to contact state well authority. Risk flag added to account.",
      memberFacingSummary: "Your well system has failed our inspection and cannot be covered in its current state.",
      systemScore: 5, systemStatus: "red", finalStatus: "red",
      statusRationale: ["Safety hazard — electrical wiring exposed", "Contamination risk confirmed", "System non-operational", "All physical components rated poor"],
      reportId: "WRP-2026-00007",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #8 — Green, TN
  await prisma.inspection.create({
    data: {
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
      pumpAgeYears: 7,
      pressureTankAgeYears: 7,
      casingCondition: "good",
      wellCapCondition: "good",
      wiringCondition: "good",
      visibleLeaks: false, safetyIssues: false, contaminationRisk: false,
      systemOperational: true, pressureOk: true, flowOk: true, siteClearanceOk: true,
      inspectorNotes: "Well maintained. Owner has annual servicing records on file. Pressure tank pre-charge verified. Flow test passed at 5.2 gpm.",
      memberFacingSummary: "Your well is in great shape. You clearly maintain it well — keep up the annual servicing schedule.",
      systemScore: 88, systemStatus: "green", finalStatus: "green",
      statusRationale: ["All conditions rated good", "Annual service records verified", "Flow rate 5.2 gpm — within standard"],
      reportId: "WRP-2026-00008",
      isDraft: false,
      ghlSyncStatus: "synced",
    },
  });

  // #9 — Yellow system → Green override (reviewer)
  await prisma.inspection.create({
    data: {
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
      pumpAgeYears: 9,
      pressureTankAgeYears: 5,
      casingCondition: "fair",
      wellCapCondition: "good",
      wiringCondition: "good",
      visibleLeaks: false, safetyIssues: false, contaminationRisk: false,
      systemOperational: true, pressureOk: true, flowOk: true, siteClearanceOk: true,
      inspectorNotes: "Casing has minor surface corrosion consistent with soil chemistry in this region — not structural. Pump performing well. New pressure tank installed last year.",
      internalReviewerNotes: "Score landed at 64 (yellow) due to casing rating but reviewer confirmed this is a known benign regional issue. Overriding to green.",
      memberFacingSummary: "Your well system is approved. The minor casing surface condition noted in the report is a regional characteristic and not a structural or operational concern.",
      systemScore: 64, systemStatus: "yellow", finalStatus: "green",
      overrideReason: "Regional soil chemistry causes surface oxidation on casings in this area — confirmed benign by senior reviewer.",
      statusRationale: ["Casing rated fair — surface oxidation noted", "All operational checks passed", "New pressure tank installed 2025"],
      reportId: "WRP-2026-00009",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #10 — Yellow system → Red override (contamination policy)
  await prisma.inspection.create({
    data: {
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
      pumpAgeYears: 8,
      pressureTankAgeYears: 8,
      casingCondition: "good",
      wellCapCondition: "fair",
      wiringCondition: "good",
      visibleLeaks: false, safetyIssues: false, contaminationRisk: true,
      systemOperational: true, pressureOk: true, flowOk: true, siteClearanceOk: true,
      inspectorNotes: "Mechanical systems in reasonable condition. Lab water sample returned elevated coliform and nitrate levels exceeding EPA limits. Contamination source believed to be nearby agricultural runoff.",
      requiredRepairs: "Shock chlorination treatment immediately. Reseal wellhead cap. Quarterly water testing for 12 months minimum.",
      internalReviewerNotes: "Despite mechanical score of 66 (yellow), contamination finding triggers automatic not-approved override per policy section 4.2.",
      memberFacingSummary: "While your well equipment is in reasonable mechanical condition, water quality testing revealed contamination that exceeds safe limits.",
      systemScore: 66, systemStatus: "yellow", finalStatus: "red",
      overrideReason: "Policy 4.2: contamination risk finding triggers mandatory not-approved status regardless of mechanical score.",
      statusRationale: ["Contamination risk identified — coliform and nitrate above EPA limits", "Well cap rated fair", "Mechanical equipment otherwise in acceptable condition"],
      reportId: "WRP-2026-00010",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #11 — Green, VA, older but maintained
  await prisma.inspection.create({
    data: {
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
      pumpAgeYears: 14,
      pressureTankAgeYears: 6,
      casingCondition: "good",
      wellCapCondition: "good",
      wiringCondition: "fair",
      visibleLeaks: false, safetyIssues: false, contaminationRisk: false,
      systemOperational: true, pressureOk: true, flowOk: true, siteClearanceOk: true,
      inspectorNotes: "Pump is at 14 years — older than ideal but performance is within spec and owner has maintenance records. Wiring shows age but is serviceable.",
      recommendedRepairs: "Budget for pump replacement within 2 years. Update wiring insulation.",
      internalReviewerNotes: "Borderline score but all operational checks pass and maintenance history is strong. Approving green.",
      memberFacingSummary: "Your well is approved. It is older but clearly well maintained.",
      systemScore: 71, systemStatus: "green", finalStatus: "green",
      statusRationale: ["System operational with verified maintenance history", "Wiring rated fair — age noted but serviceable", "Pump at 14 years — approaching replacement window"],
      reportId: "WRP-2026-00011",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #12 — Yellow, WV, pressure issues
  await prisma.inspection.create({
    data: {
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
      pumpAgeYears: 10,
      pressureTankAgeYears: 12,
      casingCondition: "good",
      wellCapCondition: "good",
      wiringCondition: "good",
      visibleLeaks: false, safetyIssues: false, contaminationRisk: false,
      systemOperational: true, pressureOk: false, flowOk: true, siteClearanceOk: true,
      inspectorNotes: "Pressure tank waterlogged — bladder failure. System can draw water but pressure is inconsistent and drops rapidly under load. Pump cycling too frequently.",
      requiredRepairs: "Replace pressure tank immediately.",
      memberFacingSummary: "Your well pump is operational but the pressure tank has failed and needs replacement.",
      systemScore: 55, systemStatus: "yellow", finalStatus: "yellow",
      statusRationale: ["Pressure not within range — waterlogged tank", "Pressure tank age 12 years — bladder failed"],
      reportId: "WRP-2026-00012",
      isDraft: false,
      ghlSyncStatus: "pending",
    },
  });

  // #13 — Green, MD, brand new
  await prisma.inspection.create({
    data: {
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
      pumpAgeYears: 1,
      pressureTankAgeYears: 1,
      casingCondition: "good",
      wellCapCondition: "good",
      wiringCondition: "good",
      visibleLeaks: false, safetyIssues: false, contaminationRisk: false,
      systemOperational: true, pressureOk: true, flowOk: true, siteClearanceOk: true,
      inspectorNotes: "New construction — 2025 installation. Water quality test clear. All equipment under manufacturer warranty.",
      memberFacingSummary: "Your well system is new and in perfect condition. Welcome to Welgard — your system is fully approved.",
      systemScore: 100, systemStatus: "green", finalStatus: "green",
      statusRationale: ["All conditions rated good", "New installation 2025", "Water quality test clear", "All equipment under manufacturer warranty"],
      reportId: "WRP-2026-00013",
      isDraft: false,
      ghlSyncStatus: "synced",
    },
  });

  // #14 — Draft, PA
  await prisma.inspection.create({
    data: {
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
      pumpAgeYears: 5,
      pressureTankAgeYears: 5,
      casingCondition: "good",
      wellCapCondition: "good",
      wiringCondition: "good",
      visibleLeaks: false, safetyIssues: false, contaminationRisk: false,
      systemOperational: true, pressureOk: true, flowOk: true, siteClearanceOk: true,
      inspectorNotes: "Inspection complete. Water sample submitted to lab — results pending.",
      systemScore: 90, systemStatus: "green", finalStatus: "green",
      statusRationale: ["All conditions rated good", "Equipment within normal age range"],
      isDraft: true,
      ghlSyncStatus: "pending",
    },
  });

  console.log("Seed complete — 20 inspectors, 2 vendors, 3 members, 14 inspections (12 published + 2 drafts)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
