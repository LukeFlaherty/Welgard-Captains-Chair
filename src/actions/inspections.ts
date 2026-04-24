"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { calculateInspection } from "@/lib/inspection-calc";
import { generateReportId } from "@/lib/report-id";
import {
  getActor, logActivity, diffObjects, fieldLabel,
  INSPECTION_SKIP_FIELDS,
} from "@/lib/activity";
import type { InspectionFormValues, YieldTestFormValues } from "@/types/inspection";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toCalcInput(values: InspectionFormValues) {
  return {
    wellType:                values.wellType || null,
    wellDepthFt:             values.wellDepthFt,
    wellDepthUnknown:        values.wellDepthUnknown,
    wellObstructions:        values.wellObstructions || null,
    wellCap:                 values.wellCap || null,
    casingHeightInches:      values.casingHeightInches,
    amperageReading:         values.amperageReading,
    tankCondition:           values.tankCondition || null,
    controlBoxCondition:     values.controlBoxCondition || null,
    pressureSwitch:          values.pressureSwitch || null,
    pressureGauge:           values.pressureGauge || null,
    constantPressureSystem:  values.constantPressureSystem,
    secondsToHighReading:    values.secondsToHighReading,
    secondsToLowReading:     values.secondsToLowReading,
    wellCalculationVersion:  values.wellCalculationVersion,
    state:                   values.state || null,
    yieldTests: values.yieldTests.map((t) => ({
      testNumber:          t.testNumber,
      startTime:           t.startTime || null,
      totalGallons:        t.totalGallons,
      secondsToFillBucket: t.secondsToFillBucket,
    })),
  };
}

function buildInspectionData(values: InspectionFormValues) {
  const calc = calculateInspection(toCalcInput(values));

  const finalStatus: string = values.finalStatus || calc.systemStatus;

  return {
    inspectorId:           values.inspectorId || null,
    homeownerName:         values.homeownerName,
    homeownerEmail:        values.homeownerEmail || null,
    homeownerEmail2:       values.homeownerEmail2 || null,
    homeownerPhone:        values.homeownerPhone || null,
    propertyAddress:       values.propertyAddress,
    propertyAddress2:      values.propertyAddress2 || null,
    city:                  values.city || null,
    county:                values.county || null,
    state:                 values.state || null,
    zip:                   values.zip || null,
    realtorInvolved:       values.realtorInvolved,
    requestedByRealtor:    values.requestedByRealtor,
    realtorName:           values.realtorName || null,
    realtorEmail:          values.realtorEmail || null,
    realtorPhone:          values.realtorPhone || null,
    realtorPhoneType:      values.realtorPhoneType || null,
    inspectorName:         values.inspectorName || null,
    inspectionCompany:     values.inspectionCompany || null,
    inspectionDate:        new Date(values.inspectionDate),
    wellType:                  values.wellType || null,
    wellDepthFt:               values.wellDepthFt,
    wellDepthUnknown:          values.wellDepthUnknown,
    pumpType:                  values.pumpType || null,
    pumpManufacturer:          values.pumpManufacturer || null,
    pumpHp:                    values.pumpHp || null,
    wellCompletionDate:        values.wellCompletionDate || null,
    wellCompletionDateUnknown: values.wellCompletionDateUnknown,
    wellPermit:                values.wellPermit || null,
    wellPermitUnknown:         values.wellPermitUnknown,
    wellDataSource:            values.wellDataSource || null,
    wellObstructions:          values.wellObstructions || null,
    wellCap:                   values.wellCap || null,
    casingHeightInches:        values.casingHeightInches,
    casingType:                values.casingType || null,
    casingSize:                values.casingSize || null,
    distanceFromHouseFt:       values.distanceFromHouseFt,
    amperageReading:           values.amperageReading,
    tankCondition:             values.tankCondition || null,
    tankBrand:                 values.tankBrand || null,
    tankModel:                 values.tankModel || null,
    tankSizeGal:               values.tankSizeGal,
    psiSettings:               values.psiSettings || null,
    controlBoxCondition:       values.controlBoxCondition || null,
    waterTreatment:            values.waterTreatment || null,
    wireType:                  values.wireType || null,
    pressureSwitch:            values.pressureSwitch || null,
    pressureGauge:             values.pressureGauge || null,
    constantPressureSystem:    values.constantPressureSystem,
    secondsToHighReading:      values.secondsToHighReading,
    secondsToLowReading:       values.secondsToLowReading,
    yieldTestType:             values.yieldTestType || null,
    wellCalculationVersion:    values.wellCalculationVersion,
    // Computed fields
    cycleTime:             calc.cycleTime,
    wellYieldGpm:          calc.wellYieldGpm,
    totalGallons:          calc.totalGallons,
    avgMinutesToReach350:  calc.avgMinutesToReach350,
    gallonsPerDay:         calc.gallonsPerDay,
    externalEquipmentStatus: calc.externalEquipmentStatus,
    internalEquipmentStatus: calc.internalEquipmentStatus,
    cycleTimeStatus:       calc.cycleTimeStatus,
    wellYieldStatus:       calc.wellYieldStatus,
    eligibleForSuperior:   calc.eligibleForSuperior,
    membershipTier:        calc.membershipTier,
    systemStatus:          calc.systemStatus,
    finalStatus,
    overrideReason:
      values.finalStatus && values.finalStatus !== calc.systemStatus
        ? values.overrideReason || null
        : null,
    statusRationale: calc.statusRationale,
    inspectorNotes:        values.inspectorNotes || null,
    internalReviewerNotes: values.internalReviewerNotes || null,
    requiredRepairs:       values.requiredRepairs || null,
    recommendedRepairs:    values.recommendedRepairs || null,
    memberFacingSummary:   values.memberFacingSummary || null,
    ghlContactId:          values.ghlContactId || null,
    ghlOpportunityId:      values.ghlOpportunityId || null,
    ghlLocationId:         values.ghlLocationId || null,
    activity:              values.activity || null,
    isDraft:               values.isDraft,
  };
}

