"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { calculateInspection } from "@/lib/inspection-calc";
import { generateReportId } from "@/lib/report-id";
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
    homeownerPhone:        values.homeownerPhone || null,
    propertyAddress:       values.propertyAddress,
    city:                  values.city || null,
    state:                 values.state || null,
    zip:                   values.zip || null,
    inspectorName:         values.inspectorName || null,
    inspectionCompany:     values.inspectionCompany || null,
    inspectionDate:        new Date(values.inspectionDate),
    wellType:              values.wellType || null,
    wellDepthFt:           values.wellDepthFt,
    wellDepthUnknown:      values.wellDepthUnknown,
    pumpType:              values.pumpType || null,
    wellObstructions:      values.wellObstructions || null,
    wellCap:               values.wellCap || null,
    casingHeightInches:    values.casingHeightInches,
    amperageReading:       values.amperageReading,
    tankCondition:         values.tankCondition || null,
    controlBoxCondition:   values.controlBoxCondition || null,
    pressureSwitch:        values.pressureSwitch || null,
    pressureGauge:         values.pressureGauge || null,
    constantPressureSystem: values.constantPressureSystem,
    secondsToHighReading:  values.secondsToHighReading,
    secondsToLowReading:   values.secondsToLowReading,
    wellCalculationVersion: values.wellCalculationVersion,
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
  // Only keep tests that have at least one data point
  const populated = yieldTests.filter(
    (t) => t.startTime || t.totalGallons != null || t.secondsToFillBucket != null
  );

  const activeNumbers = populated.map((t) => t.testNumber);

  // Delete any previously saved tests not in the current set
  await db.yieldTest.deleteMany({
    where: {
      inspectionId,
      testNumber: { notIn: activeNumbers.length > 0 ? activeNumbers : [-1] },
    },
  });

  // Upsert each populated test
  for (const t of populated) {
    await db.yieldTest.upsert({
      where: { inspectionId_testNumber: { inspectionId, testNumber: t.testNumber } },
      create: {
        inspectionId,
        testNumber:          t.testNumber,
        startTime:           t.startTime || null,
        totalGallons:        t.totalGallons,
        secondsToFillBucket: t.secondsToFillBucket,
      },
      update: {
        startTime:           t.startTime || null,
        totalGallons:        t.totalGallons,
        secondsToFillBucket: t.secondsToFillBucket,
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
    const data = buildInspectionData(values);
    await db.inspection.update({ where: { id }, data });
    await syncYieldTests(id, values.yieldTests);
    revalidatePath("/inspections");
    revalidatePath(`/inspections/${id}`);
    return { id };
  } catch (err) {
    console.error("[updateInspection]", err);
    return { error: "Failed to update inspection record." };
  }
}

export async function deleteInspection(id: string): Promise<{ error?: string }> {
  try {
    await db.inspection.delete({ where: { id } });
    revalidatePath("/inspections");
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
    await db.inspection.update({
      where: { id },
      data: { finalStatus, overrideReason },
    });
    revalidatePath(`/inspections/${id}`);
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

export async function listInspections(companyFilter?: string | null) {
  return db.inspection.findMany({
    where: companyFilter
      ? {
          OR: [
            { inspectionCompany: companyFilter },
            { inspector: { company: companyFilter } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: { photos: { take: 1 } },
  });
}

export async function savePdfUrl(id: string, url: string): Promise<{ error?: string }> {
  try {
    await db.$transaction([
      db.inspection.update({
        where: { id },
        data: { generatedPdfUrl: url, reportGeneratedAt: new Date() },
      }),
      db.pdfGeneration.create({ data: { inspectionId: id, url } }),
    ]);
    revalidatePath(`/inspections/${id}`);
    return {};
  } catch (err) {
    console.error("[savePdfUrl]", err);
    return { error: "Failed to save PDF URL." };
  }
}
