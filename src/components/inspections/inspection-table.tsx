"use client";

import { useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import { ClipboardCheck, Pencil, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Inspection } from "@/generated/prisma";

type InspectionRow = Pick<
  Inspection,
  | "id"
  | "homeownerName"
  | "propertyAddress"
  | "city"
  | "state"
  | "inspectionDate"
  | "inspectorName"
  | "finalStatus"
  | "isDraft"
  | "generatedPdfUrl"
  | "createdAt"
  | "activity"
>;

function SearchBar({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = (q: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (q) { sp.set("q", q); } else { sp.delete("q"); }
      sp.delete("page");
      router.push(`${pathname}?${sp.toString()}`);
    }, 300);
  };

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        defaultValue={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search inspections…"
        className="pl-8 w-64"
      />
    </div>
  );
}

function PaginationRow({
  page,
  pageSize,
  total,
}: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const navigate = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(p));
    router.push(`${pathname}?${sp.toString()}`);
  };

  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-2">
      <span className="text-xs text-muted-foreground">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => navigate(page - 1)}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => navigate(page + 1)}
          className="gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

type Props = {
  rows: InspectionRow[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
};

export function InspectionTable({ rows, total, page, pageSize, search }: Props) {
  const router = useRouter();
  const empty = total === 0 && !search;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SearchBar value={search} />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/30">
          <ClipboardCheck className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-lg font-medium">
            {empty ? "No inspections yet" : "No results"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {empty
              ? "Create your first inspection record to get started."
              : "Try a different search term."}
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Member / Owner</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Inspection Date</TableHead>
                    <TableHead>Inspector</TableHead>
                    <TableHead>Activity</TableHead>
                    <TableHead>Approval</TableHead>
                    <TableHead>Report</TableHead>
                    <TableHead className="text-right">Edit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      className="group hover:bg-muted/30 cursor-pointer"
                      onClick={() => router.push(`/inspections/${row.id}`)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {row.homeownerName}
                          {row.isDraft && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                              Draft
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {row.propertyAddress}
                        {row.city && `, ${row.city}`}
                        {row.state && `, ${row.state}`}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(row.inspectionDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.inspectorName ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.activity ?? "—"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={row.finalStatus} size="sm" />
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {row.generatedPdfUrl ? (
                          <a
                            href={row.generatedPdfUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-primary underline-offset-2 hover:underline"
                          >
                            View PDF
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">Not generated</span>
                        )}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          href={`/inspections/${row.id}/edit`}
                          className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {total > pageSize && (
            <PaginationRow page={page} pageSize={pageSize} total={total} />
          )}
        </>
      )}
    </div>
  );
}
