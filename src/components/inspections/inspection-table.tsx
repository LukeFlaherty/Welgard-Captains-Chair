"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./status-badge";
import { Pencil } from "lucide-react";
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

export function InspectionTable({ rows }: { rows: InspectionRow[] }) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/30">
        <p className="text-lg font-medium">No inspections yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first inspection record to get started.
        </p>
      </div>
    );
  }

  return (
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
  );
}
