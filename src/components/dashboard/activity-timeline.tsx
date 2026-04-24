"use client";

import { useState, useTransition } from "react";
import {
  ClipboardCheck, Wrench, Building2, UserCheck, Users, FileText,
  Plus, Pencil, Trash2, RefreshCw, KeyRound, Shield, Link2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { listActivityLogs, type ActivityLogEntry } from "@/actions/activity-log";
import { fieldLabel } from "@/lib/activity-labels";

// ─── Entity / action metadata ─────────────────────────────────────────────────

const ENTITY_META: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  inspection:     { label: "Inspection",     icon: ClipboardCheck, color: "text-blue-600"   },
  service_ticket: { label: "Service Ticket", icon: Wrench,         color: "text-orange-600" },
  vendor:         { label: "Vendor",         icon: Building2,      color: "text-violet-600" },
  inspector:      { label: "Inspector",      icon: UserCheck,      color: "text-teal-600"   },
  user:           { label: "User",           icon: Users,          color: "text-pink-600"   },
  pdf:            { label: "PDF",            icon: FileText,       color: "text-green-600"  },
};

const ACTION_META: Record<string, { icon: React.ElementType; dot: string }> = {
  created:          { icon: Plus,       dot: "bg-green-500"  },
  updated:          { icon: Pencil,     dot: "bg-blue-500"   },
  deleted:          { icon: Trash2,     dot: "bg-red-500"    },
  generated:        { icon: FileText,   dot: "bg-green-500"  },
  status_overridden:{ icon: RefreshCw,  dot: "bg-amber-500"  },
  password_reset:   { icon: KeyRound,   dot: "bg-orange-500" },
  role_changed:     { icon: Shield,     dot: "bg-violet-500" },
  linked:           { icon: Link2,      dot: "bg-teal-500"   },
};

// ─── Date grouping ────────────────────────────────────────────────────────────

function dayKey(date: Date): string {
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function dayLabel(dateStr: string): string {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return dateStr;
}

function relativeTime(date: Date): string {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

const FILTERS = [
  { key: "",               label: "All" },
  { key: "inspection",     label: "Inspections" },
  { key: "service_ticket", label: "Service Tickets" },
  { key: "vendor",         label: "Vendors" },
  { key: "inspector",      label: "Inspectors" },
  { key: "user",           label: "Users" },
  { key: "pdf",            label: "PDFs" },
];

// ─── Single entry ─────────────────────────────────────────────────────────────

function EntryRow({ entry }: { entry: ActivityLogEntry }) {
  const entity = ENTITY_META[entry.entityType] ?? { label: entry.entityType, icon: FileText, color: "text-muted-foreground" };
  const action = ACTION_META[entry.action] ?? { icon: Pencil, dot: "bg-muted-foreground" };
  const EntityIcon = entity.icon;

  return (
    <div className="flex gap-3 py-3">
      {/* Dot + icon */}
      <div className="flex flex-col items-center gap-1 pt-0.5 shrink-0">
        <span className={cn("w-2 h-2 rounded-full shrink-0 mt-1", action.dot)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Entity badge + description */}
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className={cn("flex items-center gap-1 text-[11px] font-medium", entity.color)}>
                <EntityIcon className="w-3 h-3" />
                {entity.label}
              </span>
              {entry.entityLabel && (
                <span className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                  {entry.entityLabel}
                </span>
              )}
            </div>
            <p className="text-sm text-foreground leading-snug">{entry.description}</p>

            {/* Field diff */}
            {entry.field && (entry.oldValue !== null || entry.newValue !== null) && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
                <span className="font-medium text-foreground/70">{fieldLabel(entry.field)}:</span>
                {entry.oldValue ? (
                  <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-mono text-[11px] line-through max-w-[200px] truncate">
                    {entry.oldValue}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50 italic text-[11px]">empty</span>
                )}
                <span>→</span>
                {entry.newValue ? (
                  <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded font-mono text-[11px] max-w-[200px] truncate">
                    {entry.newValue}
                  </span>
                ) : (
                  <span className="text-muted-foreground/50 italic text-[11px]">empty</span>
                )}
              </div>
            )}
          </div>

          {/* Actor + time */}
          <div className="text-right shrink-0 min-w-[90px]">
            <p className="text-[11px] font-medium text-foreground truncate max-w-[120px]">
              {entry.actorName}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {relativeTime(new Date(entry.createdAt))}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  initialData: ActivityLogEntry[];
  initialTotal: number;
  pageSize: number;
}

export function ActivityTimeline({ initialData, initialTotal, pageSize }: Props) {
  const [entries, setEntries]   = useState<ActivityLogEntry[]>(initialData);
  const [total, setTotal]       = useState(initialTotal);
  const [page, setPage]         = useState(1);
  const [filter, setFilter]     = useState("");
  const [isPending, startTransition] = useTransition();

  function applyFilter(newFilter: string) {
    startTransition(async () => {
      const result = await listActivityLogs({ entityType: newFilter || undefined, page: 1, pageSize });
      setEntries(result.data);
      setTotal(result.total);
      setPage(1);
      setFilter(newFilter);
    });
  }

  function loadMore() {
    const nextPage = page + 1;
    startTransition(async () => {
      const result = await listActivityLogs({ entityType: filter || undefined, page: nextPage, pageSize });
      setEntries((prev) => [...prev, ...result.data]);
      setPage(nextPage);
    });
  }

  // Group by day
  const groups: { day: string; items: ActivityLogEntry[] }[] = [];
  for (const entry of entries) {
    const key = dayKey(new Date(entry.createdAt));
    const last = groups[groups.length - 1];
    if (last?.day === key) {
      last.items.push(entry);
    } else {
      groups.push({ day: key, items: [entry] });
    }
  }

  const hasMore = entries.length < total;

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => applyFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
              filter === f.key
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {entries.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          No activity recorded yet. Actions you take in the app will appear here.
        </div>
      ) : (
        <div className="flex flex-col">
          {groups.map((group) => (
            <div key={group.day}>
              {/* Day header */}
              <div className="sticky top-0 z-10 py-1.5 bg-background">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {dayLabel(group.day)}
                </span>
              </div>
              {/* Entries */}
              <div className="divide-y divide-border/50">
                {group.items.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <button
              onClick={loadMore}
              disabled={isPending}
              className="mt-4 w-full py-2.5 text-sm text-muted-foreground hover:text-foreground border rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
            >
              {isPending ? "Loading…" : `Load more (${total - entries.length} remaining)`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
