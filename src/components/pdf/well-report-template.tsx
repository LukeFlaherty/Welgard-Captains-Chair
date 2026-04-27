import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Inspection, InspectionPhoto, YieldTest } from "@/generated/prisma";
import { STATUS_LABELS, STATUS_DESCRIPTIONS, TIER_LABELS } from "@/lib/rules-engine";
import {
  wellTypeLabel, pumpTypeLabel, pumpManufacturerLabel, pumpHpLabel,
  obstructionLabel, wellCapLabel, casingTypeLabel, casingSizeLabel,
  wellDataSourceLabel, tankCondLabel, tankBrandLabel, psiSettingsLabel,
  waterTreatmentLabel, wireTypeLabel, controlBoxLabel, pressureCompLabel,
  PHOTO_LABELS,
} from "@/config/inspection-fields";

// ─── Brand Colors ─────────────────────────────────────────────────────────────

const C = {
  brand: "#2060ad",
  brandDark: "#174a8a",
  brandLight: "#e8f0fb",
  brandBorder: "#b3cef0",
  green: "#16a34a",
  greenBg: "#f0fdf4",
  greenBorder: "#bbf7d0",
  yellow: "#d97706",
  yellowBg: "#fffbeb",
  yellowBorder: "#fde68a",
  amber: "#b45309",
  amberBg: "#fffbeb",
  amberBorder: "#fde68a",
  // "red" DB value = Standard → rendered blue in UI and PDF
  blue: "#1e40af",
  blueBg: "#eff6ff",
  blueBorder: "#bfdbfe",
  // "ineligible" DB value = Ineligible → rendered red
  red: "#dc2626",
  redBg: "#fef2f2",
  redBorder: "#fecaca",
  muted: "#6b7280",
  border: "#e5e7eb",
  bg: "#f9fafb",
  white: "#ffffff",
  text: "#111827",
  textLight: "#374151",
};

