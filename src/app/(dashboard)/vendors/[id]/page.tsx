import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Pencil, Building2, UserCheck, Users, ClipboardCheck,
  Mail, Phone, FileText, MapPin, Globe, Calendar, StickyNote, Clock,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getVendor, listVendorInspections } from "@/actions/vendors";

export const metadata: Metadata = { title: "Vendor" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ipage?: string }>;
};

const RATING_LABELS: Record<string, { label: string; cls: string }> = {
  "1": { label: "Rating: 1 (Best)", cls: "bg-green-100 text-green-700 border-green-300" },
  "2": { label: "Rating: 2", cls: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  "3": { label: "Rating: 3 (Caution)", cls: "bg-red-100 text-red-700 border-red-300" },
  "Prospect": { label: "Prospect", cls: "bg-blue-100 text-blue-700 border-blue-300" },
};

const FINAL_STATUS_COLORS: Record<string, string> = {
  green: "text-green-600",
  yellow: "text-yellow-600",
  red: "text-red-600",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-700 border-green-300",
  inactive: "bg-muted text-muted-foreground border-border",
  suspended: "bg-red-100 text-red-700 border-red-300",
};

function InfoCard({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
      <span className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}{label}
      </span>
      <span className="font-medium text-sm break-words">{value}</span>
    </div>
  );
}

export default async function VendorDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { ipage } = await searchParams;
  const inspectionPage = Math.max(1, parseInt(ipage ?? "1", 10) || 1);

  const [vendor, { data: inspections, total: inspectionTotal }] = await Promise.all([
    getVendor(id),
    listVendorInspections(id, { page: inspectionPage, pageSize: PAGE_SIZE }),
  ]);

  if (!vendor) notFound();

  const rating = vendor.rating ? RATING_LABELS[vendor.rating] : null;
  const location = [vendor.city, vendor.county, vendor.state, vendor.zip].filter(Boolean).join(", ");
  const address = [vendor.streetAddress, vendor.streetAddress2].filter(Boolean).join(", ");

  const inspectionStart = Math.min((inspectionPage - 1) * PAGE_SIZE + 1, inspectionTotal);
  const inspectionEnd = Math.min(inspectionPage * PAGE_SIZE, inspectionTotal);
  const totalPages = Math.ceil(inspectionTotal / PAGE_SIZE);

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
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Building2 className="w-5 h-5 text-muted-foreground shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight">{vendor.companyName}</h1>
          {vendor.vendorType && (
            <Badge variant="outline">{vendor.vendorType}</Badge>
          )}
          {rating && (
            <span className={`text-xs px-2 py-0.5 rounded-full border ${rating.cls}`}>
              {rating.label}
            </span>
          )}
          {vendor.availableAfterHours && (
            <span className="text-xs px-2 py-0.5 rounded-full border bg-purple-100 text-purple-700 border-purple-300 flex items-center gap-1">
              <Clock className="w-3 h-3" /> After Hours
            </span>
          )}
        </div>
        {vendor.licenseNumber && (
          <p className="text-sm text-muted-foreground ml-7">License: {vendor.licenseNumber}</p>
        )}
        {vendor.taxId && (
          <p className="text-sm text-muted-foreground ml-7">Tax ID: {vendor.taxId}</p>
        )}
      </div>

      {/* Contact cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {vendor.primaryContact && (
          <InfoCard label="Primary Contact" value={vendor.primaryContact} />
        )}
        {vendor.email && (
          <InfoCard label="Email" value={vendor.email} icon={<Mail className="w-3 h-3" />} />
        )}
        {vendor.phone && (
          <InfoCard label="Phone" value={vendor.phone} icon={<Phone className="w-3 h-3" />} />
        )}
        {vendor.phone2 && (
          <InfoCard label="Phone 2" value={vendor.phone2} icon={<Phone className="w-3 h-3" />} />
        )}
        {vendor.phone3 && (
          <InfoCard label="Phone 3" value={vendor.phone3} icon={<Phone className="w-3 h-3" />} />
        )}
        {location && (
          <InfoCard label="Location" value={location} icon={<MapPin className="w-3 h-3" />} />
        )}
        {address && (
          <InfoCard label="Address" value={address} icon={<MapPin className="w-3 h-3" />} />
        )}
        {vendor.websiteUrl && (
          <div className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe className="w-3 h-3" /> Website
            </span>
            <a
              href={vendor.websiteUrl.startsWith("http") ? vendor.websiteUrl : `https://${vendor.websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-sm text-blue-600 hover:underline break-words"
            >
              {vendor.websiteUrl}
            </a>
          </div>
        )}
        {vendor.startDate && (
          <InfoCard
            label="Partner Since"
            value={format(new Date(vendor.startDate), "MMM d, yyyy")}
            icon={<Calendar className="w-3 h-3" />}
          />
        )}
      </div>

      {/* Availability notes */}
      {vendor.availabilityNotes && (
        <div className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" /> Availability
          </span>
          <p className="text-sm whitespace-pre-wrap">{vendor.availabilityNotes}</p>
        </div>
      )}

      {/* Notes */}
      {vendor.notes && (
        <div className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <StickyNote className="w-3 h-3" /> Notes
          </span>
          <p className="text-sm whitespace-pre-wrap">{vendor.notes}</p>
        </div>
      )}

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
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[inspector.status] ?? ""}`}>
                    {inspector.status}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Link
            href="/inspectors/new"
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

      {/* Inspections — paginated */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">
              Inspections ({inspectionTotal})
            </h2>
          </div>
          {inspectionTotal > PAGE_SIZE && (
            <span className="text-xs text-muted-foreground">
              Showing {inspectionStart}–{inspectionEnd} of {inspectionTotal}
            </span>
          )}
        </div>

        {inspectionTotal === 0 ? (
          <div className="border rounded-xl p-6 text-center text-sm text-muted-foreground bg-muted/30">
            No inspections linked to this company yet.
          </div>
        ) : (
          <>
            <div className="border rounded-xl divide-y overflow-hidden">
              {inspections.map((insp) => (
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
                    {insp.inspectorName && (
                      <span className="text-xs text-muted-foreground">{insp.inspectorName}</span>
                    )}
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

            {inspectionTotal > PAGE_SIZE && (
              <div className="flex items-center justify-between gap-4 px-1 py-1">
                <span className="text-xs text-muted-foreground">
                  Page {inspectionPage} of {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  {inspectionPage > 1 ? (
                    <Link
                      href={`/vendors/${id}?ipage=${inspectionPage - 1}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Link>
                  ) : (
                    <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1 opacity-40 pointer-events-none")}>
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </span>
                  )}
                  {inspectionPage < totalPages ? (
                    <Link
                      href={`/vendors/${id}?ipage=${inspectionPage + 1}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : (
                    <span className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1 opacity-40 pointer-events-none")}>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
