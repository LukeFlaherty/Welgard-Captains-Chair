import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { VendorTable } from "@/components/vendors/vendor-table";
import { listVendors } from "@/actions/vendors";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Vendors" };
export const dynamic = "force-dynamic";

export default async function VendorsPage() {
  const vendors = await listVendors();

  const totalInspectors = vendors.reduce((sum, v) => sum + v._count.inspectors, 0);
  const totalInspections = vendors.reduce((sum, v) => sum + v._count.inspections, 0);

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

      {vendors.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Total Companies", value: vendors.length },
            { label: "Total Inspectors", value: totalInspectors },
            { label: "Total Inspections", value: totalInspections },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
              <span className="text-xs text-muted-foreground">{stat.label}</span>
              <span className="text-2xl font-bold">{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      <VendorTable rows={vendors} />
    </div>
  );
}
