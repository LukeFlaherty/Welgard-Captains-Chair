"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X, Plus, AlertTriangle, Wrench } from "lucide-react";
import { format } from "date-fns";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type TicketRow = {
  id: string;
  ticketNumber: number;
  memberFirstName: string;
  memberLastName: string;
  memberEmail: string | null;
  streetAddress: string;
  city: string | null;
  state: string | null;
  serviceType: string;
  status: string;
  callReceivedAt: Date;
  scheduledFor: Date | null;
  isComplete: boolean;
  vendor: { id: string; companyName: string } | null;
  serviceCompletedBy: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-blue-50 text-blue-700 border-blue-200",
  scheduled:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  in_progress: "bg-orange-50 text-orange-700 border-orange-200",
  completed:   "bg-green-50 text-green-700 border-green-200",
};
const STATUS_LABELS: Record<string, string> = {
  open:        "Open",
  scheduled:   "Scheduled",
  in_progress: "In Progress",
  completed:   "Completed",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", STATUS_STYLES[status] ?? "bg-muted text-muted-foreground")}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

function SearchBar({ value }: { value: string }) {
  const router = useRouter();
  const [q, setQ] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const push = (val: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (val) params.set("q", val); else params.delete("q");
      params.delete("page");
      router.push(`/service-tickets?${params}`);
    }, 300);
  };

  return (
    <div className="relative max-w-xs w-full">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Search name, address, partner…"
        value={q}
        onChange={(e) => { setQ(e.target.value); push(e.target.value); }}
        className="pl-8 pr-8"
      />
      {q && (
        <button onClick={() => { setQ(""); push(""); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function StatusFilter({ value }: { value: string }) {
  const router = useRouter();
  const statuses = ["", "open", "scheduled", "in_progress", "completed"];

  const set = (s: string) => {
    const params = new URLSearchParams(window.location.search);
    if (s) params.set("status", s); else params.delete("status");
    params.delete("page");
    router.push(`/service-tickets?${params}`);
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {statuses.map((s) => (
        <button
          key={s || "all"}
          onClick={() => set(s)}
          className={cn(
            "text-xs px-2.5 py-1 rounded-full border transition-colors",
            value === s
              ? "bg-primary text-primary-foreground border-primary"
              : "text-muted-foreground hover:text-foreground hover:border-foreground/30"
          )}
        >
          {s ? STATUS_LABELS[s] : "All"}
        </button>
      ))}
    </div>
  );
}

function PaginationRow({ page, total, pageSize }: { page: number; total: number; pageSize: number }) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);
  const go = (p: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(p));
    router.push(`/service-tickets?${params}`);
  };
  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
      <span>{total === 0 ? "No results" : `Showing ${Math.min((page - 1) * pageSize + 1, total)}–${Math.min(page * pageSize, total)} of ${total}`}</span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" disabled={page <= 1} onClick={() => go(page - 1)}>Previous</Button>
          <span className="px-2 text-xs">{page} / {totalPages}</span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages} onClick={() => go(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

type Props = {
  rows: TicketRow[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
  statusFilter: string;
  canCreate: boolean;
};

export function ServiceTicketTable({ rows, total, page, pageSize, search, statusFilter, canCreate }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <SearchBar value={search} />
          <StatusFilter value={statusFilter} />
        </div>
        {canCreate && (
          <Link href="/service-tickets/new" className={cn(buttonVariants(), "gap-2 shrink-0")}>
            <Plus className="w-4 h-4" />
            New Ticket
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/30">
          <Wrench className="w-8 h-8 text-muted-foreground mb-3" />
          <p className="text-lg font-medium">
            {search || statusFilter ? "No tickets match your filters" : "No service tickets yet"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search || statusFilter ? "Try adjusting your search or filter." : "Create a ticket when a service call comes in."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-20">#</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Partner</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => router.push(`/service-tickets/${row.id}`)}
                  >
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{row.ticketNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{row.memberFirstName} {row.memberLastName}</span>
                        {row.memberEmail && (
                          <span className="text-xs text-muted-foreground">{row.memberEmail}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <div className="flex flex-col">
                        <span>{row.streetAddress}</span>
                        {(row.city || row.state) && (
                          <span className="text-xs text-muted-foreground">
                            {[row.city, row.state].filter(Boolean).join(", ")}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {row.serviceType === "emergency" ? (
                        <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                          <AlertTriangle className="w-3 h-3" />
                          Emergency
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Maintenance</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {row.vendor?.companyName ?? row.serviceCompletedBy ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(row.callReceivedAt), "MM/dd/yy")}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {row.scheduledFor ? format(new Date(row.scheduledFor), "MM/dd/yy") : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={row.status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <PaginationRow page={page} total={total} pageSize={pageSize} />
    </div>
  );
}
