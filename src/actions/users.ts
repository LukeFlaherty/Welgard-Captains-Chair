"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getActor, logActivity } from "@/lib/activity";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  inspectorId: string | null;
  vendorId: string | null;
  companyName: string | null;
  createdAt: Date;
};

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized: admin access required.");
  }
  return session;
}

async function requireAdminOrTeamMember() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "team_member") {
    throw new Error("Unauthorized.");
  }
  return session;
}

export async function listUsers(): Promise<UserRow[]> {
  await requireAdminOrTeamMember();
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      inspectorId: true,
      inspector: { select: { company: true } },
      vendorId: true,
      vendor: { select: { companyName: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    inspectorId: u.inspectorId,
    vendorId: u.vendorId,
    companyName: u.vendor?.companyName ?? u.inspector?.company ?? null,
    createdAt: u.createdAt,
  }));
}

export async function listVendorsForSelect() {
  await requireAdminOrTeamMember();
  return db.vendor.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  vendorId?: string | null;
  newVendorName?: string;
  newVendorEmail?: string;
  newVendorPhone?: string;
}): Promise<{ user?: UserRow; error?: string }> {
  const session = await requireAdminOrTeamMember();
  const callerRole = session?.user?.role;

  if (callerRole === "team_member" && data.role !== "vendor") {
    return { error: "Team members can only create vendor users." };
  }

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "A user with that email already exists." };

  let resolvedVendorId = data.role === "vendor" ? (data.vendorId ?? null) : null;

  if (data.role === "vendor" && data.newVendorName) {
    const vendor = await db.vendor.create({
      data: {
        companyName: data.newVendorName,
        email: data.newVendorEmail || null,
        phone: data.newVendorPhone || null,
      },
    });
    resolvedVendorId = vendor.id;
    revalidatePath("/vendors");

    const actor = await getActor();
    await logActivity({
      actor,
      entityType: "vendor",
      entityId: vendor.id,
      entityLabel: vendor.companyName,
      action: "created",
      description: `Added vendor company "${vendor.companyName}" (inline during user creation)`,
    });
  }

  const hashed = await bcrypt.hash(data.password, 12);
  const user = await db.user.create({
    data: {
      name: data.name || null,
      email: data.email,
      password: hashed,
      role: data.role,
      vendorId: resolvedVendorId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      inspectorId: true,
      vendorId: true,
      vendor: { select: { companyName: true } },
      inspector: { select: { company: true } },
      createdAt: true,
    },
  });

  revalidatePath("/settings/users");

  const actor = await getActor();
  const displayName = data.name || data.email;
  await logActivity({
    actor,
    entityType: "user",
    entityId: user.id,
    entityLabel: displayName,
    action: "created",
    description: `Created ${data.role} account for "${displayName}" (${data.email})`,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      inspectorId: user.inspectorId,
      vendorId: user.vendorId,
      companyName: user.vendor?.companyName ?? user.inspector?.company ?? null,
      createdAt: user.createdAt,
    },
  };
}

export async function updateUserRole(
  userId: string,
  role: string
): Promise<{ error?: string }> {
  const session = await requireAdmin();

  if (session.user.id === userId) {
    return { error: "You cannot change your own role." };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, role: true },
  });

  await db.user.update({
    where: { id: userId },
    data: { role, vendorId: role === "vendor" ? undefined : null },
  });
  revalidatePath("/settings/users");

  const actor = await getActor();
  const label = target?.name ?? target?.email ?? userId;
  await logActivity({
    actor,
    entityType: "user",
    entityId: userId,
    entityLabel: label,
    action: "role_changed",
    field: "role",
    oldValue: target?.role ?? null,
    newValue: role,
    description: `Changed role for "${label}" from ${target?.role ?? "unknown"} to ${role}`,
  });

  return {};
}

export async function linkVendorToUser(
  userId: string,
  vendorId: string | null
): Promise<{ companyName?: string | null; error?: string }> {
  await requireAdminOrTeamMember();

  const [target, vendor] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { name: true, email: true, vendorId: true } }),
    vendorId ? db.vendor.findUnique({ where: { id: vendorId }, select: { companyName: true } }) : Promise.resolve(null),
  ]);

  const updated = await db.user.update({
    where: { id: userId },
    data: { vendorId },
    select: { vendor: { select: { companyName: true } } },
  });

  revalidatePath("/settings/users");

  const actor = await getActor();
  const label = target?.name ?? target?.email ?? userId;
  await logActivity({
    actor,
    entityType: "user",
    entityId: userId,
    entityLabel: label,
    action: "linked",
    field: "vendorId",
    newValue: vendor?.companyName ?? vendorId ?? "none",
    description: `Linked "${label}" to vendor "${vendor?.companyName ?? vendorId ?? "none"}"`,
  });

  return { companyName: updated.vendor?.companyName ?? null };
}

export async function resetUserPassword(
  userId: string,
  newPassword: string
): Promise<{ error?: string }> {
  const session = await requireAdmin();

  if (session.user.id === userId) {
    return { error: "Use the account page to change your own password." };
  }
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const target = await db.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: userId },
    data: { password: hashed, mustChangePassword: true },
  });
  revalidatePath("/settings/users");

  const actor = await getActor();
  const label = target?.name ?? target?.email ?? userId;
  await logActivity({
    actor,
    entityType: "user",
    entityId: userId,
    entityLabel: label,
    action: "password_reset",
    description: `Reset password for "${label}" (temporary — must change on next login)`,
  });

  return {};
}

export async function changeSelfPassword(data: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };
  if (data.newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, name: true, email: true },
  });
  if (!user) return { error: "User not found." };

  const match = await bcrypt.compare(data.currentPassword, user.password);
  if (!match) return { error: "Current password is incorrect." };

  const hashed = await bcrypt.hash(data.newPassword, 12);
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashed, mustChangePassword: false },
  });

  const actor = await getActor();
  await logActivity({
    actor,
    entityType: "user",
    entityId: session.user.id,
    entityLabel: user.name ?? user.email,
    action: "password_reset",
    description: `Changed own password`,
  });

  return {};
}

export async function completePasswordReset(newPassword: string): Promise<{ error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated." };
  if (!session.user.mustChangePassword) return { error: "No password reset required." };
  if (newPassword.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, email: true },
  });

  const hashed = await bcrypt.hash(newPassword, 12);
  await db.user.update({
    where: { id: session.user.id },
    data: { password: hashed, mustChangePassword: false },
  });

  const actor = await getActor();
  await logActivity({
    actor,
    entityType: "user",
    entityId: session.user.id,
    entityLabel: user?.name ?? user?.email ?? session.user.id,
    action: "password_reset",
    description: `Completed forced password reset`,
  });

  return {};
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  const session = await requireAdminOrTeamMember();

  if (session?.user?.id === userId) {
    return { error: "You cannot delete your own account." };
  }

  const callerRole = session?.user?.role;
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true, email: true },
  });

  if (callerRole === "team_member") {
    if (target?.role !== "vendor") {
      return { error: "Team members can only remove vendor users." };
    }
  }

  await db.user.delete({ where: { id: userId } });
  revalidatePath("/settings/users");

  const actor = await getActor();
  const label = target?.name ?? target?.email ?? userId;
  await logActivity({
    actor,
    entityType: "user",
    entityId: userId,
    entityLabel: label,
    action: "deleted",
    description: `Deleted ${target?.role ?? "user"} account for "${label}"`,
  });

  return {};
}
