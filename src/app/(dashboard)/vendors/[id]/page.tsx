import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Building2, UserCheck, Users, ClipboardCheck, Mail, Phone, FileText } from "lucide-react";
import { format } from "date-fns";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getVendor } from "@/actions/vendors";

export const metadata: Metadata = { title: "Vendor" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function VendorDetailPage({ params }: Props) {
  const { id } = await params;
  const vendor = await getVendor(id);
  if (!vendor) notFound();

  const STATUS_COLORS: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-300",
    inactive: "bg-muted text-muted-foreground border-border",
    suspended: "bg-red-100 text-red-700 border-red-300",
  };

  const FINAL_STATUS_COLORS: Record<string, string> = {
    green: "text-green-600",
    yellow: "text-yellow-600",
    red: "text-red-600",
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/vendors"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
          >
            <ArrowLeft className="w-4 h-4" />
            Vendors
          </Link>
        </div>
        <Link
          href={`/vendors/${vendor.id}/edit`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Link>
      </div>

      {/* Company info */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">{vendor.companyName}</h1>
        </div>
        {vendor.licenseNumber && (
          <p className="text-sm text-muted-foreground ml-7">License: {vendor.licenseNumber}</p>
        )}
      </div>

      {/* Contact card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {vendor.inspectorName && (
          <div className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
            <span className="text-xs text-muted-foreground">Primary Contact</span>
            <span className="font-medium text-sm">{vendor.inspectorName}</span>
          </div>
        )}
        {vendor.email && (
          <div className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> Email</span>
            <span className="font-medium text-sm">{vendor.email}</span>
          </div>
        )}
        {vendor.phone && (
          <div className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
            <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</span>
            <span className="font-medium text-sm">{vendor.phone}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inspectors */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Inspectors ({vendor.inspectors.length})</h2>
          </div>
          {vendor.inspectors.length === 0 ? (
            <div className="border rounded-xl p-6 text-center text-sm text-muted-foreground bg-muted/30">
              No inspectors linked to this company yet.
            </div>
          ) : (
            <div className="border rounded-xl divide-y overflow-hidden">
              {vendor.inspectors.map((inspector) => (
                <div key={inspector.id} className="flex items-center justify-between p-3 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <Link
                      href={`/inspectors/${inspector.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      {inspector.name}
                    </Link>
                    {inspector.email && (
                      <span className="text-xs text-muted-foreground">{inspector.email}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[inspector.status] ?? ""}`}
                  >
                    {inspector.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href={`/inspectors/new`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 self-start")}
          >
            Add Inspector
          </Link>
        </section>

        {/* Vendor users */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Vendor Users ({vendor.users.length})</h2>
          </div>
          {vendor.users.length === 0 ? (
            <div className="border rounded-xl p-6 text-center text-sm text-muted-foreground bg-muted/30">
              No user accounts linked to this company.
            </div>
          ) : (
            <div className="border rounded-xl divide-y overflow-hidden">
              {vendor.users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 gap-2">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{user.name ?? "—"}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/settings/users"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5 self-start")}
          >
            Manage Users
          </Link>
        </section>
      </div>

      {/* Recent inspections */}
      {vendor.inspections.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Recent Inspections</h2>
          </div>
          <div className="border rounded-xl divide-y overflow-hidden">
            {vendor.inspections.map((insp) => (
              <div key={insp.id} className="flex items-center justify-between p-3 gap-3">
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/inspections/${insp.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {insp.homeownerName}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {insp.propertyAddress}{insp.city ? `, ${insp.city}` : ""}{insp.state ? ` ${insp.state}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {insp.reportId && (
                    <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                      <FileText className="w-3 h-3" />{insp.reportId}
                    </span>
                  )}
                  {insp.isDraft ? (
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">Draft</Badge>
                  ) : (
                    <span className={`text-xs font-medium capitalize ${FINAL_STATUS_COLORS[insp.finalStatus] ?? ""}`}>
                      {insp.finalStatus}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(insp.inspectionDate), "MMM d, yyyy")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
