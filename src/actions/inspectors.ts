"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

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
};

function parseArray(val: string): string[] {
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function buildData(values: InspectorFormValues) {
  return {
    name: values.name,
    email: values.email || null,
    phone: values.phone || null,
    company: values.company || null,
    licenseNumber: values.licenseNumber || null,
    licenseStates: parseArray(values.licenseStates),
    certifications: parseArray(values.certifications),
    yearsExperience: values.yearsExperience ? parseInt(values.yearsExperience, 10) : null,
    status: values.status || "active",
    notes: values.notes || null,
  };
}

export async function listInspectorsForSelect() {
  return db.inspector.findMany({
    where: { status: "active" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true },
  });
}

export async function listInspectors() {
  return db.inspector.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { inspections: true } },
      inspections: {
        select: { finalStatus: true, state: true, city: true },
      },
    },
  });
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
    const inspector = await db.inspector.update({
      where: { id },
      data: buildData(values),
    });
    revalidatePath("/inspectors");
    revalidatePath(`/inspectors/${id}`);
    return { id: inspector.id };
  } catch (err) {
    console.error("[updateInspector]", err);
    return { error: "Failed to update inspector." };
  }
}
