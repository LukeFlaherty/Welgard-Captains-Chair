import type { Inspection, InspectionPhoto, Inspector, Member, Vendor } from "@/generated/prisma";

export type InspectionStatus = "green" | "yellow" | "red";
export type ConditionRating = "good" | "fair" | "poor";
export type GhlSyncStatus = "pending" | "synced" | "error";

export type InspectionWithRelations = Inspection & {
  photos: InspectionPhoto[];
  member: Member | null;
  vendor: Vendor | null;
  inspector: Inspector | null;
};

export type StatusEvaluation = {
  status: InspectionStatus;
  score: number;
  rationale: string[];
};

export type InspectionFormValues = {
  inspectorId: string;
  homeownerName: string;
  homeownerEmail: string;
  homeownerPhone: string;
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;
  inspectorName: string;
  inspectionCompany: string;
  inspectionDate: string;
  wellType: string;
  wellDepthFt: string;
  pumpType: string;
  pumpAgeYears: string;
  pressureTankAgeYears: string;
  casingCondition: ConditionRating | "";
  wellCapCondition: ConditionRating | "";
  wiringCondition: ConditionRating | "";
  visibleLeaks: boolean;
  safetyIssues: boolean;
  contaminationRisk: boolean;
  systemOperational: boolean;
  pressureOk: boolean;
  flowOk: boolean;
  siteClearanceOk: boolean;
  inspectorNotes: string;
  internalReviewerNotes: string;
  requiredRepairs: string;
  recommendedRepairs: string;
  memberFacingSummary: string;
  finalStatus: InspectionStatus | "";
  overrideReason: string;
  ghlContactId: string;
  ghlOpportunityId: string;
  ghlLocationId: string;
  activity: string;
  isDraft: boolean;
};
