"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";
import {
  Cloud, CloudAlert, CloudCheck, Loader2, RefreshCw, Send, UserCheck, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { syncMemberToGhl, triggerGhlWebhook } from "@/actions/service-tickets";
import { syncVendorToGhl } from "@/actions/vendors";

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  ticketId: string;
  isComplete: boolean;

  // Member / homeowner
  memberEmail: string | null;
  memberGhlContactId: string | null;
  memberGhlSyncStatus: string;           // pending | synced | error
  memberGhlLastSyncedAt: Date | null;
  memberNotifiedAt: Date | null;
  memberNotifyStatus: string | null;     // success | error | null

  // Service partner / vendor
  vendorId: string | null;
  vendorName: string | null;
  vendorEmail: string | null;
  vendorGhlContactId: string | null;
  vendorGhlSyncStatus: string;           // pending | synced | error
  vendorGhlLastSyncedAt: Date | null;
  partnerNotifiedAt: Date | null;
  partnerNotifyStatus: string | null;    // success | error | null

  // GHL location for deep-link (passed from server so we don't expose the env var)
  ghlLocationId: string | null;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ghlContactUrl(locationId: string | null, contactId: string | null) {
  if (!locationId || !contactId) return null;
  return `https://app.gohighlevel.com/v2/location/${locationId}/contacts/detail/${contactId}`;
}

function SyncStatus({
  syncStatus,
  lastSyncedAt,
  contactId,
  locationId,
}: {
  syncStatus: string;
  lastSyncedAt: Date | null;
  contactId: string | null;
  locationId: string | null;
}) {
  const url = ghlContactUrl(locationId, contactId);

  if (syncStatus === "synced" && lastSyncedAt) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground flex-wrap">
        <CloudCheck className="w-3.5 h-3.5 text-green-500 shrink-0" />
        <span>Synced {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}</span>
        {contactId && (
          <span className="font-mono opacity-60">· {contactId.slice(0, 8)}…</span>
        )}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-primary hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            View in GHL
          </a>
        )}
      </div>
    );
  }

  if (syncStatus === "error") {
    return (
      <div className="flex items-center gap-1 text-[11px] text-destructive">
        <CloudAlert className="w-3.5 h-3.5 shrink-0" />
        Last sync failed — check email and retry
      </div>
    );
  }

  return null;
}

