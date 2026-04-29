import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import {
  ArrowLeft, Pencil, CalendarDays, User, MapPin, Zap,
  Droplets, Timer, Gauge, ShieldCheck, TrendingUp,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/inspections/status-badge";
import { CategoryBadge } from "@/components/inspections/category-badge";
import { GeneratePdfButton } from "@/components/inspections/generate-pdf-button";
import { PdfHistoryTimeline } from "@/components/inspections/pdf-history-timeline";
import { GhlSyncButton } from "@/components/inspections/ghl-sync-button";
import { getInspection } from "@/actions/inspections";
import { auth } from "@/auth";
import { STATUS_DESCRIPTIONS, TIER_LABELS } from "@/lib/rules-engine";
import {
  wellTypeLabel, pumpTypeLabel, obstructionLabel, wellCapLabel,
  tankCondLabel, controlBoxLabel, pressureCompLabel,
} from "@/config/inspection-fields";
import { cn } from "@/lib/utils";
import type { CategoryStatus } from "@/lib/inspection-calc";

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
      <span className="text-sm">{value ?? "—"}</span>
    </div>
  );
}

function CategoryRow({
  icon: Icon,
  label,
  status,
}: {
  icon: React.ElementType;
  label: string;
  status: CategoryStatus | string | null | undefined;
}) {
  const normalized = status === "pass" || status === "needs_attention" ? (status as CategoryStatus) : null;
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
        {label}
      </div>
      <CategoryBadge status={normalized} size="sm" />
    </div>
  );
}

