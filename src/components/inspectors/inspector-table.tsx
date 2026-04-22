"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
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

export function InspectorTable({ rows }: { rows: InspectorRow[] }) {
  const router = useRouter();

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/30">
        <p className="text-lg font-medium">No inspectors yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first inspector to get started.
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
  );
}
