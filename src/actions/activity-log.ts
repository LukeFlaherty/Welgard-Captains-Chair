"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export type ActivityLogEntry = {
  id: string;
  createdAt: Date;
  actorId: string | null;
  actorName: string;
  actorRole: string | null;
  entityType: string;
  entityId: string | null;
  entityLabel: string | null;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  description: string;
};

export async function listActivityLogs(opts: {
  page?: number;
  pageSize?: number;
  entityType?: string;
} = {}): Promise<{ data: ActivityLogEntry[]; total: number }> {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "team_member") {
    return { data: [], total: 0 };
  }

  const { page = 1, pageSize = 50, entityType } = opts;
  const skip = (page - 1) * pageSize;
  const where = entityType ? { entityType } : {};

  const [data, total] = await Promise.all([
    db.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.activityLog.count({ where }),
  ]);

  return { data, total };
}
