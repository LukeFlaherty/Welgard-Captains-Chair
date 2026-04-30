"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Sparkles, AlertCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type InitialInsight = {
  text: string;
  generatedBy: string;
  createdAt: Date;
} | null;

// ─── Markdown + link renderer ─────────────────────────────────────────────────

// Parses [[inspection:ID]] and [[ticket:ID]] tags into clickable links,
// and **PRIORITY — title** into styled badges.
function parseInline(text: string): React.ReactNode[] {
  // Split on link tags first, then handle bold
  const linkPattern = /\[\[(inspection|ticket):([^\]]+)\]\]/g;
  const segments: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = linkPattern.exec(text)) !== null) {
    if (match.index > last) {
      segments.push(...parseBold(text.slice(last, match.index), idx));
      idx += 10;
    }
    const [, type, id] = match;
    const href = type === "inspection" ? `/inspections/${id}` : `/service-tickets/${id}`;
    segments.push(
      <Link
        key={`link-${idx++}`}
        href={href}
        className="inline-flex items-center gap-0.5 text-primary underline underline-offset-2 hover:opacity-70 transition-opacity font-medium"
      >
        {type === "inspection" ? "view inspection" : "view ticket"}
      </Link>
    );
    last = match.index + match[0].length;
  }

  if (last < text.length) {
    segments.push(...parseBold(text.slice(last), idx));
  }

  return segments;
}

function parseBold(text: string, startIdx: number): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      const inner = part.slice(2, -2);
      for (const [label, color] of [
        ["HIGH", "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400"],
        ["MEDIUM", "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"],
        ["LOW", "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"],
      ] as const) {
        if (inner.startsWith(label)) {
          const rest = inner.slice(label.length).replace(/^[\s—–-]+/, "");
          return (
            <span key={startIdx + i}>
              <span className={cn("inline-flex items-center px-1.5 py-0 rounded text-[11px] font-bold mr-1.5", color)}>
                {label === "MEDIUM" ? "MED" : label}
              </span>
              {rest && <strong>{rest}</strong>}
            </span>
          );
        }
      }
      return <strong key={startIdx + i}>{inner}</strong>;
    }
    return part || null;
  });
}

function MarkdownOutput({ text }: { text: string }) {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith("## ")) {
      nodes.push(
        <h2 key={key++} className="text-base font-bold mt-6 mb-3 first:mt-0">
          {line.slice(3)}
        </h2>
      );
    } else if (line.trim() === "---") {
      nodes.push(<hr key={key++} className="my-5 border-border" />);
    } else if (line.trim() === "") {
      nodes.push(<div key={key++} className="h-1.5" />);
    } else if (/^\*\*(HIGH|MEDIUM|LOW)/.test(line)) {
      nodes.push(
        <p key={key++} className="text-sm font-medium mt-4 mb-0.5 leading-snug">
          {parseInline(line)}
        </p>
      );
    } else if (line.startsWith("- ")) {
      nodes.push(
        <div key={key++} className="flex gap-2 text-sm text-muted-foreground ml-2">
          <span className="mt-0.5 shrink-0">•</span>
          <span>{parseInline(line.slice(2))}</span>
        </div>
      );
    } else {
      nodes.push(
        <p key={key++} className="text-sm text-muted-foreground leading-relaxed">
          {parseInline(line)}
        </p>
      );
    }
  }

  return <div className="flex flex-col gap-0.5">{nodes}</div>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function InsightsPanel({
  isAdmin,
  initialInsight,
}: {
  isAdmin: boolean;
  initialInsight: InitialInsight;
}) {
  const [text, setText] = useState<string>(initialInsight?.text ?? "");
  const [generatedBy, setGeneratedBy] = useState<string>(initialInsight?.generatedBy ?? "");
  const [generatedAt, setGeneratedAt] = useState<Date | null>(
    initialInsight?.createdAt ?? null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [text, loading]);

  async function generate() {
    setLoading(true);
    setError(null);
    setText("");
    setGeneratedAt(null);

    try {
      const res = await fetch("/api/ai-insights", { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
        setText(fullText);
      }

      setGeneratedAt(new Date());
      // generatedBy comes from the session on the server side; clear the stale label
      setGeneratedBy("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header card */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 border rounded-xl bg-card">
        <div className="flex-1">
          {generatedAt ? (
            <>
              <p className="text-sm font-medium">
                Last generated {generatedAt.toLocaleString()}
                {generatedBy ? ` by ${generatedBy}` : ""}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAdmin ? "Regenerate to pull fresh data." : "Contact an admin to regenerate."}
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium">No insights generated yet.</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAdmin
                  ? "Click to analyze the last 30 days of inspections and service tickets."
                  : "An admin must generate insights first."}
              </p>
            </>
          )}
        </div>
        {isAdmin ? (
          <Button onClick={generate} disabled={loading} className="gap-2 shrink-0">
            <Sparkles className="w-4 h-4" />
            {loading ? "Analyzing…" : generatedAt ? "Regenerate" : "Get Insights"}
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
            <Lock className="w-4 h-4" />
            Admin only
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Output */}
      {text && (
        <div className={cn("border rounded-xl p-6 bg-card", loading && "border-primary/40")}>
          <MarkdownOutput text={text} />
          {loading && (
            <span className="inline-block w-1.5 h-4 ml-0.5 bg-foreground animate-pulse rounded-sm align-middle" />
          )}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
}
