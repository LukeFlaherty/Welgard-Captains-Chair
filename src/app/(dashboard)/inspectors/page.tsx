import type { Metadata } from "next";
import Link from "next/link";
import { Plus, UserCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { InspectorTable } from "@/components/inspectors/inspector-table";
import { listInspectors } from "@/actions/inspectors";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inspectors" };
export const dynamic = "force-dynamic";

export default async function InspectorsPage() {
  const session = await auth();
  const role = session?.user?.role ?? "vendor";
  const vendorId = role === "vendor" ? (session?.user?.vendorId ?? null) : null;

  const inspectors = await listInspectors(vendorId);

  const totals = inspectors.reduce(
    (acc, i) => {
      acc.inspections += i._count.inspections;
      for (const insp of i.inspections) {
        if (insp.finalStatus in acc) acc[insp.finalStatus as keyof typeof acc]++;
      }
      return acc;
    },
    { inspections: 0, green: 0, yellow: 0, red: 0 }
  );

  const activeCount = inspectors.filter((i) => i.status === "active").length;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UserCheck className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Inspectors</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {role === "vendor"
              ? "Inspectors registered under your company."
              : "Manage inspectors, track performance, and review submission history."}
          </p>
        </div>
        {role !== "vendor" && (
          <Link
            href="/inspectors/new"
            className={cn(buttonVariants(), "gap-2 shrink-0")}
          >
            <Plus className="w-4 h-4" />
            New Inspector
          </Link>
        )}
      </div>

      {/* Stats */}
      {inspectors.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Inspectors", value: inspectors.length, sub: `${activeCount} active`, color: "text-foreground" },
            { label: "Total Inspections", value: totals.inspections, color: "text-foreground" },
            { label: "Approved", value: totals.green, color: "text-green-600" },
            { label: "Not Approved", value: totals.red, color: "text-red-600" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className={cn("text-2xl font-bold", stat.color)}>{stat.value}</span>
              {stat.sub && (
                <span className="text-xs text-muted-foreground">{stat.sub}</span>
              )}
            </div>
          ))}
        </div>
      )}

      {inspectors.length === 0 && role === "vendor" && !vendorId && (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/30">
          <p className="text-lg font-medium">No company linked</p>
          <p className="text-sm text-muted-foreground mt-1">
            Contact Welgard to have your account linked to your inspection company.
          </p>
        </div>
      )}

      <InspectorTable rows={inspectors} />
    </div>
  );
}
