import type { Inspection, InspectionPhoto, Inspector, Member, Vendor, YieldTest } from "@/generated/prisma";

export type InspectionStatus = "green" | "yellow" | "red" | "ineligible";
export type GhlSyncStatus = "pending" | "synced" | "error";

export type InspectionWithRelations = Inspection & {
  photos: InspectionPhoto[];
  member: Member | null;
  vendor: Vendor | null;
  inspector: Inspector | null;
  yieldTests: YieldTest[];
};

export type YieldTestFormValues = {
  testNumber: number;
  startTime: string;          // "HH:MM" or ""
  totalGallons: number | null;
  secondsToFillBucket: number | null;
  staticWaterLevelFt: number | null;
};

export type InspectionFormValues = {
  // Inspector selection
  inspectorId: string;

  // Member & Property
  homeownerName: string;
  homeownerEmail: string;
  homeownerEmail2: string;
  homeownerPhone: string;
  propertyAddress: string;
  propertyAddress2: string;
  city: string;
  county: string;
  state: string;
  zip: string;

  // Realtor
  realtorInvolved: boolean;
  requestedByRealtor: boolean;
  realtorName: string;
  realtorEmail: string;
  realtorPhone: string;
  realtorPhoneType: string;

  // Inspection Source
  inspectorName: string;
  inspectionCompany: string;
  inspectionDate: string;

  // Well System
  wellType: string;
  wellDepthFt: number | null;
  wellDepthUnknown: boolean;
  pumpType: string;
  pumpManufacturer: string;
  pumpHp: string;

  // External Equipment
  wellCompletionDate: string;
  wellCompletionDateUnknown: boolean;
  wellPermit: string;
  wellPermitUnknown: boolean;
  wellDataSource: string;
  wellObstructions: string;
  wellCap: string;
  casingHeightInches: number | null;
  casingType: string;
  casingSize: string;
  distanceFromHouseFt: number | null;

  // Internal Equipment
  amperageReading: number | null;
  tankCondition: string;
  tankBrand: string;
  tankModel: string;
  tankSizeGal: number | null;
  psiSettings: string;
  controlBoxCondition: string;
  waterTreatment: string;
  wireType: string;
  pressureSwitch: string;
  pressureGauge: string;
  constantPressureSystem: boolean;

  // Yield Test
  yieldTestType: string;

  // Cycle Test
  secondsToHighReading: number | null;
  secondsToLowReading: number | null;

  // Yield Tests
  yieldTests: YieldTestFormValues[];

  // Calculation version
  wellCalculationVersion: number;

  // Notes & Findings
  inspectorNotes: string;
  internalReviewerNotes: string;
  requiredRepairs: string;
  recommendedRepairs: string;
  memberFacingSummary: string;

  // Review & Status
  activity: string;
  finalStatus: InspectionStatus | "";
  overrideReason: string;
  ghlContactId: string;
  ghlOpportunityId: string;
  ghlLocationId: string;
  isDraft: boolean;
};
