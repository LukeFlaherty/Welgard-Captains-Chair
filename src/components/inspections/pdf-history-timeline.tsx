"use client";

import { useState } from "react";
import { format } from "date-fns";
import { FileText, ExternalLink, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

type PdfEntry = {
  id: string;
  url: string;
  generatedAt: Date | string;
};

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

function PdfEntryRow({
  entry,
  version,
  isLatest,
  reportId,
}: {
  entry: PdfEntry;
  version: number;
  isLatest: boolean;
  reportId?: string | null;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const filename = `${reportId ?? "report"}-v${version}.pdf`;
      await downloadPdf(entry.url, filename);
    } catch {
      toast.error("Download failed.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex items-start gap-3 relative">
      {/* Timeline spine dot */}
      <div className="flex flex-col items-center shrink-0 pt-0.5">
        <div
          className={`w-2.5 h-2.5 rounded-full border-2 mt-0.5 ${
            isLatest
              ? "bg-primary border-primary"
              : "bg-background border-muted-foreground/40"
          }`}
        />
      </div>

      <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 min-w-0 pb-4">
        <span className="text-sm font-medium">v{version}</span>
        {isLatest && (
          <Badge variant="secondary" className="text-xs">
            Latest
          </Badge>
        )}
        <span className="text-xs text-muted-foreground">
          {format(new Date(entry.generatedAt), "MMM d, yyyy 'at' h:mm a")}
        </span>
        <span className="inline-flex items-center gap-3 ml-auto">
          <a
            href={entry.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2"
          >
            <ExternalLink className="w-3 h-3" />
            View
          </a>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline underline-offset-2 disabled:opacity-50"
          >
            {downloading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Download className="w-3 h-3" />
            )}
            {downloading ? "Downloading..." : "Download"}
          </button>
        </span>
      </div>
    </div>
  );
}

export function PdfHistoryTimeline({
  entries,
  reportId,
}: {
  entries: PdfEntry[];
  reportId?: string | null;
}) {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort(
    (a, b) => new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime()
  );

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">PDF Report History</h3>
        <Badge variant="outline" className="text-xs">
          {sorted.length} {sorted.length === 1 ? "version" : "versions"}
        </Badge>
      </div>

      {/* Vertical timeline */}
      <div className="relative pl-1">
        {/* Spine line */}
        {sorted.length > 1 && (
          <div className="absolute left-[4px] top-2 bottom-6 w-px bg-border" />
        )}
        {[...sorted].reverse().map((entry, idx) => {
          const version = sorted.length - idx;
          const isLatest = idx === 0;
          return (
            <PdfEntryRow
              key={entry.id}
              entry={entry}
              version={version}
              isLatest={isLatest}
              reportId={reportId}
            />
          );
        })}
      </div>
    </div>
  );
}
