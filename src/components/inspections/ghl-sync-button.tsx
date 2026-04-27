"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Cloud, CloudAlert, CloudCheck, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { syncInspectionToGhl } from "@/actions/inspections";

export function GhlSyncButton({
  inspectionId,
  ghlSyncStatus,
  lastSyncedAt,
  ghlContactId,
  hasEmail,
}: {
  inspectionId: string;
  ghlSyncStatus: string;
  lastSyncedAt: Date | null;
  ghlContactId: string | null;
  hasEmail: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isSynced = ghlSyncStatus === "synced";
  const isError  = ghlSyncStatus === "error";

  async function handleSync() {
    setLoading(true);
    const result = await syncInspectionToGhl(inspectionId);
    setLoading(false);

    if (result.error) {
      toast.error(result.error, { duration: 6000 });
    } else {
      toast.success(`Synced ${result.fieldsUpdated} fields to GHL contact.`);
      router.refresh();
    }
  }

  const disabled = loading || !hasEmail;

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={handleSync}
        className="gap-1.5"
        title={!hasEmail ? "Add a homeowner email to enable GHL sync" : undefined}
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : isError ? (
          <CloudAlert className="w-3.5 h-3.5 text-destructive" />
        ) : isSynced ? (
          <RefreshCw className="w-3.5 h-3.5" />
        ) : (
          <Cloud className="w-3.5 h-3.5" />
        )}
        {loading
          ? "Syncing…"
          : isSynced
          ? "Re-sync GHL"
          : isError
          ? "Retry GHL Sync"
          : "Sync to GHL"}
      </Button>

      {isSynced && lastSyncedAt && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <CloudCheck className="w-3 h-3 text-green-500 shrink-0" />
          Synced {formatDistanceToNow(new Date(lastSyncedAt), { addSuffix: true })}
          {ghlContactId && (
            <span className="font-mono opacity-60 ml-0.5">· {ghlContactId.slice(0, 8)}…</span>
          )}
        </span>
      )}

      {isError && (
        <span className="text-[10px] text-destructive flex items-center gap-1">
          <CloudAlert className="w-3 h-3 shrink-0" />
          Last sync failed
        </span>
      )}

      {!hasEmail && (
        <span className="text-[10px] text-muted-foreground">
          No email — sync unavailable
        </span>
      )}
    </div>
  );
}
