"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createInspection } from "@/actions/inspections";
import type { InspectionFormValues } from "@/types/inspection";

export type IntakeFormData = {
  // Property & Homeowner
  homeownerName: string;
  homeownerEmail: string;
  homeownerPhone: string;
  propertyAddress: string;
  city: string;
  state: string;
  zip: string;

  // Inspection info
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

  // Notes
  inspectorNotes: string;
  requiredRepairs: string;
  recommendedRepairs: string;
};

export async function createIntakeInspection(
  data: IntakeFormData
): Promise<{ id: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const inspectorId = session.user.inspectorId;
  if (!inspectorId) {
    return { error: "Your account is not linked to an inspector profile. Contact Welgard to get set up." };
  }

  const inspector = await db.inspector.findUnique({
    where: { id: inspectorId },
    select: { name: true, company: true, vendorId: true },
  });
  if (!inspector) {
    return { error: "Inspector profile not found. Contact Welgard to get set up." };
  }

  const formValues: InspectionFormValues = {
    inspectorId,
    inspectorName: inspector.name,
    inspectionCompany: inspector.company ?? "",
    isDraft: true,
    // Inspector-provided fields
    homeownerName:         data.homeownerName,
    homeownerEmail:        data.homeownerEmail,
    homeownerPhone:        data.homeownerPhone,
    propertyAddress:       data.propertyAddress,
    city:                  data.city,
    state:                 data.state,
    zip:                   data.zip,
    inspectionDate:        data.inspectionDate,
    wellType:              data.wellType,
    wellDepthFt:           data.wellDepthFt,
    wellDepthUnknown:      data.wellDepthUnknown,
    pumpType:              data.pumpType,
    wellObstructions:      data.wellObstructions,
    wellCap:               data.wellCap,
    casingHeightInches:    data.casingHeightInches,
    amperageReading:       data.amperageReading,
    tankCondition:         data.tankCondition,
    controlBoxCondition:   data.controlBoxCondition,
    pressureSwitch:        data.pressureSwitch,
    pressureGauge:         data.pressureGauge,
    constantPressureSystem: data.constantPressureSystem,
    secondsToHighReading:  data.secondsToHighReading,
    secondsToLowReading:   data.secondsToLowReading,
    yieldTests:            [],
    wellCalculationVersion: 2,
    inspectorNotes:        data.inspectorNotes,
    requiredRepairs:       data.requiredRepairs,
    recommendedRepairs:    data.recommendedRepairs,
    // Internal fields not used at intake
    internalReviewerNotes: "",
    memberFacingSummary:   "",
    activity:              "",
    finalStatus:           "",
    overrideReason:        "",
    ghlContactId:          "",
    ghlOpportunityId:      "",
    ghlLocationId:         "",
  };

  const result = await createInspection(formValues);

  // Link the inspector's vendor company to the inspection if available
  if ("id" in result && inspector.vendorId) {
    await db.inspection.update({
      where: { id: result.id },
      data: { vendorId: inspector.vendorId },
    });
    revalidatePath("/inspections");
  }

  return result;
}
