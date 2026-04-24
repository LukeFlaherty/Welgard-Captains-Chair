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
  data: IntakeFormData & { overrideInspectorId?: string }
): Promise<{ id: string } | { error: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };

  const role = session.user.role ?? "vendor";
  const isPrivileged = role === "admin" || role === "team_member";

  // Admins/team members may pass an explicit inspector to submit on behalf of.
  // Everyone else uses the inspector linked to their own session.
  let inspectorId: string | null | undefined;
  if (isPrivileged && data.overrideInspectorId) {
    inspectorId = data.overrideInspectorId;
  } else {
    inspectorId = session.user.inspectorId;
  }

  if (!inspectorId) {
    return { error: "No inspector selected. Please choose an inspector before submitting." };
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
    homeownerEmail2:       "",
    homeownerPhone:        data.homeownerPhone,
    propertyAddress:       data.propertyAddress,
    propertyAddress2:      "",
    city:                  data.city,
    county:                "",
    state:                 data.state,
    zip:                   data.zip,
    realtorInvolved:       false,
    requestedByRealtor:    false,
    realtorName:           "",
    realtorEmail:          "",
    realtorPhone:          "",
    realtorPhoneType:      "",
    inspectionDate:        data.inspectionDate,
    wellType:                  data.wellType,
    wellDepthFt:               data.wellDepthFt,
    wellDepthUnknown:          data.wellDepthUnknown,
    pumpType:                  data.pumpType,
    pumpManufacturer:          "",
    pumpHp:                    "",
    wellCompletionDate:        "",
    wellCompletionDateUnknown: false,
    wellPermit:                "",
    wellPermitUnknown:         false,
    wellDataSource:            "",
    wellObstructions:          data.wellObstructions,
    wellCap:                   data.wellCap,
    casingHeightInches:        data.casingHeightInches,
    casingType:                "",
    casingSize:                "",
    distanceFromHouseFt:       null,
    amperageReading:           data.amperageReading,
    tankCondition:             data.tankCondition,
    tankBrand:                 "",
    tankModel:                 "",
    tankSizeGal:               null,
    psiSettings:               "",
    controlBoxCondition:       data.controlBoxCondition,
    waterTreatment:            "",
    wireType:                  "",
    pressureSwitch:            data.pressureSwitch,
    pressureGauge:             data.pressureGauge,
    constantPressureSystem:    data.constantPressureSystem,
    secondsToHighReading:      data.secondsToHighReading,
    secondsToLowReading:       data.secondsToLowReading,
    yieldTestType:             "",
    yieldTests:                [],
    wellCalculationVersion:    2,
    inspectorNotes:            data.inspectorNotes,
    requiredRepairs:           data.requiredRepairs,
    recommendedRepairs:        data.recommendedRepairs,
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
