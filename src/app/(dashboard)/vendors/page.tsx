import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { VendorTable } from "@/components/vendors/vendor-table";
import { listVendors, getVendorStats } from "@/actions/vendors";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Vendors" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 100;

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

export default async function VendorsPage({ searchParams }: Props) {
  const { q, page: pageParam } = await searchParams;
  const search = q?.trim() || "";
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [{ data: vendors, total }, stats] = await Promise.all([
    listVendors({ search: search || undefined, page, pageSize: PAGE_SIZE }),
    getVendorStats(),
  ]);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Vendors</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Manage inspection company records and their linked inspectors.
          </p>
        </div>
        <Link href="/vendors/new" className={cn(buttonVariants(), "gap-2 shrink-0")}>
          <Plus className="w-4 h-4" />
          New Vendor
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Companies", value: stats.total },
          { label: "Total Inspectors", value: stats.totalInspectors },
          { label: "Total Inspections", value: stats.totalInspections },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <span className="text-2xl font-bold">{stat.value}</span>
          </div>
        ))}
      </div>

      <VendorTable
        rows={vendors}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        search={search}
      />
    </div>
  );
}