// Upsert yield tests: delete removed rows, upsert the rest
async function syncYieldTests(inspectionId: string, yieldTests: YieldTestFormValues[]) {
  const populated = yieldTests.filter(
    (t) => t.startTime || t.totalGallons != null || t.secondsToFillBucket != null
  );

  const activeNumbers = populated.map((t) => t.testNumber);

  await db.yieldTest.deleteMany({
    where: {
      inspectionId,
      testNumber: { notIn: activeNumbers.length > 0 ? activeNumbers : [-1] },
    },
  });

  for (const t of populated) {
    await db.yieldTest.upsert({
      where: { inspectionId_testNumber: { inspectionId, testNumber: t.testNumber } },
      create: {
        inspectionId,
        testNumber:          t.testNumber,
        startTime:           t.startTime || null,
        totalGallons:        t.totalGallons,
        secondsToFillBucket: t.secondsToFillBucket,
        staticWaterLevelFt:  t.staticWaterLevelFt,
      },
      update: {
        startTime:           t.startTime || null,
        totalGallons:        t.totalGallons,
        secondsToFillBucket: t.secondsToFillBucket,
        staticWaterLevelFt:  t.staticWaterLevelFt,
      },
    });
  }
}

// ─── Public actions ───────────────────────────────────────────────────────────

export async function createInspection(
  values: InspectionFormValues
): Promise<{ id: string } | { error: string }> {
  try {
    const data = buildInspectionData(values);
    const inspection = await db.inspection.create({
      data: { ...data, reportId: generateReportId() },
    });
    await syncYieldTests(inspection.id, values.yieldTests);
    revalidatePath("/inspections");

    const actor = await getActor();
    const label = `${values.homeownerName} – ${values.propertyAddress}`;
    await logActivity({
      actor,
      entityType: "inspection",
      entityId: inspection.id,
      entityLabel: label,
      action: "created",
      description: `Created inspection for ${label}`,
    });

    return { id: inspection.id };
  } catch (err) {
    console.error("[createInspection]", err);
    return { error: "Failed to create inspection record." };
  }
}

