"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { savePdfUrl } from "@/actions/inspections";
import { useRouter } from "next/navigation";

export function GeneratePdfButton({
  inspectionId,
  existingPdfUrl,
}: {
  inspectionId: string;
  existingPdfUrl?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/inspections/${inspectionId}/pdf`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error ?? "PDF generation failed.");
      }
      await savePdfUrl(inspectionId, json.url);
      toast.success("PDF report generated successfully.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "PDF generation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleGenerate}
        disabled={loading}
        className="gap-2"
        size="sm"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        {loading ? "Generating..." : existingPdfUrl ? "Regenerate PDF" : "Generate PDF"}
      </Button>
      {existingPdfUrl && (
        <>
          <a
            href={existingPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            View
          </a>
          <a
            href={existingPdfUrl}
            download
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        </>
      )}
    </div>
  );
}
