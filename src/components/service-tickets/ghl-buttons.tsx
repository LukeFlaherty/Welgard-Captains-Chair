"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Send, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerGhlWebhook } from "@/actions/service-tickets";

export function GhlButtons({ ticketId }: { ticketId: string }) {
  const [loadingMember,  setLoadingMember]  = useState(false);
  const [loadingPartner, setLoadingPartner] = useState(false);

  const trigger = async (
    type: "notify_member" | "notify_partner",
    setLoading: (v: boolean) => void
  ) => {
    setLoading(true);
    const result = await triggerGhlWebhook(ticketId, type);
    setLoading(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        type === "notify_member"
          ? "Member notification sent via GHL"
          : "Service partner notification sent via GHL"
      );
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap p-4 rounded-xl border bg-muted/30">
      <span className="text-xs text-muted-foreground font-medium mr-1">GHL Notifications:</span>
      <Button
        variant="outline"
        size="sm"
        disabled={loadingMember}
        onClick={() => trigger("notify_member", setLoadingMember)}
        className="gap-1.5"
      >
        {loadingMember ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
        Notify Member
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={loadingPartner}
        onClick={() => trigger("notify_partner", setLoadingPartner)}
        className="gap-1.5"
      >
        {loadingPartner ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
        Notify Service Partner
      </Button>
    </div>
  );
}
