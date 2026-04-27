"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FileDown, Loader2, ExternalLink, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

async function downloadPdf(url: string, filename: string) {
  const res = await fetch(url);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

export function GeneratePdfButton({
  inspectionId,
  existingPdfUrl,
  reportId,
}: {
  inspectionId: string;
  existingPdfUrl?: string | null;
  reportId?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
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
          <button
            onClick={async () => {
              setDownloading(true);
              try {
                const filename = `${reportId ?? inspectionId}.pdf`;
                await downloadPdf(existingPdfUrl, filename);
              } catch {
                toast.error("Download failed.");
              } finally {
                setDownloading(false);
              }
            }}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline underline-offset-2 disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            {downloading ? "Downloading..." : "Download"}
          </button>
        </>
      )}
    </div>
  );
}
