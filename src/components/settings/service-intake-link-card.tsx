"use client";

import { useState } from "react";
import { ClipboardCopy, Check, PhoneCall } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ServiceIntakeLinkCard() {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/service-tickets/intake`
      : "/service-tickets/intake";

  function copyToClipboard() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <Card className="hover:border-primary/40 transition-colors">
      <CardHeader>
        <div className="flex items-center gap-2">
          <PhoneCall className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base">Service Ticket Intake Form</CardTitle>
        </div>
        <CardDescription>
          Use this link to quickly log a new service call from a member.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={url}
            className="text-xs text-muted-foreground bg-muted/50 cursor-default"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyToClipboard}
            className="shrink-0 gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Copied
              </>
            ) : (
              <>
                <ClipboardCopy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
