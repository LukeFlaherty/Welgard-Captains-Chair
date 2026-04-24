import { db } from "@/lib/db";
import { auth } from "@/auth";
export { FIELD_LABELS, fieldLabel } from "@/lib/activity-labels";

// ─── Actor ────────────────────────────────────────────────────────────────────

export type Actor = {
  actorId?: string;
  actorName: string;
  actorRole?: string;
};

export async function getActor(): Promise<Actor> {
  try {
    const session = await auth();
    if (!session?.user) return { actorName: "System" };
    return {
      actorId: session.user.id || undefined,
      actorName: session.user.companyName ?? session.user.name ?? session.user.email ?? "Unknown",
      actorRole: session.user.role ?? undefined,
    };
  } catch {
    return { actorName: "System" };
  }
}

// ─── Log ──────────────────────────────────────────────────────────────────────

type LogInput = {
  actor: Actor;
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  action: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  description: string;
};

export async function logActivity(input: LogInput): Promise<void> {
  try {
    await db.activityLog.create({
      data: {
        actorId:     input.actor.actorId   ?? null,
        actorName:   input.actor.actorName,
        actorRole:   input.actor.actorRole  ?? null,
        entityType:  input.entityType,
        entityId:    input.entityId         ?? null,
        entityLabel: input.entityLabel      ?? null,
        action:      input.action,
        field:       input.field            ?? null,
        oldValue:    input.oldValue != null  ? String(input.oldValue).substring(0, 500) : null,
        newValue:    input.newValue != null  ? String(input.newValue).substring(0, 500) : null,
        description: input.description,
      },
    });
  } catch (err) {
    console.error("[logActivity] Failed:", err);
  }
}

// ─── Diff ─────────────────────────────────────────────────────────────────────

export function diffObjects(
  oldObj: Record<string, unknown>,
  newObj: Record<string, unknown>,
  skipFields: string[]
): Array<{ field: string; oldValue: string; newValue: string }> {
  const changes: Array<{ field: string; oldValue: string; newValue: string }> = [];
  for (const key of Object.keys(newObj)) {
    if (skipFields.includes(key)) continue;
    const oldVal = stringify(oldObj[key]);
    const newVal = stringify(newObj[key]);
    if (oldVal !== newVal) {
      changes.push({ field: key, oldValue: oldVal, newValue: newVal });
    }
  }
  return changes;
}

function stringify(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (val instanceof Date) return val.toISOString();
  if (Array.isArray(val)) return val.join(", ");
  return String(val);
}

// ─── Skip field lists ─────────────────────────────────────────────────────────

export const INSPECTION_SKIP_FIELDS = [
  "id", "createdAt", "updatedAt",
  "reportId", "generatedPdfUrl", "reportGeneratedAt",
  "lastSyncedAt", "ghlSyncStatus", "ghlContactId", "ghlOpportunityId", "ghlLocationId",
  "memberId", "vendorId", "inspectorId",
  // Auto-computed — derived from inputs, not meaningful to log separately:
  "cycleTime", "wellYieldGpm", "totalGallons", "avgMinutesToReach350", "gallonsPerDay",
  "externalEquipmentStatus", "internalEquipmentStatus", "cycleTimeStatus", "wellYieldStatus",
  "eligibleForSuperior", "membershipTier", "systemStatus", "statusRationale",
];

export const SERVICE_TICKET_SKIP_FIELDS = [
  "id", "createdAt", "updatedAt", "ticketNumber", "ghlContactId", "vendorId",
];

export const VENDOR_SKIP_FIELDS = ["id", "createdAt", "updatedAt"];

export const INSPECTOR_SKIP_FIELDS = ["id", "createdAt", "updatedAt", "vendorId"];

