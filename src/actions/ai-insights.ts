"use server";

import { db } from "@/lib/db";

export async function getLatestInsight() {
  return db.aiInsight.findFirst({ orderBy: { createdAt: "desc" } });
}