const STATUS_COLOR: Record<string, string> = { green: C.green, yellow: C.yellow, red: C.blue, ineligible: C.red };
const STATUS_BG: Record<string, string> = { green: C.greenBg, yellow: C.yellowBg, red: C.blueBg, ineligible: C.redBg };
const STATUS_BORDER: Record<string, string> = { green: C.greenBorder, yellow: C.yellowBorder, red: C.blueBorder, ineligible: C.redBorder };
const CAT_COLOR: Record<string, string> = { pass: C.green, needs_attention: C.amber };
const CAT_BG: Record<string, string> = { pass: C.greenBg, needs_attention: C.amberBg };

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: C.white,
    paddingTop: 0,
    paddingBottom: 64,
    paddingHorizontal: 0,
    fontSize: 10,
    color: C.text,
  },
  header: {
    backgroundColor: C.brand,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  logoArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoImg: { width: 40, height: 40, borderRadius: 6 },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 1.5, textTransform: "uppercase" },
  brandSub: { fontSize: 8, color: "#93c5fd", letterSpacing: 1, textTransform: "uppercase", marginTop: 3 },
  reportMeta: { alignItems: "flex-end", gap: 2 },
  reportTitle: { fontSize: 9, color: "#bfdbfe", letterSpacing: 0.5, textTransform: "uppercase" },
  reportId: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.white, marginTop: 2 },
  reportDate: { fontSize: 8, color: "#93c5fd", marginTop: 1 },
  miniHeader: {
    backgroundColor: C.brand,
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniHeaderText: { fontSize: 8, color: "#bfdbfe", letterSpacing: 0.5, textTransform: "uppercase" },
  miniHeaderId: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.white },
  body: { paddingHorizontal: 40, paddingTop: 24 },
  statusBanner: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  statusCircle: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  statusCircleText: { fontSize: 22, fontFamily: "Helvetica-Bold" },
  statusRight: { flex: 1, gap: 4 },
  statusLabel: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  statusDesc: { fontSize: 9, color: C.textLight, lineHeight: 1.5 },
  statusScore: { fontSize: 9, color: C.muted, marginTop: 4 },
  coverPhoto: { width: "100%", height: 160, borderRadius: 6, objectFit: "cover", marginBottom: 20 },
  section: { marginBottom: 18 },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 1.5,
    borderBottomColor: C.brandBorder,
    paddingBottom: 4,
    marginBottom: 10,
  },
  grid2: { flexDirection: "row", flexWrap: "wrap" },
  gridCell: { width: "50%", paddingRight: 16, marginBottom: 10 },
  cellLabel: { fontSize: 7.5, color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  cellValue: { fontSize: 10, color: C.text },
  catRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  catLabel: { fontSize: 9, color: C.textLight },
  catBadge: { fontSize: 8, fontFamily: "Helvetica-Bold", paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  computedRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  computedChip: { borderRadius: 6, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, padding: 8, minWidth: 100 },
  computedLabel: { fontSize: 7, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 2 },
  computedValue: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.text },
  computedUnit: { fontSize: 8, color: C.muted },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: C.brand, paddingBottom: 3, marginBottom: 4 },
  tableRow: { flexDirection: "row", paddingVertical: 3, borderBottomWidth: 1, borderBottomColor: C.border },
  tableCell: { fontSize: 8.5, color: C.text },
  noteBox: { backgroundColor: C.bg, borderRadius: 6, padding: 10, marginBottom: 8 },
  noteLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  noteText: { fontSize: 9, color: C.textLight, lineHeight: 1.5 },
  alertBox: { backgroundColor: C.redBg, borderLeftWidth: 3, borderLeftColor: C.red, borderRadius: 4, padding: 10, marginBottom: 8 },
  alertLabel: { fontSize: 7.5, fontFamily: "Helvetica-Bold", color: C.red, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  alertText: { fontSize: 9, color: C.textLight, lineHeight: 1.5 },
  bulletRow: { flexDirection: "row", gap: 6, marginBottom: 3 },
  bulletDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.muted, marginTop: 3.5, flexShrink: 0 },
  bulletText: { fontSize: 9, color: C.textLight, flex: 1, lineHeight: 1.4 },
  photoGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  photoItem: { width: "31%", gap: 3 },
  photoImg: { width: "100%", height: 90, borderRadius: 4, objectFit: "cover" },
  photoPlaceholder: { width: "100%", height: 90, borderRadius: 4, borderWidth: 1, borderColor: C.border, backgroundColor: C.bg, alignItems: "center", justifyContent: "center" },
  photoCaption: { fontSize: 7, color: C.muted, textAlign: "center" },
  disclaimer: { backgroundColor: C.brandLight, borderRadius: 6, borderLeftWidth: 3, borderLeftColor: C.brand, padding: 12, marginTop: 8 },
  disclaimerTitle: { fontSize: 8, fontFamily: "Helvetica-Bold", color: C.brand, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
  disclaimerText: { fontSize: 7.5, color: C.textLight, lineHeight: 1.6 },
  footer: { position: "absolute", bottom: 16, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: C.border, paddingTop: 8 },
  footerText: { fontSize: 7, color: C.muted },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

function DetailCell({ label, value }: { label: string; value?: string | number | boolean | null }) {
  let display: string;
  if (value === null || value === undefined || value === "") {
    display = "—";
  } else if (typeof value === "boolean") {
    display = value ? "Yes" : "No";
  } else {
    display = String(value);
  }
  return (
    <View style={s.gridCell}>
      <Text style={s.cellLabel}>{label}</Text>
      <Text style={s.cellValue}>{display}</Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

function CategoryStatusRow({ label, status }: { label: string; status?: string | null }) {
  const isPass = status === "pass";
  const isNA = status === "needs_attention";
  const color = isPass ? CAT_COLOR.pass : isNA ? CAT_COLOR.needs_attention : C.muted;
  const bg = isPass ? CAT_BG.pass : isNA ? CAT_BG.needs_attention : C.bg;
  const badgeText = isPass ? "Pass" : isNA ? "Needs Attention" : "Incomplete";
  return (
    <View style={s.catRow}>
      <Text style={s.catLabel}>{label}</Text>
      <Text style={[s.catBadge, { color, backgroundColor: bg }]}>{badgeText}</Text>
    </View>
  );
}

function ComputedChip({ label, value, unit }: { label: string; value?: number | null; unit?: string }) {
  return (
    <View style={s.computedChip}>
      <Text style={s.computedLabel}>{label}</Text>
      {value != null ? (
        <Text style={s.computedValue}>
          {value % 1 === 0 ? value : value.toFixed(2)}
          <Text style={s.computedUnit}>{unit ? ` ${unit}` : ""}</Text>
        </Text>
      ) : (
        <Text style={[s.computedValue, { color: C.muted, fontSize: 10 }]}>—</Text>
      )}
    </View>
  );
}

function NoteBox({ label, value, alert }: { label: string; value?: string | null; alert?: boolean }) {
  const boxStyle = alert ? s.alertBox : s.noteBox;
  const labelStyle = alert ? s.alertLabel : s.noteLabel;
  const textStyle = alert ? s.alertText : s.noteText;
  return (
    <View wrap={false} style={boxStyle}>
      <Text style={labelStyle}>{label}</Text>
      <Text style={textStyle}>{value || "—"}</Text>
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
  inspection: Inspection & { photos: InspectionPhoto[]; yieldTests: YieldTest[] };
  logoPath?: string;
};

// ─── PDF Document ─────────────────────────────────────────────────────────────

export function WellReportPDF({ inspection, logoPath }: Props) {
  const status = inspection.finalStatus;
  const statusColor = STATUS_COLOR[status] ?? C.muted;
  const statusBg = STATUS_BG[status] ?? C.bg;
  const statusBorder = STATUS_BORDER[status] ?? C.border;
  const tierLabel = inspection.membershipTier ? TIER_LABELS[inspection.membershipTier] : null;

  const generatedDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const inspectionDate = new Date(inspection.inspectionDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const propertyPhoto = inspection.photos.find((p) => p.label === "property_front");

  const Footer = () => (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Welgard Well Warranty Operations · {inspection.reportId ?? "Draft"}</Text>
      <Text style={s.footerText}>Confidential — For authorized use only</Text>
      <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
    </View>
  );

  return (
    <Document
      title={`Well Inspection Report — ${inspection.homeownerName}`}
      author="Welgard Operations"
      subject="Residential Well Inspection Report"
    >
      {/* ══════════════════════════════════════════════════════════
          PAGE 1 — Cover + Member/Property + Inspection Info + Status
          ══════════════════════════════════════════════════════ */}
      <Page size="LETTER" style={s.page}>
        <View style={s.header}>
          <View style={s.headerRow}>
            <View style={s.logoArea}>
              {logoPath && <Image src={logoPath} style={s.logoImg} />}
              <View>
                <Text style={s.brandName}>Welgard</Text>
                <Text style={s.brandSub}>Well Warranty Operations</Text>
              </View>
            </View>
            <View style={s.reportMeta}>
              <Text style={s.reportTitle}>Well Inspection Report</Text>
              <Text style={s.reportId}>{inspection.reportId ?? "—"}</Text>
              <Text style={s.reportDate}>Generated: {generatedDate}</Text>
              <Text style={s.reportDate}>Inspection: {inspectionDate}</Text>
            </View>
          </View>
        </View>

        <View style={s.body}>
          {/* Cover photo */}
          {propertyPhoto ? (
            <Image src={propertyPhoto.url} style={s.coverPhoto} />
          ) : (
            <View style={[s.coverPhoto, { backgroundColor: C.bg, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" }]}>
              <Text style={{ fontSize: 10, color: C.muted, fontStyle: "italic" }}>No front-of-house photo provided.</Text>
            </View>
          )}

          {/* Status Banner */}
          <View wrap={false} style={[s.statusBanner, { backgroundColor: statusBg, borderWidth: 1.5, borderColor: statusBorder }]}>
            <View style={[s.statusCircle, { backgroundColor: statusColor }]}>
              <Text style={[s.statusCircleText, { color: C.white }]}>
                {status === "green" ? "✓" : status === "yellow" ? "!" : status === "ineligible" ? "✗" : "–"}
              </Text>
            </View>
            <View style={s.statusRight}>
              <Text style={[s.statusLabel, { color: statusColor }]}>
                {STATUS_LABELS[status] ?? status}{tierLabel ? ` — ${tierLabel} Tier` : ""}
              </Text>
              <Text style={s.statusDesc}>{STATUS_DESCRIPTIONS[status]}</Text>
              {inspection.finalStatus !== inspection.systemStatus && (
                <Text style={[s.statusScore, { fontStyle: "italic" }]}>
                  Manually overridden from system recommendation ({inspection.systemStatus})
                </Text>
              )}
              {inspection.overrideReason && (
                <Text style={[s.statusScore, { fontStyle: "italic" }]}>
                  Override reason: {inspection.overrideReason}
                </Text>
              )}
            </View>
          </View>

          {/* Member & Property */}
          <View wrap={false} style={s.section}>
            <SectionTitle>Member & Property</SectionTitle>
            <View style={s.grid2}>
              <DetailCell label="Owner Name"       value={inspection.homeownerName} />
              <DetailCell label="Email"            value={inspection.homeownerEmail} />
              <DetailCell label="Phone"            value={inspection.homeownerPhone} />
              <DetailCell label="Property Address" value={inspection.propertyAddress} />
              <DetailCell label="City"             value={inspection.city} />
              <DetailCell label="State"            value={inspection.state} />
              <DetailCell label="ZIP"              value={inspection.zip} />
            </View>
          </View>

          {/* Inspection Info */}
          <View wrap={false} style={s.section}>
            <SectionTitle>Inspection Info</SectionTitle>
            <View style={s.grid2}>
              <DetailCell label="Inspector"       value={inspection.inspectorName} />
              <DetailCell label="Company"         value={inspection.inspectionCompany} />
              <DetailCell label="Inspection Date" value={inspectionDate} />
              <DetailCell label="Report ID"       value={inspection.reportId} />
              <DetailCell label="Activity"        value={inspection.activity} />
            </View>
          </View>

          {/* Evaluation rationale */}
          {inspection.statusRationale.length > 0 && (
            <View wrap={false} style={s.section}>
              <SectionTitle>Evaluation Notes</SectionTitle>
              {inspection.statusRationale.map((note: string, i: number) => (
                <View key={i} style={s.bulletRow}>
                  <View style={s.bulletDot} />
                  <Text style={s.bulletText}>{note}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <Footer />
      </Page>

      {/* ══════════════════════════════════════════════════════════
          PAGE 2 — Well System + External + Internal + Cycle + Category
          ══════════════════════════════════════════════════════ */}
      <Page size="LETTER" style={s.page}>
        <View style={s.miniHeader}>
          <Text style={s.miniHeaderText}>Well System & Inspection Assessment</Text>
          <Text style={s.miniHeaderId}>{inspection.reportId ?? inspection.homeownerName}</Text>
        </View>

        <View style={s.body}>
          {/* Category Assessment */}
          <View wrap={false} style={s.section}>
            <SectionTitle>Inspection Category Results</SectionTitle>
            <CategoryStatusRow label="External Equipment" status={inspection.externalEquipmentStatus} />
            <CategoryStatusRow label="Internal Equipment" status={inspection.internalEquipmentStatus} />
            <CategoryStatusRow label="Cycle Time"         status={inspection.cycleTimeStatus} />
            <CategoryStatusRow label="Well Yield"         status={inspection.wellYieldStatus} />
          </View>

          {/* Well System */}
          <View wrap={false} style={s.section}>
            <SectionTitle>Well System</SectionTitle>
            <View style={s.grid2}>
              <DetailCell label="Well Type"            value={wellTypeLabel(inspection.wellType)} />
              <DetailCell label="Well Depth"           value={inspection.wellDepthUnknown ? "Unknown" : inspection.wellDepthFt ? `${inspection.wellDepthFt} ft` : null} />
              <DetailCell label="Pump Type"            value={pumpTypeLabel(inspection.pumpType)} />
              <DetailCell label="Pump Manufacturer"    value={pumpManufacturerLabel(inspection.pumpManufacturer)} />
              <DetailCell label="Pump HP"              value={pumpHpLabel(inspection.pumpHp)} />
              <DetailCell label="Distance from House"  value={inspection.distanceFromHouseFt != null ? `${inspection.distanceFromHouseFt} ft` : null} />
              <DetailCell label="Data Source"          value={wellDataSourceLabel(inspection.wellDataSource)} />
            </View>
          </View>

          {/* External Equipment */}
          <View wrap={false} style={s.section}>
            <SectionTitle>External Equipment</SectionTitle>
            <View style={s.grid2}>
              <DetailCell label="Well Obstructions"         value={obstructionLabel(inspection.wellObstructions)} />
              <DetailCell label="Well Cap"                  value={wellCapLabel(inspection.wellCap)} />
              <DetailCell label="Casing Height Above Ground" value={inspection.casingHeightInches != null ? `${inspection.casingHeightInches} in` : null} />
              <DetailCell label="Casing Type"               value={casingTypeLabel(inspection.casingType)} />
              <DetailCell label="Casing Size"               value={casingSizeLabel(inspection.casingSize)} />
            </View>
          </View>

          {/* Internal Equipment */}
          <View wrap={false} style={s.section}>
            <SectionTitle>Internal Equipment</SectionTitle>
            <View style={s.grid2}>
              <DetailCell label="Amperage Reading"       value={inspection.amperageReading != null ? `${inspection.amperageReading} A` : null} />
              <DetailCell label="Tank Condition"         value={tankCondLabel(inspection.tankCondition)} />
              <DetailCell label="Tank Brand"             value={tankBrandLabel(inspection.tankBrand)} />
              <DetailCell label="Tank Model"             value={inspection.tankModel} />
              <DetailCell label="Tank Size"              value={inspection.tankSizeGal != null ? `${inspection.tankSizeGal} gal` : null} />
              <DetailCell label="PSI Settings"           value={psiSettingsLabel(inspection.psiSettings)} />
              <DetailCell label="Control Box"            value={controlBoxLabel(inspection.controlBoxCondition)} />
              <DetailCell label="Pressure Switch"        value={pressureCompLabel(inspection.pressureSwitch)} />
              <DetailCell label="Pressure Gauge"         value={pressureCompLabel(inspection.pressureGauge)} />
              <DetailCell label="Constant Pressure Sys." value={inspection.constantPressureSystem} />
              <DetailCell label="Water Treatment"        value={waterTreatmentLabel(inspection.waterTreatment)} />
              <DetailCell label="Wire Type"              value={wireTypeLabel(inspection.wireType)} />
            </View>
          </View>

          {/* Cycle Time */}
          <View wrap={false} style={s.section}>
            <SectionTitle>Cycle Test</SectionTitle>
            <View style={s.grid2}>
              <DetailCell label="Sec to High Reading"   value={inspection.secondsToHighReading != null ? `${inspection.secondsToHighReading} s` : null} />
              <DetailCell label="Sec to Low Reading"    value={inspection.secondsToLowReading != null ? `${inspection.secondsToLowReading} s` : null} />
              <DetailCell label="Cycle Time (computed)" value={inspection.cycleTime != null ? `${inspection.cycleTime} s` : null} />
            </View>
          </View>
        </View>

        <Footer />
      </Page>

      {/* ══════════════════════════════════════════════════════════
          PAGE 3 — Well Yield + Notes + Photos + Disclaimer
          ══════════════════════════════════════════════════════ */}
      <Page size="LETTER" style={s.page}>
        <View style={s.miniHeader}>
          <Text style={s.miniHeaderText}>Yield Data, Findings & Photos</Text>
          <Text style={s.miniHeaderId}>{inspection.reportId ?? inspection.homeownerName}</Text>
        </View>

        <View style={s.body}>
          {/* Well Yield computed values */}
          <View wrap={false} style={s.section}>
            <SectionTitle>Well Yield</SectionTitle>
            <View style={s.computedRow}>
              <ComputedChip label="Well Yield"         value={inspection.wellYieldGpm}         unit="gpm" />
              <ComputedChip label="Total Gallons"       value={inspection.totalGallons}          unit="gal" />
              <ComputedChip label="Avg Min to 350 Gal" value={inspection.avgMinutesToReach350}  unit="min" />
              <ComputedChip label="Gallons Per Day"     value={inspection.gallonsPerDay}          unit="gal/day" />
            </View>
          </View>

          {/* Yield tests */}
          {inspection.yieldTests.length > 0 && (
            <View wrap={false} style={s.section}>
              <SectionTitle>Yield Test Data</SectionTitle>
              <View style={s.tableHeader}>
                <Text style={[s.tableCell, { width: 40, fontFamily: "Helvetica-Bold", fontSize: 7.5, color: C.muted }]}>Test</Text>
                <Text style={[s.tableCell, { width: 80, fontFamily: "Helvetica-Bold", fontSize: 7.5, color: C.muted }]}>Start Time</Text>
                <Text style={[s.tableCell, { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 7.5, color: C.muted }]}>Total Gallons</Text>
                <Text style={[s.tableCell, { flex: 1, fontFamily: "Helvetica-Bold", fontSize: 7.5, color: C.muted }]}>Sec / 5-Gal Bucket</Text>
              </View>
              {inspection.yieldTests.map((t: YieldTest) => (
                <View key={t.testNumber} style={s.tableRow}>
                  <Text style={[s.tableCell, { width: 40 }]}>{t.testNumber}</Text>
                  <Text style={[s.tableCell, { width: 80 }]}>{t.startTime ?? "—"}</Text>
                  <Text style={[s.tableCell, { flex: 1 }]}>{t.totalGallons ?? "—"}</Text>
                  <Text style={[s.tableCell, { flex: 1 }]}>{t.secondsToFillBucket ?? "—"}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Notes & Findings — always shown */}
          <View style={s.section}>
            <SectionTitle>Findings & Recommendations</SectionTitle>
            <NoteBox label="Member-Facing Summary"       value={inspection.memberFacingSummary} />
            <NoteBox label="Required Repairs"            value={inspection.requiredRepairs} alert={!!inspection.requiredRepairs} />
            <NoteBox label="Recommended Repairs / Updates" value={inspection.recommendedRepairs} />
            <NoteBox label="Inspector Notes"             value={inspection.inspectorNotes} />
            <NoteBox label="Internal Reviewer Notes"     value={inspection.internalReviewerNotes} />
          </View>

          {/* Eligibility */}
          {inspection.membershipTier && (
            <View wrap={false} style={s.section}>
              <SectionTitle>Eligibility</SectionTitle>
              <View style={s.grid2}>
                <DetailCell label="Membership Tier"       value={tierLabel} />
                <DetailCell label="Eligible for Superior" value={inspection.eligibleForSuperior} />
                <DetailCell label="Calc Version"          value={`v${inspection.wellCalculationVersion}`} />
              </View>
            </View>
          )}

          {/* Photos — all 7 slots always shown */}
          <View style={s.section}>
            <SectionTitle>Inspection Photos</SectionTitle>
            <View style={s.photoGrid}>
              {PHOTO_LABELS.map(({ key, label }) => {
                const photo = inspection.photos.find((p) => p.label === key);
                return (
                  <View key={key} style={s.photoItem}>
                    {photo ? (
                      <Image src={photo.url} style={s.photoImg} />
                    ) : (
                      <View style={s.photoPlaceholder}>
                        <Text style={{ fontSize: 7, color: C.muted, textAlign: "center" }}>No photo</Text>
                      </View>
                    )}
                    <Text style={s.photoCaption}>{label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Disclaimer */}
          <View wrap={false} style={s.disclaimer}>
            <Text style={s.disclaimerTitle}>Important Disclaimer</Text>
            <Text style={s.disclaimerText}>
              This report is based solely on the visible and accessible conditions observed during
              the inspection conducted on the date noted above. It does not constitute a guarantee
              of the well system&apos;s future performance, longevity, or suitability for any
              particular use. The inspection is limited to items and areas accessible at the time
              and does not include assessment of concealed, underground, or inaccessible components.{"\n\n"}
              Final coverage eligibility, participation decisions, and warranty terms remain subject
              to Welgard&apos;s standard review process and program guidelines. This report is intended
              for internal operational use and authorized member communication only.
            </Text>
          </View>
        </View>

        <Footer />
      </Page>
    </Document>
  );
}
