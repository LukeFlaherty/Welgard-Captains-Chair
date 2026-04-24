"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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
  inspectorName?: string;
  email?: string;
  phone?: string;
  licenseNumber?: string;
  ghlReferenceId?: string;
};

export type VendorRow = {
  id: string;
  companyName: string;
  inspectorName: string | null;
  email: string | null;
  phone: string | null;
  licenseNumber: string | null;
  ghlReferenceId: string | null;
  createdAt: Date;
  _count: {
    inspectors: number;
    inspections: number;
    users: number;
  };
};

export async function listVendors(): Promise<VendorRow[]> {
  await requireAdminOrTeamMember();
  return db.vendor.findMany({
    orderBy: { companyName: "asc" },
    include: {
      _count: { select: { inspectors: true, inspections: true, users: true } },
    },
  });
}

export async function getVendor(id: string) {
  await requireAdminOrTeamMember();
  return db.vendor.findUnique({
    where: { id },
    include: {
      inspectors: { orderBy: { name: "asc" }, select: { id: true, name: true, email: true, status: true, yearsExperience: true, licenseNumber: true } },
      users: { orderBy: { createdAt: "asc" }, select: { id: true, name: true, email: true, role: true, createdAt: true } },
      inspections: {
        orderBy: { inspectionDate: "desc" },
        take: 10,
        select: { id: true, homeownerName: true, propertyAddress: true, city: true, state: true, inspectionDate: true, finalStatus: true, isDraft: true, reportId: true },
      },
    },
  });
}

export async function createVendor(
  values: VendorFormValues
): Promise<{ id: string } | { error: string }> {
  await requireAdminOrTeamMember();
  try {
    const vendor = await db.vendor.create({
      data: {
        companyName: values.companyName,
        inspectorName: values.inspectorName || null,
        email: values.email || null,
        phone: values.phone || null,
        licenseNumber: values.licenseNumber || null,
        ghlReferenceId: values.ghlReferenceId || null,
      },
    });
    revalidatePath("/vendors");
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
    const vendor = await db.vendor.update({
      where: { id },
      data: {
        companyName: values.companyName,
        inspectorName: values.inspectorName || null,
        email: values.email || null,
        phone: values.phone || null,
        licenseNumber: values.licenseNumber || null,
        ghlReferenceId: values.ghlReferenceId || null,
      },
    });
    revalidatePath("/vendors");
    revalidatePath(`/vendors/${id}`);
    return { id: vendor.id };
  } catch (err) {
    console.error("[updateVendor]", err);
    return { error: "Failed to update vendor company." };
  }
}

export async function deleteVendor(id: string): Promise<{ error?: string }> {
  await requireAdminOrTeamMember();
  try {
    await db.vendor.delete({ where: { id } });
    revalidatePath("/vendors");
    return {};
  } catch (err) {
    console.error("[deleteVendor]", err);
    return { error: "Failed to delete vendor company. It may have linked records." };
  }
}
