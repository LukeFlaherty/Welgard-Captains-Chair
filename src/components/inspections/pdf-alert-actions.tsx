"use client";

import { useState } from "react";
import { Loader2, ExternalLink, Download } from "lucide-react";
import { toast } from "sonner";

export function PdfAlertActions({
  url,
  reportId,
}: {
  url: string;
  reportId?: string | null;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${reportId ?? "report"}.pdf`;
      a.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      toast.error("Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-3">
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        View report
      </a>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline disabled:opacity-50"
      >
        {downloading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        {downloading ? "Downloading..." : "Download report"}
      </button>
    </span>
  );
}
