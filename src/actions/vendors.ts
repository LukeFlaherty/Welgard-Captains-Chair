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
  vendorType?: string;
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

export async function listVendors(): Promise<VendorRow[]> {
  await requireAdminOrTeamMember();
  return db.vendor.findMany({
    orderBy: { companyName: "asc" },
    select: {
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
        vendorType: values.vendorType || null,
        primaryContact: values.primaryContact || null,
        email: values.email || null,
        phone: values.phone || null,
        phone2: values.phone2 || null,
        licenseNumber: values.licenseNumber || null,
        notes: values.notes || null,
        websiteUrl: values.websiteUrl || null,
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
        vendorType: values.vendorType || null,
        primaryContact: values.primaryContact || null,
        email: values.email || null,
        phone: values.phone || null,
        phone2: values.phone2 || null,
        licenseNumber: values.licenseNumber || null,
        notes: values.notes || null,
        websiteUrl: values.websiteUrl || null,
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
