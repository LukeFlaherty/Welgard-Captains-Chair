"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt: Date;
};

async function requireAdmin() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    throw new Error("Unauthorized: admin access required.");
  }
  return session;
}

export async function listUsers(): Promise<UserRow[]> {
  await requireAdmin();
  return db.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
}): Promise<{ user?: UserRow; error?: string }> {
  await requireAdmin();

  const existing = await db.user.findUnique({ where: { email: data.email } });
  if (existing) return { error: "A user with that email already exists." };

  const hashed = await bcrypt.hash(data.password, 12);
  const user = await db.user.create({
    data: { name: data.name || null, email: data.email, password: hashed, role: data.role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  revalidatePath("/settings/users");
  return { user };
}

export async function updateUserRole(
  userId: string,
  role: string
): Promise<{ error?: string }> {
  const session = await requireAdmin();

  if (session.user.id === userId) {
    return { error: "You cannot change your own role." };
  }

  await db.user.update({ where: { id: userId }, data: { role } });
  revalidatePath("/settings/users");
  return {};
}

export async function deleteUser(userId: string): Promise<{ error?: string }> {
  const session = await requireAdmin();

  if (session.user.id === userId) {
    return { error: "You cannot delete your own account." };
  }

  await db.user.delete({ where: { id: userId } });
  revalidatePath("/settings/users");
  return {};
}