function NotifyStatus({
  notifiedAt,
  notifyStatus,
}: {
  notifiedAt: Date | null;
  notifyStatus: string | null;
}) {
  if (!notifiedAt) return null;

  const ts = format(new Date(notifiedAt), "MMM d, yyyy 'at' h:mm a");

  if (notifyStatus === "success") {
    return (
      <span className="text-[11px] text-green-600 flex items-center gap-1">
        <CloudCheck className="w-3 h-3 shrink-0" />
        Notified {ts}
      </span>
    );
  }

  if (notifyStatus === "error") {
    return (
      <span className="text-[11px] text-destructive flex items-center gap-1">
        <CloudAlert className="w-3 h-3 shrink-0" />
        Notification failed {ts} — retry below
      </span>
    );
  }

  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * GHL integration panel for service tickets.
 *
 * Two independent sections — member and service partner — each with:
 *   1. Sync button: looks up the contact in GHL by email, stores the contact ID.
 *   2. Notify button: fires the GHL_SERVICE_WEBHOOK_URL webhook to trigger a GHL
 *      automation. Only enabled once the contact is synced AND the ticket is complete.
 *
 * Sync state is stored on the ServiceTicket (member) and Vendor (partner) records.
 * Notification state is stored on ServiceTicket as memberNotifiedAt / partnerNotifiedAt.
 * All sync and notification events appear in the dashboard activity feed.
 *
 * To add a new notification type, add a new event type to triggerGhlWebhook in
 * src/actions/service-tickets.ts and add a corresponding section here.
 */
export function GhlButtons(props: Props) {
  const {
    ticketId, isComplete,
    memberEmail, memberGhlContactId, memberGhlSyncStatus, memberGhlLastSyncedAt,
    memberNotifiedAt, memberNotifyStatus,
    vendorId, vendorName, vendorEmail, vendorGhlContactId, vendorGhlSyncStatus,
    vendorGhlLastSyncedAt, partnerNotifiedAt, partnerNotifyStatus,
    ghlLocationId,
  } = props;

  const router = useRouter();
  const [syncingMember,  setSyncingMember]  = useState(false);
  const [syncingPartner, setSyncingPartner] = useState(false);
  const [notifyingMember,  setNotifyingMember]  = useState(false);
  const [notifyingPartner, setNotifyingPartner] = useState(false);

  const memberSynced  = memberGhlSyncStatus === "synced" && !!memberGhlContactId;
  const partnerSynced = vendorGhlSyncStatus === "synced" && !!vendorGhlContactId;

  async function handleSyncMember() {
    setSyncingMember(true);
    const result = await syncMemberToGhl(ticketId);
    setSyncingMember(false);
    if (result.error) {
      toast.error(result.error, { duration: 6000 });
    } else {
      toast.success("Member synced to GHL.");
      router.refresh();
    }
  }

  async function handleSyncPartner() {
    if (!vendorId) return;
    setSyncingPartner(true);
    const result = await syncVendorToGhl(vendorId);
    setSyncingPartner(false);
    if (result.error) {
      toast.error(result.error, { duration: 6000 });
    } else {
      toast.success(`${vendorName ?? "Vendor"} synced to GHL.`);
      router.refresh();
    }
  }

  async function handleNotify(type: "notify_member" | "notify_partner") {
    const setLoading = type === "notify_member" ? setNotifyingMember : setNotifyingPartner;
    setLoading(true);
    const result = await triggerGhlWebhook(ticketId, type);
    setLoading(false);
    if (result.error) {
      toast.error(result.error, { duration: 6000 });
    } else {
      toast.success(
        type === "notify_member"
          ? "Member notification sent via GHL."
          : "Service partner notification sent via GHL."
      );
      router.refresh();
    }
  }

  return (
    <div className="rounded-xl border bg-muted/20 divide-y">
      <div className="px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          GHL Integration
        </span>
      </div>

      {/* ── Member / Homeowner ──────────────────────────────────────────────── */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Homeowner / Member</span>
            {memberEmail ? (
              <span className="text-xs text-muted-foreground">{memberEmail}</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">No email — sync unavailable</span>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={syncingMember || !memberEmail}
            onClick={handleSyncMember}
            className="gap-1.5 shrink-0"
            title={!memberEmail ? "Add a member email to enable GHL sync" : undefined}
          >
            {syncingMember ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : memberGhlSyncStatus === "error" ? (
              <CloudAlert className="w-3.5 h-3.5 text-destructive" />
            ) : memberSynced ? (
              <RefreshCw className="w-3.5 h-3.5" />
            ) : (
              <Cloud className="w-3.5 h-3.5" />
            )}
            {syncingMember ? "Syncing…" : memberSynced ? "Re-sync" : memberGhlSyncStatus === "error" ? "Retry Sync" : "Sync to GHL"}
          </Button>
        </div>

        <SyncStatus
          syncStatus={memberGhlSyncStatus}
          lastSyncedAt={memberGhlLastSyncedAt}
          contactId={memberGhlContactId}
          locationId={ghlLocationId}
        />

        {memberSynced && (
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant={isComplete ? "default" : "outline"}
              size="sm"
              disabled={notifyingMember || !isComplete}
              onClick={() => handleNotify("notify_member")}
              className="gap-1.5"
              title={!isComplete ? "Ticket must be completed before sending notifications" : undefined}
            >
              {notifyingMember ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              {notifyingMember ? "Sending…" : "Notify Homeowner"}
            </Button>
            <NotifyStatus notifiedAt={memberNotifiedAt} notifyStatus={memberNotifyStatus} />
          </div>
        )}

        {!isComplete && memberSynced && (
          <p className="text-[11px] text-muted-foreground">
            Complete the ticket to enable notifications.
          </p>
        )}
      </div>

      {/* ── Service Partner / Vendor ────────────────────────────────────────── */}
      <div className="p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">
              Service Partner{vendorName ? ` — ${vendorName}` : ""}
            </span>
            {!vendorId ? (
              <span className="text-xs text-muted-foreground italic">
                No vendor linked to this ticket
              </span>
            ) : vendorEmail ? (
              <span className="text-xs text-muted-foreground">{vendorEmail}</span>
            ) : (
              <span className="text-xs text-muted-foreground italic">
                No email on vendor record — sync unavailable
              </span>
            )}
          </div>

          {vendorId && (
            <Button
              variant="outline"
              size="sm"
              disabled={syncingPartner || !vendorEmail}
              onClick={handleSyncPartner}
              className="gap-1.5 shrink-0"
              title={!vendorEmail ? "Add an email to the vendor record to enable GHL sync" : undefined}
            >
              {syncingPartner ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : vendorGhlSyncStatus === "error" ? (
                <CloudAlert className="w-3.5 h-3.5 text-destructive" />
              ) : partnerSynced ? (
                <RefreshCw className="w-3.5 h-3.5" />
              ) : (
                <Cloud className="w-3.5 h-3.5" />
              )}
              {syncingPartner ? "Syncing…" : partnerSynced ? "Re-sync" : vendorGhlSyncStatus === "error" ? "Retry Sync" : "Sync to GHL"}
            </Button>
          )}
        </div>

        {vendorId && (
          <SyncStatus
            syncStatus={vendorGhlSyncStatus}
            lastSyncedAt={vendorGhlLastSyncedAt}
            contactId={vendorGhlContactId}
            locationId={ghlLocationId}
          />
        )}

        {partnerSynced && (
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant={isComplete ? "default" : "outline"}
              size="sm"
              disabled={notifyingPartner || !isComplete}
              onClick={() => handleNotify("notify_partner")}
              className="gap-1.5"
              title={!isComplete ? "Ticket must be completed before sending notifications" : undefined}
            >
              {notifyingPartner ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <UserCheck className="w-3.5 h-3.5" />
              )}
              {notifyingPartner ? "Sending…" : "Notify Service Partner"}
            </Button>
            <NotifyStatus notifiedAt={partnerNotifiedAt} notifyStatus={partnerNotifyStatus} />
          </div>
        )}

        {!isComplete && partnerSynced && (
          <p className="text-[11px] text-muted-foreground">
            Complete the ticket to enable notifications.
          </p>
        )}
      </div>
    </div>
  );
}
