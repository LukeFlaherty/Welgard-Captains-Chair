import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ArrowLeft, Pencil, CalendarDays, User, MapPin, Wrench } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { StatusBadge } from "@/components/inspections/status-badge";
import { GeneratePdfButton } from "@/components/inspections/generate-pdf-button";
import { getInspection } from "@/actions/inspections";
import { STATUS_DESCRIPTIONS } from "@/lib/rules-engine";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const inspection = await getInspection(id);
  return { title: inspection ? `${inspection.homeownerName} — Inspection` : "Inspection" };
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

function ConditionPill({ value }: { value?: string | null }) {
  if (!value) return <span className="text-sm">—</span>;
  const colors: Record<string, string> = {
    good: "bg-green-100 text-green-700 border-green-300",
    fair: "bg-yellow-100 text-yellow-700 border-yellow-300",
    poor: "bg-red-100 text-red-700 border-red-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border capitalize",
        colors[value] ?? "bg-muted text-muted-foreground border-border"
      )}
    >
      {value}
    </span>
  );
}

function CheckPill({ ok }: { ok: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border",
        ok
          ? "bg-green-100 text-green-700 border-green-300"
          : "bg-red-100 text-red-700 border-red-300"
      )}
    >
      {ok ? "Yes" : "No"}
    </span>
  );
}

