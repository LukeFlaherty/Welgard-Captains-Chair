"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Search, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type InspectorRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  licenseNumber: string | null;
  licenseStates: string[];
  yearsExperience: number | null;
  status: string;
  _count: { inspections: number };
  inspections: { finalStatus: string; state: string | null }[];
};

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block w-2 h-2 rounded-full",
        status === "active"
          ? "bg-green-500"
          : status === "inactive"
          ? "bg-yellow-400"
          : "bg-red-500"
      )}
    />
  );
}

function statusCounts(inspections: { finalStatus: string }[]) {
  const counts = { green: 0, yellow: 0, red: 0 };
  for (const i of inspections) {
    if (i.finalStatus in counts) counts[i.finalStatus as keyof typeof counts]++;
  }
  return counts;
}

function SearchBar({ value }: { value: string }) {
  const router = useRouter();
  const [q, setQ] = useState(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const push = (val: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (val) {
        params.set("q", val);
      } else {
        params.delete("q");
      }
      params.delete("page");
      router.push(`/inspectors?${params}`);
    }, 300);
  };

  const onChange = (val: string) => {
    setQ(val);
    push(val);
  };

  const clear = () => {
    setQ("");
    push("");
  };

  return (
    <div className="relative max-w-xs w-full">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Search by name, company…"
        value={q}
        onChange={(e) => onChange(e.target.value)}
        className="pl-8 pr-8"
      />
      {q && (
        <button
          onClick={clear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function PaginationRow({
  page,
  total,
  pageSize,
}: {
  page: number;
  total: number;
  pageSize: number;
}) {
  const router = useRouter();
  const totalPages = Math.ceil(total / pageSize);

  const go = (p: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("page", String(p));
    router.push(`/inspectors?${params}`);
  };

  const from = Math.min((page - 1) * pageSize + 1, total);
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
      <span>
        {total === 0
          ? "No results"
          : `Showing ${from}–${to} of ${total}`}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => go(page - 1)}
          >
            Previous
          </Button>
          <span className="px-2 text-xs">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => go(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

type Props = {
  rows: InspectorRow[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
};

export function InspectorTable({ rows, total, page, pageSize, search }: Props) {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3">
      <SearchBar value={search} />

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/30">
          <p className="text-lg font-medium">
            {search ? "No inspectors match your search" : "No inspectors yet"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {search
              ? "Try a different name or company."
              : "Add your first inspector to get started."}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Inspector</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>States</TableHead>
                  <TableHead>Exp.</TableHead>
                  <TableHead>Inspections</TableHead>
                  <TableHead>Results</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Edit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => {
                  const counts = statusCounts(row.inspections);
                  const states = [
                    ...new Set(
                      row.inspections.map((i) => i.state).filter(Boolean)
                    ),
                  ].sort();
                  return (
                    <TableRow
                      key={row.id}
                      className="hover:bg-muted/30 cursor-pointer"
                      onClick={() => router.push(`/inspectors/${row.id}`)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{row.name}</span>
                          {row.email && (
                            <span className="text-xs text-muted-foreground">{row.email}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.company ?? "—"}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {row.licenseNumber ?? "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {row.licenseStates.map((s) => (
                            <Badge
                              key={s}
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 h-4"
                            >
                              {s}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.yearsExperience != null ? `${row.yearsExperience} yrs` : "—"}
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {row._count.inspections}
                        {states.length > 0 && (
                          <span className="text-xs text-muted-foreground ml-1.5">
                            ({states.join(", ")})
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          {counts.green > 0 && (
                            <span className="text-green-600 font-medium">{counts.green}✓</span>
                          )}
                          {counts.yellow > 0 && (
                            <span className="text-yellow-600 font-medium">{counts.yellow}~</span>
                          )}
                          {counts.red > 0 && (
                            <span className="text-red-600 font-medium">{counts.red}✗</span>
                          )}
                          {row._count.inspections === 0 && (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm capitalize">
                          <StatusDot status={row.status} />
                          {row.status}
                        </div>
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/inspectors/${row.id}/edit`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <PaginationRow page={page} total={total} pageSize={pageSize} />
    </div>
  );
}