function ComputedPill({ label, value, unit, warn }: { label: string; value?: number | null; unit?: string; warn?: boolean }) {
  return (
    <div className={cn(
      "flex flex-col gap-0.5 px-3 py-2 rounded-lg border",
      warn ? "border-amber-200 bg-amber-50 dark:bg-amber-900/10" : "border-border bg-muted/30"
    )}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
      <span className={cn("text-base font-semibold", warn && "text-amber-700 dark:text-amber-400")}>
        {value != null ? (
          <>{value % 1 === 0 ? value : value.toFixed(2)}{unit && <span className="text-xs font-normal ml-1">{unit}</span>}</>
        ) : "—"}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InspectionViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [inspection, session] = await Promise.all([getInspection(id), auth()]);
  if (!inspection) notFound();

  // Vendor access guard
  if (session?.user?.role === "vendor") {
    const company = session.user.companyName;
    const matchesCompany =
      company &&
      (inspection.inspectionCompany === company || inspection.inspector?.company === company);
    if (!matchesCompany) notFound();
  }

  const isOverridden = inspection.finalStatus !== inspection.systemStatus;
  const tierLabel = inspection.membershipTier ? TIER_LABELS[inspection.membershipTier] : null;

  const UPCHARGE_LABELS: Record<string, string> = {
    cps:        "Constant Pressure System",
    deep_well:  "Deep Well (>500 ft)",
    large_tank: "Large Tank (>60 gal)",
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-5xl mx-auto w-full">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/inspections" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}>
            <ArrowLeft className="w-4 h-4" />
            All Inspections
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">{inspection.homeownerName}</h1>
              {inspection.isDraft && <Badge variant="secondary">Draft</Badge>}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {inspection.propertyAddress}
              {inspection.city && `, ${inspection.city}`}
              {inspection.state && `, ${inspection.state}`}
            </p>
            {inspection.reportId && (
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">{inspection.reportId}</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-2 flex-wrap">
          <Link
            href={`/inspections/${id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Link>
          <GeneratePdfButton inspectionId={id} existingPdfUrl={inspection.generatedPdfUrl} reportId={inspection.reportId} />
          <GhlSyncButton
            inspectionId={id}
            ghlSyncStatus={inspection.ghlSyncStatus}
            lastSyncedAt={inspection.lastSyncedAt}
            ghlContactId={inspection.ghlContactId}
            hasEmail={!!inspection.homeownerEmail}
          />
        </div>
      </div>

      {/* Status hero */}
      <Card className={cn(
        "border-2",
        inspection.finalStatus === "green"      && "border-green-300 bg-green-50 dark:bg-green-900/10",
        inspection.finalStatus === "yellow"     && "border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10",
        inspection.finalStatus === "red"        && "border-blue-300 bg-blue-50 dark:bg-blue-900/10",
        inspection.finalStatus === "ineligible" && "border-red-300 bg-red-50 dark:bg-red-900/10"
      )}>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <StatusBadge status={inspection.finalStatus} size="lg" />
                {tierLabel && (
                  <Badge variant="outline" className="text-xs font-medium">{tierLabel} Tier</Badge>
                )}
                {isOverridden && (
                  <Badge variant="outline" className="text-xs">Manually Overridden</Badge>
                )}
              </div>
              {inspection.upcharges.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  {inspection.upcharges.map((flag: string) => (
                    <span
                      key={flag}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border bg-orange-50 text-orange-700 border-orange-300 font-medium"
                    >
                      <TrendingUp className="w-3 h-3" />
                      {UPCHARGE_LABELS[flag] ?? flag} — Upcharge
                    </span>
                  ))}
                </div>
              )}
              <p className="text-sm text-muted-foreground max-w-xl">
                {STATUS_DESCRIPTIONS[inspection.finalStatus]}
              </p>
              {isOverridden && inspection.overrideReason && (
                <p className="text-xs italic text-muted-foreground">
                  Override reason: {inspection.overrideReason}
                </p>
              )}
            </div>

            {/* Category badges summary */}
            <div className="flex flex-col gap-1.5 shrink-0 min-w-[180px]">
              <CategoryRow icon={MapPin}     label="External Equipment" status={inspection.externalEquipmentStatus} />
              <CategoryRow icon={Zap}        label="Internal Equipment" status={inspection.internalEquipmentStatus} />
              <CategoryRow icon={Timer}      label="Cycle Time"         status={inspection.cycleTimeStatus} />
              <CategoryRow icon={Droplets}   label="Well Yield"         status={inspection.wellYieldStatus} />
            </div>
          </div>

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

      {/* PDF history */}
      {inspection.pdfHistory.length > 0 && (
        <Card>
          <CardContent className="pt-5">
            <PdfHistoryTimeline entries={inspection.pdfHistory} reportId={inspection.reportId} />
          </CardContent>
        </Card>
      )}

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
            <DetailRow label="Owner"   value={inspection.homeownerName} />
            <DetailRow label="Email"   value={inspection.homeownerEmail} />
            <DetailRow label="Phone"   value={inspection.homeownerPhone} />
            <div className="col-span-2">
              <DetailRow
                label="Property Address"
                value={[inspection.propertyAddress, inspection.city, inspection.state, inspection.zip].filter(Boolean).join(", ")}
              />
            </div>
          </CardContent>
        </Card>

        {/* Inspection Source */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
              Inspection Info
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailRow label="Inspector" value={inspection.inspectorName} />
            <DetailRow label="Company"   value={inspection.inspectionCompany} />
            <DetailRow label="Date"      value={format(new Date(inspection.inspectionDate), "MMM d, yyyy")} />
            <DetailRow label="Activity"  value={inspection.activity} />
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
            <DetailRow label="Well Type" value={wellTypeLabel(inspection.wellType)} />
            <DetailRow label="Well Depth" value={
              inspection.wellDepthUnknown ? "Unknown" :
              inspection.wellDepthFt ? `${inspection.wellDepthFt} ft` : null
            } />
            <DetailRow label="Pump Type" value={pumpTypeLabel(inspection.pumpType)} />
          </CardContent>
        </Card>

        {/* External Equipment */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                External Equipment
              </CardTitle>
              <CategoryBadge status={inspection.externalEquipmentStatus as CategoryStatus | null} size="sm" />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailRow label="Well Obstructions"     value={obstructionLabel(inspection.wellObstructions)} />
            <DetailRow label="Well Cap"              value={wellCapLabel(inspection.wellCap)} />
            <DetailRow label="Casing Height"         value={inspection.casingHeightInches != null ? `${inspection.casingHeightInches} in` : null} />
          </CardContent>
        </Card>

        {/* Internal Equipment */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4 text-muted-foreground" />
                Internal Equipment
              </CardTitle>
              <CategoryBadge status={inspection.internalEquipmentStatus as CategoryStatus | null} size="sm" />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailRow label="Amperage Reading"    value={inspection.amperageReading != null ? `${inspection.amperageReading} A` : null} />
            <DetailRow label="Tank Condition"      value={tankCondLabel(inspection.tankCondition)} />
            <DetailRow label="Control Box"         value={controlBoxLabel(inspection.controlBoxCondition)} />
            <DetailRow label="Pressure Switch"     value={pressureCompLabel(inspection.pressureSwitch)} />
            <DetailRow label="Pressure Gauge"      value={pressureCompLabel(inspection.pressureGauge)} />
            <DetailRow label="Constant Pressure"   value={inspection.constantPressureSystem ? "Yes" : "No"} />
          </CardContent>
        </Card>

        {/* Cycle Time */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Timer className="w-4 h-4 text-muted-foreground" />
                Cycle Time
              </CardTitle>
              <CategoryBadge status={inspection.cycleTimeStatus as CategoryStatus | null} size="sm" />
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <DetailRow label="Sec to High Reading" value={inspection.secondsToHighReading != null ? `${inspection.secondsToHighReading} s` : null} />
            <DetailRow label="Sec to Low Reading"  value={inspection.secondsToLowReading != null ? `${inspection.secondsToLowReading} s` : null} />
            <div className="col-span-2">
              <DetailRow label="Cycle Time (computed)" value={inspection.cycleTime != null ? `${inspection.cycleTime} s` : null} />
            </div>
          </CardContent>
        </Card>

        {/* Well Yield */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Droplets className="w-4 h-4 text-muted-foreground" />
                Well Yield
              </CardTitle>
              <CategoryBadge status={inspection.wellYieldStatus as CategoryStatus | null} size="sm" />
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <ComputedPill
                label="Well Yield"
                value={inspection.wellYieldGpm}
                unit="gpm"
                warn={inspection.wellYieldGpm != null && inspection.wellYieldGpm < 1.0}
              />
              <ComputedPill
                label="Total Gallons"
                value={inspection.totalGallons}
                unit="gal"
                warn={inspection.totalGallons != null && inspection.totalGallons < 350}
              />
              <ComputedPill
                label="Avg Min to 350 Gal"
                value={inspection.avgMinutesToReach350}
                unit="min"
                warn={inspection.avgMinutesToReach350 != null && inspection.avgMinutesToReach350 > 120}
              />
              <ComputedPill
                label="Gallons Per Day"
                value={inspection.gallonsPerDay}
                unit="gal/day"
              />
            </div>

            {/* Yield test table */}
            {inspection.yieldTests.length > 0 && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Yield Test Data</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-xs text-muted-foreground border-b">
                          <th className="text-left pb-2 pr-4 font-medium">Test</th>
                          <th className="text-left pb-2 pr-4 font-medium">Start Time</th>
                          <th className="text-right pb-2 pr-4 font-medium">Total Gal</th>
                          <th className="text-right pb-2 font-medium">Sec / 5-Gal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inspection.yieldTests.map((t) => (
                          <tr key={t.testNumber} className="border-b last:border-b-0">
                            <td className="py-1.5 pr-4 font-medium">{t.testNumber}</td>
                            <td className="py-1.5 pr-4">{t.startTime ?? "—"}</td>
                            <td className="py-1.5 pr-4 text-right">{t.totalGallons ?? "—"}</td>
                            <td className="py-1.5 text-right">{t.secondsToFillBucket ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Eligibility */}
        {inspection.membershipTier && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-muted-foreground" />
                Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <DetailRow label="Membership Tier" value={tierLabel} />
              <DetailRow
                label="Eligible for Superior"
                value={
                  inspection.eligibleForSuperior === true ? "Yes" :
                  inspection.eligibleForSuperior === false ? "No" : "Not Calculated"
                }
              />
              <DetailRow label="Calc Version" value={`v${inspection.wellCalculationVersion}`} />
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {(inspection.inspectorNotes || inspection.internalReviewerNotes || inspection.requiredRepairs || inspection.recommendedRepairs || inspection.memberFacingSummary) && (
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Notes & Findings</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {inspection.inspectorNotes && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Inspector Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{inspection.inspectorNotes}</p>
                </div>
              )}
              {inspection.internalReviewerNotes && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Internal Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{inspection.internalReviewerNotes}</p>
                </div>
              )}
              {inspection.requiredRepairs && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-destructive uppercase tracking-wide">Required Repairs</p>
                  <p className="text-sm whitespace-pre-wrap">{inspection.requiredRepairs}</p>
                </div>
              )}
              {inspection.recommendedRepairs && (
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Recommended Repairs</p>
                  <p className="text-sm whitespace-pre-wrap">{inspection.recommendedRepairs}</p>
                </div>
              )}
              {inspection.memberFacingSummary && (
                <div className="flex flex-col gap-1 md:col-span-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Member-Facing Summary</p>
                  <p className="text-sm whitespace-pre-wrap border-l-2 border-primary/30 pl-3">{inspection.memberFacingSummary}</p>
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
                    <img src={photo.url} alt={photo.label ?? "Photo"} className="w-40 h-28 object-cover rounded-lg border hover:opacity-90 transition-opacity" />
                  </a>
                  <p className="text-xs text-muted-foreground capitalize">{photo.label?.replace(/_/g, " ") ?? "Photo"}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* GHL */}
        {(inspection.ghlContactId || inspection.ghlOpportunityId || inspection.ghlLocationId) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">GoHighLevel Integration</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              <DetailRow label="GHL Contact ID"     value={inspection.ghlContactId} />
              <DetailRow label="GHL Opportunity ID" value={inspection.ghlOpportunityId} />
              <DetailRow label="GHL Location ID"    value={inspection.ghlLocationId} />
              <DetailRow label="Sync Status"         value={inspection.ghlSyncStatus} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