export default async function InspectionViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inspection = await getInspection(id);
  if (!inspection) notFound();

  const isOverridden = inspection.finalStatus !== inspection.systemStatus;

  return (
    <div className="flex flex-col gap-6 p-8 max-w-5xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link
            href="/inspections"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
          >
            <ArrowLeft className="w-4 h-4" />
            All Inspections
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {inspection.homeownerName}
              </h1>
              {inspection.isDraft && (
                <Badge variant="secondary">Draft</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {inspection.propertyAddress}
              {inspection.city && `, ${inspection.city}`}
              {inspection.state && `, ${inspection.state}`}
            </p>
            {inspection.reportId && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                {inspection.reportId}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/inspections/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Link>
          <GeneratePdfButton
            inspectionId={id}
            existingPdfUrl={inspection.generatedPdfUrl}
            reportId={inspection.reportId}
          />
        </div>
      </div>

      {/* Status Hero */}
      <Card
        className={cn(
          "border-2",
          inspection.finalStatus === "green" && "border-green-300 bg-green-50 dark:bg-green-900/10",
          inspection.finalStatus === "yellow" && "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10",
          inspection.finalStatus === "red" && "border-red-300 bg-red-50 dark:bg-red-900/10"
        )}
      >
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-3">
                <StatusBadge status={inspection.finalStatus} size="lg" />
                {isOverridden && (
                  <Badge variant="outline" className="text-xs">
                    Manually Overridden
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground max-w-xl">
                {STATUS_DESCRIPTIONS[inspection.finalStatus]}
              </p>
              {isOverridden && inspection.overrideReason && (
                <p className="text-xs italic text-muted-foreground">
                  Override reason: {inspection.overrideReason}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1 text-right shrink-0">
              <span className="text-4xl font-bold">{inspection.systemScore ?? "—"}</span>
              <span className="text-xs text-muted-foreground">System score / 100</span>
              {isOverridden && (
                <span className="text-xs text-muted-foreground">
                  (System: <span className="capitalize">{inspection.systemStatus}</span>)
                </span>
              )}
            </div>
          </div>

          {/* Rationale */}
          {inspection.statusRationale.length > 0 && (
            <div className="mt-4 pt-4 border-t border-current/10">
              <p className="text-xs font-medium text-muted-foreground mb-2">Evaluation notes:</p>
              <ul className="flex flex-col gap-1">
                {inspection.statusRationale.map((r: string, i: number) => (
                  <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                    <span className="shrink-0">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* PDF report generated alert */}
      {inspection.generatedPdfUrl && inspection.reportGeneratedAt && (
        <Alert>
          <AlertDescription className="text-sm">
            PDF generated {format(new Date(inspection.reportGeneratedAt), "MMM d, yyyy 'at' h:mm a")}.{" "}
            <a
              href={inspection.generatedPdfUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline-offset-2 hover:underline"
            >
              Download report
            </a>
          </AlertDescription>
        </Alert>
      )}

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Member & Property */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              Member & Property
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailRow label="Owner" value={inspection.homeownerName} />
            <DetailRow label="Email" value={inspection.homeownerEmail} />
            <DetailRow label="Phone" value={inspection.homeownerPhone} />
            <div className="col-span-2">
              <DetailRow
                label="Property Address"
                value={[
                  inspection.propertyAddress,
                  inspection.city,
                  inspection.state,
                  inspection.zip,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inspection Source */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              Inspection Source
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailRow label="Inspector" value={inspection.inspectorName} />
            <DetailRow label="Company" value={inspection.inspectionCompany} />
            <DetailRow
              label="Date"
              value={format(new Date(inspection.inspectionDate), "MMM d, yyyy")}
            />
          </CardContent>
        </Card>

        {/* Well System */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              Well System
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailRow label="Well Type" value={inspection.wellType} />
            <DetailRow
              label="Well Depth"
              value={inspection.wellDepthFt ? `${inspection.wellDepthFt} ft` : null}
            />
            <DetailRow label="Pump Type" value={inspection.pumpType} />
            <DetailRow
              label="Pump Age"
              value={inspection.pumpAgeYears ? `${inspection.pumpAgeYears} yrs` : null}
            />
            <DetailRow
              label="Pressure Tank Age"
              value={
                inspection.pressureTankAgeYears
                  ? `${inspection.pressureTankAgeYears} yrs`
                  : null
              }
            />
          </CardContent>
        </Card>

        {/* Conditions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Casing</span>
                <ConditionPill value={inspection.casingCondition} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Well Cap</span>
                <ConditionPill value={inspection.wellCapCondition} />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Wiring</span>
                <ConditionPill value={inspection.wiringCondition} />
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Safety Issues", value: inspection.safetyIssues, invert: true },
                { label: "Contamination Risk", value: inspection.contaminationRisk, invert: true },
                { label: "Visible Leaks", value: inspection.visibleLeaks, invert: true },
                { label: "System Operational", value: inspection.systemOperational },
                { label: "Pressure OK", value: inspection.pressureOk },
                { label: "Flow OK", value: inspection.flowOk },
                { label: "Site Clearance OK", value: inspection.siteClearanceOk },
              ].map(({ label, value, invert }) => (
                <div key={label} className="flex flex-col gap-1">
                  <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                    {label}
                  </span>
                  <CheckPill ok={invert ? !value : value} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        {(inspection.inspectorNotes ||
          inspection.internalReviewerNotes ||
          inspection.requiredRepairs ||
          inspection.recommendedRepairs ||
          inspection.memberFacingSummary) && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Notes & Findings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {inspection.inspectorNotes && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Inspector Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{inspection.inspectorNotes}</p>
                </div>
              )}
              {inspection.internalReviewerNotes && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Internal Notes
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{inspection.internalReviewerNotes}</p>
                </div>
              )}
              {inspection.requiredRepairs && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-destructive uppercase tracking-wide">
                    Required Repairs
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{inspection.requiredRepairs}</p>
                </div>
              )}
              {inspection.recommendedRepairs && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Recommended Repairs
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{inspection.recommendedRepairs}</p>
                </div>
              )}
              {inspection.memberFacingSummary && (
                <div className="flex flex-col gap-1 md:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Member-Facing Summary
                  </p>
                  <p className="text-sm whitespace-pre-wrap border-l-2 border-primary/30 pl-3">
                    {inspection.memberFacingSummary}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Photos */}
        {inspection.photos.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Photos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4">
              {inspection.photos.map((photo: { id: string; url: string; label: string | null }) => (
                <div key={photo.id} className="flex flex-col gap-1">
                  <a href={photo.url} target="_blank" rel="noreferrer">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={photo.label ?? "Photo"}
                      className="w-40 h-28 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                    />
                  </a>
                  <p className="text-xs text-muted-foreground capitalize">
                    {photo.label?.replace(/_/g, " ") ?? "Photo"}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* GHL integration */}
        {(inspection.ghlContactId ||
          inspection.ghlOpportunityId ||
          inspection.ghlLocationId) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">GoHighLevel Integration</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <DetailRow label="GHL Contact ID" value={inspection.ghlContactId} />
              <DetailRow label="GHL Opportunity ID" value={inspection.ghlOpportunityId} />
              <DetailRow label="GHL Location ID" value={inspection.ghlLocationId} />
              <DetailRow label="Sync Status" value={inspection.ghlSyncStatus} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
