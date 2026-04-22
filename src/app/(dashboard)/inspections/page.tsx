import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ClipboardCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { InspectionTable } from "@/components/inspections/inspection-table";
import { listInspections } from "@/actions/inspections";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inspections" };

export const dynamic = "force-dynamic";

export default async function InspectionsPage() {
  const inspections = await listInspections();

  const counts = inspections.reduce(
    (acc: Record<string, number>, i: { finalStatus: string }) => {
      acc[i.finalStatus] = (acc[i.finalStatus] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="flex flex-col gap-6 p-8 max-w-7xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Inspections</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Review well inspection records and generate member reports.
          </p>
        </div>
        <Link
          href="/inspections/new"
          className={cn(buttonVariants(), "gap-2")}
        >
          <Plus className="w-4 h-4" />
          New Inspection
        </Link>
      </div>

      {/* Summary stats */}
      {inspections.length > 0 && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Total", value: inspections.length, color: "text-foreground" },
            { label: "Approved", value: counts.green ?? 0, color: "text-green-600" },
            { label: "Conditional", value: counts.yellow ?? 0, color: "text-yellow-600" },
            { label: "Not Approved", value: counts.red ?? 0, color: "text-red-600" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col gap-1 p-4 border rounded-xl bg-card"
            >
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className={cn("text-2xl font-bold", stat.color)}>
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <InspectionTable rows={inspections} />
    </div>
  );
}
