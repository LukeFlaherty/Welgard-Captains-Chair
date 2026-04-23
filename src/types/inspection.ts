import type { Inspection, InspectionPhoto, Inspector, Member, Vendor, YieldTest } from "@/generated/prisma";

export type InspectionStatus = "green" | "yellow" | "red";
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
};

export type InspectionFormValues = {
  // Inspector selection
  inspectorId: string;

  // Member & Property
  homeownerName: string;
  homeownerEmail: string;
  homeownerPhone: string;
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;

  // Inspection Source
  inspectorName: string;
  inspectionCompany: string;
  inspectionDate: string;

  // Well System
  wellType: string;
  wellDepthFt: number | null;
  wellDepthUnknown: boolean;
  pumpType: string;

  // External Equipment
  wellObstructions: string;
  wellCap: string;
  casingHeightInches: number | null;

  // Internal Equipment
  amperageReading: number | null;
  tankCondition: string;
  controlBoxCondition: string;
  pressureSwitch: string;
  pressureGauge: string;
  constantPressureSystem: boolean;

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