export async function updateInspection(
  id: string,
  values: InspectionFormValues
): Promise<{ id: string } | { error: string }> {
  try {
    const existing = await db.inspection.findUnique({ where: { id } });
    const data = buildInspectionData(values);
    await db.inspection.update({ where: { id }, data });
    await syncYieldTests(id, values.yieldTests);
    revalidatePath("/inspections");
    revalidatePath(`/inspections/${id}`);

    if (existing) {
      const actor = await getActor();
      const label = `${existing.homeownerName} – ${existing.propertyAddress}`;
      const changes = diffObjects(
        existing as Record<string, unknown>,
        data as Record<string, unknown>,
        INSPECTION_SKIP_FIELDS
      );
      await Promise.all(
        changes.map((c) =>
          logActivity({
            actor,
            entityType: "inspection",
            entityId: id,
            entityLabel: label,
            action: "updated",
            field: c.field,
            oldValue: c.oldValue || null,
            newValue: c.newValue || null,
            description: `Updated ${fieldLabel(c.field)} on inspection for ${label}`,
          })
        )
      );
    }

    return { id };
  } catch (err) {
    console.error("[updateInspection]", err);
    return { error: "Failed to update inspection record." };
  }
}

export async function deleteInspection(id: string): Promise<{ error?: string }> {
  try {
    const existing = await db.inspection.findUnique({
      where: { id },
      select: { homeownerName: true, propertyAddress: true },
    });
    await db.inspection.delete({ where: { id } });
    revalidatePath("/inspections");

    const actor = await getActor();
    const label = existing
      ? `${existing.homeownerName} – ${existing.propertyAddress}`
      : id;
    await logActivity({
      actor,
      entityType: "inspection",
      entityId: id,
      entityLabel: label,
      action: "deleted",
      description: `Deleted inspection for ${label}`,
    });

    return {};
  } catch (err) {
    console.error("[deleteInspection]", err);
    return { error: "Failed to delete inspection record." };
  }
}

export async function overrideInspectionStatus(
  id: string,
  finalStatus: string,
  overrideReason: string
): Promise<{ error?: string }> {
  try {
    const existing = await db.inspection.findUnique({
      where: { id },
      select: { homeownerName: true, propertyAddress: true, finalStatus: true },
    });
    await db.inspection.update({
      where: { id },
      data: { finalStatus, overrideReason },
    });
    revalidatePath(`/inspections/${id}`);

    const actor = await getActor();
    const label = existing
      ? `${existing.homeownerName} – ${existing.propertyAddress}`
      : id;
    await logActivity({
      actor,
      entityType: "inspection",
      entityId: id,
      entityLabel: label,
      action: "status_overridden",
      field: "finalStatus",
      oldValue: existing?.finalStatus ?? null,
      newValue: finalStatus,
      description: `Overrode status to "${finalStatus}" on inspection for ${label}${overrideReason ? ` — ${overrideReason}` : ""}`,
    });

    return {};
  } catch (err) {
    console.error("[overrideInspectionStatus]", err);
    return { error: "Failed to override status." };
  }
}

export async function getInspection(id: string) {
  return db.inspection.findUnique({
    where: { id },
    include: {
      photos:    true,
      member:    true,
      vendor:    true,
      inspector: true,
      yieldTests: { orderBy: { testNumber: "asc" } },
      pdfHistory: { orderBy: { generatedAt: "asc" } },
    },
  });
}

export async function listInspections(vendorId?: string | null) {
  return db.inspection.findMany({
    where: vendorId
      ? {
          OR: [
            { vendorId },
            { inspector: { vendorId } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { photos: { take: 1 } },
  });
}

export async function savePdfUrl(id: string, url: string): Promise<{ error?: string }> {
  try {
    const inspection = await db.inspection.findUnique({
      where: { id },
      select: { homeownerName: true, propertyAddress: true, reportId: true },
    });
    await db.$transaction([
      db.inspection.update({
        where: { id },
        data: { generatedPdfUrl: url, reportGeneratedAt: new Date() },
      }),
      db.pdfGeneration.create({ data: { inspectionId: id, url } }),
    ]);
    revalidatePath(`/inspections/${id}`);

    const actor = await getActor();
    const label = inspection
      ? `${inspection.homeownerName} – ${inspection.propertyAddress}`
      : id;
    await logActivity({
      actor,
      entityType: "pdf",
      entityId: id,
      entityLabel: label,
      action: "generated",
      description: `Generated PDF report for ${label}`,
    });

    return {};
  } catch (err) {
    console.error("[savePdfUrl]", err);
    return { error: "Failed to save PDF URL." };
  }
}
