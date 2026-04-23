"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { evaluateInspection } from "@/lib/rules-engine";
import { generateReportId } from "@/lib/report-id";
import type { InspectionFormValues } from "@/types/inspection";

function parseNumber(val: string | undefined): number | null {
  if (!val || val.trim() === "") return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}
function parseInt_(val: string | undefined): number | null {
  if (!val || val.trim() === "") return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function buildCreateData(values: InspectionFormValues) {
  const evaluation = evaluateInspection({
    visibleLeaks: values.visibleLeaks,
    safetyIssues: values.safetyIssues,
    contaminationRisk: values.contaminationRisk,
    systemOperational: values.systemOperational,
    pressureOk: values.pressureOk,
    flowOk: values.flowOk,
    siteClearanceOk: values.siteClearanceOk,
    casingCondition: values.casingCondition || null,
    wellCapCondition: values.wellCapCondition || null,
    wiringCondition: values.wiringCondition || null,
    pumpAgeYears: parseInt_(values.pumpAgeYears),
    pressureTankAgeYears: parseInt_(values.pressureTankAgeYears),
  });

  const finalStatus: string =
    values.finalStatus && (values.finalStatus as string) !== ""
      ? values.finalStatus
      : evaluation.status;

  return {
    inspectorId: values.inspectorId || null,
    homeownerName: values.homeownerName,
    homeownerEmail: values.homeownerEmail || null,
    homeownerPhone: values.homeownerPhone || null,
    propertyAddress: values.propertyAddress,
    city: values.city || null,
    state: values.state || null,
    zip: values.zip || null,
    inspectorName: values.inspectorName || null,
    inspectionCompany: values.inspectionCompany || null,
    inspectionDate: new Date(values.inspectionDate),
    wellType: values.wellType || null,
    wellDepthFt: parseNumber(values.wellDepthFt),
    pumpType: values.pumpType || null,
    pumpAgeYears: parseInt_(values.pumpAgeYears),
    pressureTankAgeYears: parseInt_(values.pressureTankAgeYears),
    casingCondition: values.casingCondition || null,
    wellCapCondition: values.wellCapCondition || null,
    wiringCondition: values.wiringCondition || null,
    visibleLeaks: values.visibleLeaks,
    safetyIssues: values.safetyIssues,
    contaminationRisk: values.contaminationRisk,
    systemOperational: values.systemOperational,
    pressureOk: values.pressureOk,
    flowOk: values.flowOk,
    siteClearanceOk: values.siteClearanceOk,
    inspectorNotes: values.inspectorNotes || null,
    internalReviewerNotes: values.internalReviewerNotes || null,
    requiredRepairs: values.requiredRepairs || null,
    recommendedRepairs: values.recommendedRepairs || null,
    memberFacingSummary: values.memberFacingSummary || null,
    systemScore: evaluation.score,
    systemStatus: evaluation.status,
    finalStatus,
    overrideReason:
      values.finalStatus && (values.finalStatus as string) !== "" && values.finalStatus !== evaluation.status
        ? values.overrideReason || null
        : null,
    statusRationale: evaluation.rationale,
    ghlContactId: values.ghlContactId || null,
    ghlOpportunityId: values.ghlOpportunityId || null,
    ghlLocationId: values.ghlLocationId || null,
    activity: values.activity || null,
    isDraft: values.isDraft,
    reportId: generateReportId(),
  };
}

export async function createInspection(
  values: InspectionFormValues
): Promise<{ id: string } | { error: string }> {
  try {
    const data = buildCreateData(values);
    const inspection = await db.inspection.create({ data });
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
    const data = buildCreateData(values);
    const inspection = await db.inspection.update({ where: { id }, data });
    revalidatePath("/inspections");
    revalidatePath(`/inspections/${id}`);
    return { id: inspection.id };
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
      photos: true,
      member: true,
      vendor: true,
      inspector: true,
      pdfHistory: { orderBy: { generatedAt: "asc" } },
    },
  });
}

export async function listInspections() {
  return db.inspection.findMany({
    orderBy: { createdAt: "desc" },
    include: { photos: { take: 1 } },
  });
}

export async function savePdfUrl(
  id: string,
  url: string
): Promise<{ error?: string }> {
  try {
    await db.inspection.update({
      where: { id },
      data: { generatedPdfUrl: url, reportGeneratedAt: new Date() },
    });
    revalidatePath(`/inspections/${id}`);
    return {};
  } catch (err) {
    console.error("[savePdfUrl]", err);
    return { error: "Failed to save PDF URL." };
  }
}
