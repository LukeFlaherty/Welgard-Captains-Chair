import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Pencil, Mail, Phone, Building2, Award, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/inspections/status-badge";
import { getInspector } from "@/actions/inspectors";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const inspector = await getInspector(id);
  return { title: inspector ? `${inspector.name} — Inspector` : "Inspector" };
}

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
        {label}
      </span>
      <span className="text-sm">{value ?? "—"}</span>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-block w-2.5 h-2.5 rounded-full shrink-0",
        status === "active"
          ? "bg-green-500"
          : status === "inactive"
          ? "bg-yellow-400"
          : "bg-red-500"
      )}
    />
  );
}

export default async function InspectorViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inspector = await getInspector(id);
  if (!inspector) notFound();

  const counts = inspector.inspections.reduce(
    (acc, i) => {
      acc.total++;
      if (i.finalStatus === "green") acc.green++;
      else if (i.finalStatus === "yellow") acc.yellow++;
      else if (i.finalStatus === "red") acc.red++;
      if (i.isDraft) acc.drafts++;
      return acc;
    },
    { total: 0, green: 0, yellow: 0, red: 0, drafts: 0 }
  );

  const coveredStates = [
    ...new Set(
      inspector.inspections.map((i) => i.state).filter((s): s is string => Boolean(s))
    ),
  ].sort();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link
            href="/inspectors"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
          >
            <ArrowLeft className="w-4 h-4" />
            All Inspectors
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">{inspector.name}</h1>
              <div className="flex items-center gap-1.5 text-sm capitalize text-muted-foreground">
                <StatusDot status={inspector.status} />
                {inspector.status}
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {inspector.company ?? "Independent Inspector"}
            </p>
          </div>
        </div>
        <Link
          href={`/inspectors/${id}/edit`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Submissions", value: counts.total, color: "text-foreground" },
          { label: "Approved", value: counts.green, color: "text-green-600" },
          { label: "Conditional", value: counts.yellow, color: "text-yellow-600" },
          { label: "Not Approved", value: counts.red, color: "text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
            <span className="text-xs text-muted-foreground">{stat.label}</span>
            <span className={cn("text-2xl font-bold", stat.color)}>{stat.value}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Contact & License */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-muted-foreground" />
              License &amp; Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailRow label="License #" value={inspector.licenseNumber} />
            <DetailRow
              label="Experience"
              value={inspector.yearsExperience != null ? `${inspector.yearsExperience} years` : null}
            />
            <div className="flex flex-col gap-0.5 col-span-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Email
              </span>
              {inspector.email ? (
                <a
                  href={`mailto:${inspector.email}`}
                  className="text-sm text-primary flex items-center gap-1.5 hover:underline"
                >
                  <Mail className="w-3.5 h-3.5 shrink-0" />
                  {inspector.email}
                </a>
              ) : (
                <span className="text-sm">—</span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 col-span-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Phone
              </span>
              {inspector.phone ? (
                <a
                  href={`tel:${inspector.phone}`}
                  className="text-sm text-primary flex items-center gap-1.5 hover:underline"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  {inspector.phone}
                </a>
              ) : (
                <span className="text-sm">—</span>
              )}
            </div>
            {inspector.company && (
              <div className="flex flex-col gap-0.5 col-span-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Company
                </span>
                <span className="text-sm flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  {inspector.company}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Coverage & Certifications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Coverage &amp; Certifications
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Licensed States
              </span>
              <div className="flex flex-wrap gap-1.5">
                {inspector.licenseStates.length > 0 ? (
                  inspector.licenseStates.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">
                      {s}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
              </div>
            </div>
            {coveredStates.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                  Active Inspection States
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {coveredStates.map((s) => (
                    <Badge key={s} variant="outline" className="text-xs">
                      {s}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                Certifications
              </span>
              {inspector.certifications.length > 0 ? (
                <ul className="flex flex-col gap-1">
                  {inspector.certifications.map((c) => (
                    <li key={c} className="text-sm flex items-start gap-1.5">
                      <span className="text-muted-foreground shrink-0 mt-0.5">•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">—</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {inspector.notes && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Internal Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap text-muted-foreground border-l-2 border-primary/30 pl-3">
                {inspector.notes}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Inspection history */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">
              Inspection History
              {counts.drafts > 0 && (
                <span className="text-muted-foreground font-normal ml-1.5">
                  ({counts.drafts} draft{counts.drafts !== 1 ? "s" : ""})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {inspector.inspections.length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 py-8 text-center">
                No inspections submitted yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Owner
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Location
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Date
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Score
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Status
                      </th>
                      <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Report
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspector.inspections.map((insp) => (
                      <tr key={insp.id} className="border-b last:border-b-0 hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3 font-medium">
                          <Link
                            href={`/inspections/${insp.id}`}
                            className="hover:text-primary hover:underline underline-offset-2"
                          >
                            {insp.homeownerName}
                          </Link>
                          {insp.isDraft && (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 ml-1.5">
                              Draft
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-3 text-muted-foreground">
                          {[insp.propertyAddress, insp.city, insp.state]
                            .filter(Boolean)
                            .join(", ")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {format(new Date(insp.inspectionDate), "MMM d, yyyy")}
                        </td>
                        <td className="px-4 py-3 font-medium">
                          {insp.systemScore ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={insp.finalStatus} size="sm" />
                        </td>
                        <td className="px-6 py-3 text-right">
                          {insp.reportId ? (
                            <span className="font-mono text-xs text-muted-foreground">
                              {insp.reportId}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
