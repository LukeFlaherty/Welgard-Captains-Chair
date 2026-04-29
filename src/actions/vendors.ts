"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  getActor, logActivity, diffObjects, fieldLabel,
  VENDOR_SKIP_FIELDS,
} from "@/lib/activity";

async function requireAdminOrTeamMember() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "team_member") {
    throw new Error("Unauthorized.");
  }
  return session;
}

export type VendorFormValues = {
  companyName: string;
  vendorType?: string;
  rating?: string;
  primaryContact?: string;
  email?: string;
  phone?: string;
  phone2?: string;
  licenseNumber?: string;
  notes?: string;
  websiteUrl?: string;
  ghlReferenceId?: string;
};

export type VendorRow = {
  id: string;
  companyName: string;
  vendorType: string | null;
  primaryContact: string | null;
  email: string | null;
  phone: string | null;
  phone2: string | null;
  licenseNumber: string | null;
  rating: string | null;
  city: string | null;
  state: string | null;
  ghlReferenceId: string | null;
  createdAt: Date;
  _count: {
    inspectors: number;
    inspections: number;
    users: number;
  };
};

const VENDOR_SELECT = {
  id: true,
  companyName: true,
  vendorType: true,
  primaryContact: true,
  email: true,
  phone: true,
  phone2: true,
  licenseNumber: true,
  rating: true,
  city: true,
  state: true,
  ghlReferenceId: true,
  createdAt: true,
  _count: { select: { inspectors: true, inspections: true, users: true } },
} as const;

export async function listVendors(opts: {
  search?: string;
  page?: number;
  pageSize?: number;
} = {}): Promise<{ data: VendorRow[]; total: number }> {
  await requireAdminOrTeamMember();
  const { search, page = 1, pageSize = 100 } = opts;
  const skip = (page - 1) * pageSize;

  const where = search
    ? {
        OR: [
          { companyName: { contains: search, mode: "insensitive" as const } },
          { primaryContact: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    db.vendor.findMany({ where, orderBy: { companyName: "asc" }, skip, take: pageSize, select: VENDOR_SELECT }),
    db.vendor.count({ where }),
  ]);

  return { data, total };
}

export async function getVendorStats(): Promise<{ total: number; totalInspectors: number; totalInspections: number }> {
  await requireAdminOrTeamMember();
  const [total, inspectors, inspections] = await Promise.all([
    db.vendor.count(),
    db.inspector.count(),
    db.inspection.count(),
  ]);
  return { total, totalInspectors: inspectors, totalInspections: inspections };
}

export async function getVendor(id: string) {
  await requireAdminOrTeamMember();
  return db.vendor.findUnique({
    where: { id },
    include: {
      inspectors: { orderBy: { name: "asc" }, select: { id: true, name: true, email: true, status: true, yearsExperience: true, licenseNumber: true } },
      users: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, createdAt: true } },
    },
  });
}

export async function listVendorInspections(
  vendorId: string,
  opts: { page?: number; pageSize?: number } = {}
) {
  const { page = 1, pageSize = 50 } = opts;
  const skip = (page - 1) * pageSize;
  const [data, total] = await Promise.all([
    db.inspection.findMany({
      where: { vendorId },
      orderBy: { inspectionDate: "desc" },
      skip,
      take: pageSize,
      select: {
        id:              true,
        homeownerName:   true,
        propertyAddress: true,
        city:            true,
        state:           true,
        inspectionDate:  true,
        inspectorName:   true,
        finalStatus:     true,
        isDraft:         true,
        reportId:        true,
      },
    }),
    db.inspection.count({ where: { vendorId } }),
  ]);
  return { data, total };
}

export async function createVendor(
  values: VendorFormValues
): Promise<{ id: string } | { error: string }> {
  await requireAdminOrTeamMember();
  try {
    const vendor = await db.vendor.create({
      data: {
        companyName:    values.companyName,
        vendorType:     values.vendorType || null,
        rating:         values.rating || null,
        primaryContact: values.primaryContact || null,
        email:          values.email || null,
        phone:          values.phone || null,
        phone2:         values.phone2 || null,
        licenseNumber:  values.licenseNumber || null,
        notes:          values.notes || null,
        websiteUrl:     values.websiteUrl || null,
        ghlReferenceId: values.ghlReferenceId || null,
      },
    });
    revalidatePath("/vendors");

    const actor = await getActor();
    await logActivity({
      actor,
      entityType: "vendor",
      entityId: vendor.id,
      entityLabel: vendor.companyName,
      action: "created",
      description: `Added vendor company "${vendor.companyName}"`,
    });

    return { id: vendor.id };
  } catch (err) {
    console.error("[createVendor]", err);
    return { error: "Failed to create vendor company." };
  }
}

export async function updateVendor(
  id: string,
  values: VendorFormValues
): Promise<{ id: string } | { error: string }> {
  await requireAdminOrTeamMember();
  try {
    const existing = await db.vendor.findUnique({ where: { id } });
    const data = {
      companyName:    values.companyName,
      vendorType:     values.vendorType || null,
      rating:         values.rating || null,
      primaryContact: values.primaryContact || null,
      email:          values.email || null,
      phone:          values.phone || null,
      phone2:         values.phone2 || null,
      licenseNumber:  values.licenseNumber || null,
      notes:          values.notes || null,
      websiteUrl:     values.websiteUrl || null,
      ghlReferenceId: values.ghlReferenceId || null,
    };
    const vendor = await db.vendor.update({ where: { id }, data });
    revalidatePath("/vendors");
    revalidatePath(`/vendors/${id}`);

    if (existing) {
      const actor = await getActor();
      const changes = diffObjects(
        existing as Record<string, unknown>,
        data as Record<string, unknown>,
        VENDOR_SKIP_FIELDS
      );
      await Promise.all(
        changes.map((c) =>
          logActivity({
            actor,
            entityType: "vendor",
            entityId: id,
            entityLabel: existing.companyName,
            action: "updated",
            field: c.field,
            oldValue: c.oldValue || null,
            newValue: c.newValue || null,
            description: `Updated ${fieldLabel(c.field)} on vendor "${existing.companyName}"`,
          })
        )
      );
    }

    return { id: vendor.id };
  } catch (err) {
    console.error("[updateVendor]", err);
    return { error: "Failed to update vendor company." };
  }
}

export async function deleteVendor(id: string): Promise<{ error?: string }> {
  await requireAdminOrTeamMember();
  try {
    const existing = await db.vendor.findUnique({
      where: { id },
      select: { companyName: true },
    });
    await db.vendor.delete({ where: { id } });
    revalidatePath("/vendors");

    const actor = await getActor();
    await logActivity({
      actor,
      entityType: "vendor",
      entityId: id,
      entityLabel: existing?.companyName ?? id,
      action: "deleted",
      description: `Deleted vendor company "${existing?.companyName ?? id}"`,
    });

    return {};
  } catch (err) {
    console.error("[deleteVendor]", err);
    return { error: "Failed to delete vendor company. It may have linked records." };
  }
}

export async function listVendorsForSelect() {
  return db.vendor.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });
}
