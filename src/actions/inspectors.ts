"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  getActor, logActivity, diffObjects, fieldLabel,
  INSPECTOR_SKIP_FIELDS,
} from "@/lib/activity";

export type InspectorFormValues = {
  name: string;
  email: string;
  phone: string;
  company: string;
  licenseNumber: string;
  licenseStates: string; // comma-separated
  certifications: string; // comma-separated
  yearsExperience: string;
  status: string;
  notes: string;
  vendorId?: string | null;
};

function parseArray(val: string): string[] {
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildData(values: InspectorFormValues) {
  return {
    name:           values.name,
    email:          values.email || null,
    phone:          values.phone || null,
    company:        values.company || null,
    licenseNumber:  values.licenseNumber || null,
    licenseStates:  parseArray(values.licenseStates),
    certifications: parseArray(values.certifications),
    yearsExperience: values.yearsExperience ? parseInt(values.yearsExperience, 10) : null,
    status:         values.status || "active",
    notes:          values.notes || null,
    vendorId:       values.vendorId ?? null,
  };
}

export async function listInspectorsForSelect() {
  return db.inspector.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true },
  });
}

export async function listInspectors(opts: {
  search?: string;
  page?: number;
  pageSize?: number;
  vendorId?: string | null;
} = {}) {
  const { search, page = 1, pageSize = 25, vendorId } = opts;
  const skip = (page - 1) * pageSize;

  const vendorWhere = vendorId ? { vendorId } : {};
  const searchWhere = search
    ? {
        OR: [
          { name:          { contains: search, mode: "insensitive" as const } },
          { email:         { contains: search, mode: "insensitive" as const } },
          { company:       { contains: search, mode: "insensitive" as const } },
          { licenseNumber: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};
  const where = { ...vendorWhere, ...searchWhere };

  const [data, total] = await Promise.all([
    db.inspector.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: pageSize,
      include: {
        _count: { select: { inspections: true } },
        inspections: { select: { finalStatus: true, state: true, city: true } },
      },
    }),
    db.inspector.count({ where }),
  ]);

  return { data, total };
}

export async function getInspectorStats(vendorId?: string | null) {
  const where = vendorId ? { vendorId } : {};
  const inspWhere = vendorId ? { inspector: { vendorId } } : {};

  const [total, active, greenCount, redCount, inspectionTotal] = await Promise.all([
    db.inspector.count({ where }),
    db.inspector.count({ where: { ...where, status: "active" } }),
    db.inspection.count({ where: { ...inspWhere, finalStatus: "green" } }),
    db.inspection.count({ where: { ...inspWhere, finalStatus: "red" } }),
    db.inspection.count({ where: inspWhere }),
  ]);

  return { total, active, green: greenCount, red: redCount, inspections: inspectionTotal };
}

export async function getInspector(id: string) {
  return db.inspector.findUnique({
    where: { id },
    include: {
      inspections: {
        orderBy: { inspectionDate: "desc" },
        select: {
          id: true,
          homeownerName: true,
          propertyAddress: true,
          city: true,
          state: true,
          inspectionDate: true,
          finalStatus: true,
          membershipTier: true,
          isDraft: true,
          reportId: true,
        },
      },
    },
  });
}

export async function createInspector(
  values: InspectorFormValues
): Promise<{ id: string } | { error: string }> {
  try {
    const inspector = await db.inspector.create({ data: buildData(values) });
    revalidatePath("/inspectors");

    const actor = await getActor();
    await logActivity({
      actor,
      entityType: "inspector",
      entityId: inspector.id,
      entityLabel: inspector.name,
      action: "created",
      description: `Added inspector "${inspector.name}"${inspector.company ? ` (${inspector.company})` : ""}`,
    });

    return { id: inspector.id };
  } catch (err) {
    console.error("[createInspector]", err);
    return { error: "Failed to create inspector." };
  }
}

export async function updateInspector(
  id: string,
  values: InspectorFormValues
): Promise<{ id: string } | { error: string }> {
  try {
    const existing = await db.inspector.findUnique({ where: { id } });
    const data = buildData(values);
    const inspector = await db.inspector.update({ where: { id }, data });
    revalidatePath("/inspectors");
    revalidatePath(`/inspectors/${id}`);

    if (existing) {
      const actor = await getActor();
      const changes = diffObjects(
        existing as Record<string, unknown>,
        data as Record<string, unknown>,
        INSPECTOR_SKIP_FIELDS
      );
      await Promise.all(
        changes.map((c) =>
          logActivity({
            actor,
            entityType: "inspector",
            entityId: id,
            entityLabel: existing.name,
            action: "updated",
            field: c.field,
            oldValue: c.oldValue || null,
            newValue: c.newValue || null,
            description: `Updated ${fieldLabel(c.field)} on inspector "${existing.name}"`,
          })
        )
      );
    }

    return { id: inspector.id };
  } catch (err) {
    console.error("[updateInspector]", err);
    return { error: "Failed to update inspector." };
  }
}
