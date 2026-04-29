"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { calculateInspection } from "@/lib/inspection-calc";
import { generateReportId } from "@/lib/report-id";
import {
  getActor, logActivity, diffObjects, fieldLabel,
  INSPECTION_SKIP_FIELDS,
} from "@/lib/activity";
import {
  searchContactByEmail,
  fetchCustomFieldMap,
  updateContactCustomFields,
  buildCustomFieldPayload,
} from "@/lib/ghl";
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
    tankSizeGal:             values.tankSizeGal,
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
    upcharges:       calc.upcharges,
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

export async function listInspections(opts: {
  vendorId?: string | null;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const { vendorId, search, page = 1, pageSize = 100 } = opts;
  const skip = (page - 1) * pageSize;

  const andClauses: object[] = [];
  if (vendorId) {
    andClauses.push({ OR: [{ vendorId }, { inspector: { vendorId } }] });
  }
  if (search) {
    andClauses.push({
      OR: [
        { homeownerName:     { contains: search, mode: "insensitive" } },
        { propertyAddress:   { contains: search, mode: "insensitive" } },
        { city:              { contains: search, mode: "insensitive" } },
        { state:             { contains: search, mode: "insensitive" } },
        { inspectorName:     { contains: search, mode: "insensitive" } },
        { inspectionCompany: { contains: search, mode: "insensitive" } },
      ],
    });
  }
  const where = andClauses.length ? { AND: andClauses } : {};

  const [data, total, statusGroups] = await Promise.all([
    db.inspection.findMany({
      where,
      orderBy: { inspectionDate: "desc" },
      skip,
      take: pageSize,
      select: {
        id:               true,
        homeownerName:    true,
        propertyAddress:  true,
        city:             true,
        state:            true,
        inspectionDate:   true,
        inspectorName:    true,
        finalStatus:      true,
        isDraft:          true,
        generatedPdfUrl:  true,
        createdAt:        true,
        activity:         true,
      },
    }),
    db.inspection.count({ where }),
    db.inspection.groupBy({ by: ["finalStatus"], where, _count: { _all: true } }),
  ]);

  const statusCounts: Record<string, number> = Object.fromEntries(
    statusGroups.map((g) => [g.finalStatus, g._count._all])
  );

  return { data, total, statusCounts };
}

// Simple null-field checks — extend as new data quality rules are identified.
const DATA_QUALITY_CHECKS: Array<{ field: string; label: string; where: object }> = [
  { field: "inspectorName", label: "Missing inspector", where: { inspectorName: null } },
];

export async function listFlaggedInspections(vendorId?: string | null) {
  const vendorFilter = vendorId
    ? { OR: [{ vendorId }, { inspector: { vendorId } }] }
    : undefined;

  const baseSelect = {
    id:               true,
    homeownerName:    true,
    propertyAddress:  true,
    city:             true,
    state:            true,
    inspectionDate:   true,
    inspectionCompany: true,
    inspectorName:    true,
    isDraft:          true,
    finalStatus:      true,
    constantPressureSystem: true,
    photos: { select: { id: true, label: true } },
  } as const;

  // Query 1: simple null-field checks
  const nullFieldWhere = {
    AND: [
      ...(vendorFilter ? [vendorFilter] : []),
      { OR: DATA_QUALITY_CHECKS.map((c) => c.where) },
    ],
  };

  // Query 2: CPS present but no control_box_cps photo
  const cpsWhere = {
    AND: [
      ...(vendorFilter ? [vendorFilter] : []),
      { constantPressureSystem: true },
      { photos: { none: { label: "control_box_cps" } } },
    ],
  };

  const [nullFieldRows, cpsRows] = await Promise.all([
    db.inspection.findMany({ where: nullFieldWhere, orderBy: { inspectionDate: "desc" }, select: baseSelect }),
    db.inspection.findMany({ where: cpsWhere,      orderBy: { inspectionDate: "desc" }, select: baseSelect }),
  ]);

  // Merge, deduplicate by id, annotate issues
  const byId = new Map<string, typeof nullFieldRows[0]>();
  for (const r of [...nullFieldRows, ...cpsRows]) byId.set(r.id, r);

  return [...byId.values()].sort(
    (a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime()
  ).map((row) => {
    const issues: string[] = [];
    for (const check of DATA_QUALITY_CHECKS) {
      const val = row[check.field as keyof typeof row];
      if (val === null || val === undefined) issues.push(check.label);
    }
    if (row.constantPressureSystem && !row.photos.some((p) => p.label === "control_box_cps")) {
      issues.push("CPS photo required");
    }
    return { ...row, issues };
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

export async function syncInspectionToGhl(
  id: string
): Promise<{ ghlContactId?: string; fieldsUpdated?: number; error?: string }> {
  if (!process.env.GHL_API_KEY) {
    return { error: "GHL integration is not configured (missing API key)." };
  }

  const inspection = await db.inspection.findUnique({
    where: { id },
    include: { inspector: true },
  });

  if (!inspection) return { error: "Inspection not found." };

  const label = `${inspection.homeownerName} – ${inspection.propertyAddress}`;
  const actor = await getActor();

  if (!inspection.homeownerEmail) {
    return { error: "No homeowner email on this inspection — cannot look up a GHL contact." };
  }

  // ─── 1. Find contact by email ──────────────────────────────────────────────
  let contact;
  try {
    contact = await searchContactByEmail(inspection.homeownerEmail);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[syncInspectionToGhl] contact search error:", msg);
    await db.inspection.update({ where: { id }, data: { ghlSyncStatus: "error" } });
    await logActivity({
      actor,
      entityType: "inspection",
      entityId: id,
      entityLabel: label,
      action: "synced",
      newValue: "error",
      description: `GHL sync failed for ${label}: could not reach GHL — ${msg}`,
    });
    return { error: `Could not reach GHL: ${msg}` };
  }

  if (!contact) {
    await db.inspection.update({ where: { id }, data: { ghlSyncStatus: "error" } });
    await logActivity({
      actor,
      entityType: "inspection",
      entityId: id,
      entityLabel: label,
      action: "synced",
      newValue: "error",
      description: `GHL sync failed for ${label}: no contact found with email "${inspection.homeownerEmail}"`,
    });
    return { error: `No GHL contact found with email "${inspection.homeownerEmail}". Make sure the contact exists in GHL first.` };
  }

  // ─── 2. Build field payload ────────────────────────────────────────────────
  let fieldMap: Map<string, string>;
  try {
    fieldMap = await fetchCustomFieldMap();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[syncInspectionToGhl] custom field fetch error:", msg);
    await db.inspection.update({ where: { id }, data: { ghlSyncStatus: "error" } });
    await logActivity({
      actor,
      entityType: "inspection",
      entityId: id,
      entityLabel: label,
      action: "synced",
      newValue: "error",
      description: `GHL sync failed for ${label}: could not fetch custom fields — ${msg}`,
    });
    return { error: `Could not fetch GHL custom fields: ${msg}` };
  }

  const customFields = buildCustomFieldPayload(inspection, fieldMap);

  if (customFields.length === 0) {
    return { error: "No matching GHL custom fields found. Check that the Well Details fields exist in your GHL location." };
  }

  // ─── 3. Push to GHL ───────────────────────────────────────────────────────
  try {
    await updateContactCustomFields(contact.id, customFields);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[syncInspectionToGhl] contact update error:", msg);
    await db.inspection.update({
      where: { id },
      data: { ghlContactId: contact.id, ghlSyncStatus: "error" },
    });
    await logActivity({
      actor,
      entityType: "inspection",
      entityId: id,
      entityLabel: label,
      action: "synced",
      newValue: "error",
      description: `GHL sync failed for ${label}: found contact ${contact.id} but field update failed — ${msg}`,
    });
    return { error: `Found GHL contact but the field update failed: ${msg}` };
  }

  // ─── 4. Persist sync state ────────────────────────────────────────────────
  await db.inspection.update({
    where: { id },
    data: {
      ghlContactId:  contact.id,
      ghlLocationId: process.env.GHL_LOCATION_ID ?? null,
      ghlSyncStatus: "synced",
      lastSyncedAt:  new Date(),
    },
  });

  revalidatePath(`/inspections/${id}`);

  await logActivity({
    actor,
    entityType: "inspection",
    entityId: id,
    entityLabel: label,
    action: "synced",
    newValue: "synced",
    description: `Synced ${customFields.length} fields to GHL contact ${contact.id} for ${label}`,
  });

  return { ghlContactId: contact.id, fieldsUpdated: customFields.length };
}
