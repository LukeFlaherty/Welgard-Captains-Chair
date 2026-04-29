import type { Metadata } from "next";
import Link from "next/link";
import { Plus, ClipboardCheck, Printer, Pencil, AlertTriangle, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { InspectionTable } from "@/components/inspections/inspection-table";
import { listInspections, listFlaggedInspections } from "@/actions/inspections";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inspections" };

export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

type Props = {
  searchParams: Promise<{ q?: string; page?: string; tab?: string }>;
};

export default async function InspectionsPage({ searchParams }: Props) {
  const session = await auth();
  const role = session?.user?.role ?? "vendor";
  const vendorId = role === "vendor" ? (session?.user?.vendorId ?? null) : null;
  const isAdmin = role === "admin" || role === "team_member";

  const { q, page: pageParam, tab } = await searchParams;
  const activeTab = isAdmin && tab === "issues" ? "issues" : "all";
  const search = q?.trim() || "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [{ data: inspections, total, statusCounts }, flagged] = await Promise.all([
    activeTab === "all"
      ? listInspections({ vendorId, search: search || undefined, page, pageSize: PAGE_SIZE })
      : Promise.resolve({ data: [], total: 0, statusCounts: {} as Record<string, number> }),
    isAdmin ? listFlaggedInspections(vendorId) : Promise.resolve([]),
  ]);

  const canCreate = role !== "vendor" || !!vendorId;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ClipboardCheck className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Inspections</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {role === "vendor"
              ? "Inspections submitted by your company."
              : "Review well inspection records and generate member reports."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/inspections/form-pdf"
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: "outline" }), "gap-2 shrink-0")}
          >
            <Printer className="w-4 h-4" />
            Print Form
          </a>
          {canCreate && (
            <Link
              href="/inspections/new"
              className={cn(buttonVariants(), "gap-2 shrink-0")}
            >
              <Plus className="w-4 h-4" />
              New Inspection
            </Link>
          )}
        </div>
      </div>

      {/* Vendor with no company linked */}
      {role === "vendor" && !vendorId && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-5 text-sm text-amber-800 dark:text-amber-300">
          <strong>Your account isn&apos;t linked to a company yet.</strong> Contact Welgard to have your account connected to your inspection company before you can view or submit inspections.
        </div>
      )}

      {/* Summary stats — only on main tab */}
      {activeTab === "all" && total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Total",      value: total,                        color: "text-foreground" },
            { label: "Premium",    value: statusCounts.green     ?? 0,  color: "text-green-600" },
            { label: "Superior",   value: statusCounts.yellow    ?? 0,  color: "text-yellow-600" },
            { label: "Standard",   value: statusCounts.red       ?? 0,  color: "text-blue-600" },
            { label: "Ineligible", value: statusCounts.ineligible ?? 0, color: "text-red-600" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className={cn("text-2xl font-bold", stat.color)}>{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab row — admin only */}
      {isAdmin && (
        <div className="flex items-center gap-1 border-b">
          <Link
            href="/inspections"
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "all"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            All Inspections
          </Link>
          <Link
            href="/inspections?tab=issues"
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
              activeTab === "issues"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            Missing Data
            {flagged.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {flagged.length}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* Main tab */}
      {activeTab === "all" && (
        <InspectionTable
          rows={inspections}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          search={search}
        />
      )}

      {/* Issues tab */}
      {activeTab === "issues" && (
        <section className="flex flex-col gap-3">
          {flagged.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/30 gap-3">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
              <p className="text-lg font-medium">No data issues found</p>
              <p className="text-sm text-muted-foreground">All inspections have the required fields filled in.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                {flagged.length} inspection{flagged.length !== 1 ? "s" : ""} with missing data requiring manual entry.
              </p>
              <div className="border rounded-xl divide-y overflow-hidden">
                {flagged.map((row) => (
                  <div key={row.id} className="flex items-center justify-between p-3 gap-3">
                    <div className="flex flex-col gap-1">
                      <Link
                        href={`/inspections/${row.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {row.homeownerName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {row.propertyAddress}{row.city ? `, ${row.city}` : ""}{row.state ? ` ${row.state}` : ""}
                      </span>
                      {row.inspectionCompany && (
                        <span className="text-xs text-muted-foreground">{row.inspectionCompany}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {row.issues.map((issue) => (
                        <span
                          key={issue}
                          className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-300"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {issue}
                        </span>
                      ))}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(row.inspectionDate), "MMM d, yyyy")}
                      </span>
                      {row.isDraft && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">Draft</Badge>
                      )}
                      <Link
                        href={`/inspections/${row.id}/edit`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
                      >
                        <Pencil className="w-3 h-3" />
                        Fix
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
