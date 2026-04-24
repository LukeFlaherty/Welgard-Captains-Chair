"use client";

import { useState } from "react";
import { ClipboardCopy, Check, Link2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function IntakeLinkCard() {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/inspections/intake`
      : "/inspections/intake";

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
          <Link2 className="w-4 h-4 text-muted-foreground" />
          <CardTitle className="text-base">Inspection Intake Form</CardTitle>
        </div>
        <CardDescription>
          Share this link with inspectors so they can submit a new inspection directly.
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
