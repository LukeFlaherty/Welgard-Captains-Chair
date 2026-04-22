import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import type { Inspection, InspectionPhoto } from "@/generated/prisma";
import { STATUS_LABELS, STATUS_DESCRIPTIONS } from "@/lib/rules-engine";

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

const STATUS_COLOR: Record<string, string> = { green: C.green, yellow: C.yellow, red: C.red };
const STATUS_BG: Record<string, string> = { green: C.greenBg, yellow: C.yellowBg, red: C.redBg };
const STATUS_BORDER: Record<string, string> = { green: C.greenBorder, yellow: C.yellowBorder, red: C.redBorder };

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

  // Header band
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
  logoImg: {
    width: 40,
    height: 40,
    borderRadius: 6,
  },
  brandName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  brandSub: {
    fontSize: 8,
    color: "#93c5fd",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 3,
  },
  reportMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  reportTitle: {
    fontSize: 9,
    color: "#bfdbfe",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  reportId: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    marginTop: 2,
  },
  reportDate: {
    fontSize: 8,
    color: "#93c5fd",
    marginTop: 1,
  },

  // Continuation header (page 2+)
  miniHeader: {
    backgroundColor: C.brand,
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  miniHeaderText: {
    fontSize: 8,
    color: "#bfdbfe",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  miniHeaderId: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },

  // Body
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },

  // Status banner
  statusBanner: {
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  statusCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  statusCircleText: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
  },
  statusRight: {
    flex: 1,
    gap: 4,
  },
  statusLabel: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
  },
  statusDesc: {
    fontSize: 9,
    color: C.textLight,
    lineHeight: 1.5,
  },
  statusScore: {
    fontSize: 9,
    color: C.muted,
    marginTop: 4,
  },

  // Property photo on cover
  coverPhoto: {
    width: "100%",
    height: 160,
    borderRadius: 6,
    objectFit: "cover",
    marginBottom: 20,
  },

  // Section
  section: {
    marginBottom: 18,
  },
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

  // Grid
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridCell: {
    width: "50%",
    paddingRight: 16,
    marginBottom: 10,
  },
  cellLabel: {
    fontSize: 7.5,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cellValue: {
    fontSize: 10,
    color: C.text,
  },

  // Condition pills
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
  },
  pillGood: { backgroundColor: C.greenBg, color: C.green },
  pillFair: { backgroundColor: C.yellowBg, color: C.yellow },
  pillPoor: { backgroundColor: C.redBg, color: C.red },

  // Check items
  checkRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 5,
    alignItems: "center",
  },
  checkDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  checkLabel: {
    fontSize: 9,
    color: C.textLight,
    flex: 1,
  },
  checkValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
  },

  // Notes
  noteBox: {
    backgroundColor: C.bg,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
  },
  noteLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  noteText: {
    fontSize: 9,
    color: C.textLight,
    lineHeight: 1.5,
  },

  // Alert box
  alertBox: {
    backgroundColor: C.redBg,
    borderLeftWidth: 3,
    borderLeftColor: C.red,
    borderRadius: 4,
    padding: 10,
    marginBottom: 8,
  },
  alertLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.red,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  alertText: {
    fontSize: 9,
    color: C.textLight,
    lineHeight: 1.5,
  },

  // Rationale bullets
  bulletRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 3,
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.muted,
    marginTop: 3.5,
    flexShrink: 0,
  },
  bulletText: {
    fontSize: 9,
    color: C.textLight,
    flex: 1,
    lineHeight: 1.4,
  },

  // Photos
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  photoItem: {
    width: "31%",
    gap: 3,
  },
  photoImg: {
    width: "100%",
    height: 90,
    borderRadius: 4,
    objectFit: "cover",
  },
  photoCaption: {
    fontSize: 7,
    color: C.muted,
    textAlign: "center",
    textTransform: "capitalize",
  },

  // Disclaimer
  disclaimer: {
    backgroundColor: C.brandLight,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: C.brand,
    padding: 12,
    marginTop: 8,
  },
  disclaimerTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 7.5,
    color: C.textLight,
    lineHeight: 1.6,
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  footerText: {
    fontSize: 7,
    color: C.muted,
  },
});

// ─── Helper components ────────────────────────────────────────────────────────

function DetailCell({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View style={s.gridCell}>
      <Text style={s.cellLabel}>{label}</Text>
      <Text style={s.cellValue}>{value ?? "—"}</Text>
    </View>
  );
}

function ConditionPill({ label, value }: { label: string; value?: string | null }) {
  const style = value === "good" ? s.pillGood : value === "fair" ? s.pillFair : value === "poor" ? s.pillPoor : null;
  if (!style || !value) return null;
  return (
    <View style={[s.pill, style]}>
      <Text>{label}: {value.charAt(0).toUpperCase() + value.slice(1)}</Text>
    </View>
  );
}

function CheckItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <View style={s.checkRow}>
      <View style={[s.checkDot, { backgroundColor: ok ? C.green : C.red }]} />
      <Text style={s.checkLabel}>{label}</Text>
      <Text style={[s.checkValue, { color: ok ? C.green : C.red }]}>{ok ? "✓" : "✗"}</Text>
    </View>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <Text style={s.sectionTitle}>{children}</Text>;
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

type Props = {
  inspection: Inspection & { photos: InspectionPhoto[] };
  logoPath?: string;
};

export function WellReportPDF({ inspection, logoPath }: Props) {
  const status = inspection.finalStatus;
  const statusColor = STATUS_COLOR[status] ?? C.muted;
  const statusBg = STATUS_BG[status] ?? C.bg;
  const statusBorder = STATUS_BORDER[status] ?? C.border;

  const generatedDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const inspectionDate = new Date(inspection.inspectionDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const propertyPhoto = inspection.photos.find((p) => p.label === "property_front");
  const otherPhotos = inspection.photos.filter((p) => p.label !== "property_front");

  const hasNotes =
    inspection.inspectorNotes ||
    inspection.requiredRepairs ||
    inspection.recommendedRepairs ||
    inspection.memberFacingSummary;

  return (
    <Document
      title={`Well Inspection Report — ${inspection.homeownerName}`}
      author="Welgard Operations"
      subject="Residential Well Inspection Report"
    >
      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 1 — Cover: Status + Member/Property + Inspection Source
          ══════════════════════════════════════════════════════════════════ */}
      <Page size="LETTER" style={s.page}>
        {/* Header */}
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
          {/* Property front photo */}
          {propertyPhoto ? (
            <Image src={propertyPhoto.url} style={s.coverPhoto} />
          ) : (
            <View
              style={[
                s.coverPhoto,
                {
                  backgroundColor: C.bg,
                  borderWidth: 1,
                  borderColor: C.border,
                  borderRadius: 6,
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <Text style={{ fontSize: 10, color: C.muted, fontStyle: "italic" }}>
                No image provided of the home.
              </Text>
            </View>
          )}

          {/* Status Banner */}
          <View
            wrap={false}
            style={[s.statusBanner, { backgroundColor: statusBg, borderWidth: 1.5, borderColor: statusBorder }]}
          >
            <View style={[s.statusCircle, { backgroundColor: statusColor }]}>
              <Text style={[s.statusCircleText, { color: C.white }]}>
                {status === "green" ? "✓" : status === "yellow" ? "!" : "✗"}
              </Text>
            </View>
            <View style={s.statusRight}>
              <Text style={[s.statusLabel, { color: statusColor }]}>
                {STATUS_LABELS[status] ?? status}
              </Text>
              <Text style={s.statusDesc}>{STATUS_DESCRIPTIONS[status]}</Text>
              {inspection.systemScore != null && (
                <Text style={s.statusScore}>
                  System evaluation score: {inspection.systemScore}/100
                  {inspection.finalStatus !== inspection.systemStatus &&
                    ` (system recommended: ${inspection.systemStatus})`}
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
              <DetailCell label="Owner Name" value={inspection.homeownerName} />
              <DetailCell label="Email" value={inspection.homeownerEmail} />
              <DetailCell label="Phone" value={inspection.homeownerPhone} />
              <DetailCell
                label="Property Address"
                value={[inspection.propertyAddress, inspection.city, inspection.state, inspection.zip]
                  .filter(Boolean)
                  .join(", ")}
              />
            </View>
          </View>

          {/* Inspection Source */}
          <View wrap={false} style={s.section}>
            <SectionTitle>Inspection Source</SectionTitle>
            <View style={s.grid2}>
              <DetailCell label="Inspector" value={inspection.inspectorName} />
              <DetailCell label="Company" value={inspection.inspectionCompany} />
              <DetailCell label="Inspection Date" value={inspectionDate} />
              <DetailCell label="Report ID" value={inspection.reportId} />
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Welgard Well Warranty Operations · {inspection.reportId ?? "Draft"}</Text>
          <Text style={s.footerText}>Confidential — For authorized use only</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 2 — Well System + Condition Assessment
          ══════════════════════════════════════════════════════════════════ */}
      <Page size="LETTER" style={s.page}>
        {/* Mini header */}
        <View style={s.miniHeader}>
          <Text style={s.miniHeaderText}>Well System & Condition Assessment</Text>
          <Text style={s.miniHeaderId}>{inspection.reportId ?? inspection.homeownerName}</Text>
        </View>

        <View style={s.body}>
          {/* Well System Details */}
          <View wrap={false} style={s.section}>
            <SectionTitle>Well System Details</SectionTitle>
            <View style={s.grid2}>
              <DetailCell label="Well Type" value={inspection.wellType} />
              <DetailCell label="Well Depth" value={inspection.wellDepthFt ? `${inspection.wellDepthFt} ft` : null} />
              <DetailCell label="Pump Type" value={inspection.pumpType} />
              <DetailCell label="Pump Age" value={inspection.pumpAgeYears != null ? `${inspection.pumpAgeYears} years` : null} />
              <DetailCell label="Pressure Tank Age" value={inspection.pressureTankAgeYears != null ? `${inspection.pressureTankAgeYears} years` : null} />
            </View>
          </View>

          {/* Condition Assessment */}
          <View style={s.section}>
            <SectionTitle>Condition Assessment</SectionTitle>

            {/* Physical ratings */}
            <View wrap={false}>
              <Text style={[s.cellLabel, { marginBottom: 6 }]}>Physical Condition Ratings</Text>
              <View style={s.pillRow}>
                <ConditionPill label="Casing" value={inspection.casingCondition} />
                <ConditionPill label="Well Cap" value={inspection.wellCapCondition} />
                <ConditionPill label="Wiring" value={inspection.wiringCondition} />
              </View>
            </View>

            {/* Operational checks */}
            <View wrap={false} style={{ marginTop: 8 }}>
              <Text style={[s.cellLabel, { marginBottom: 8 }]}>Operational Checks</Text>
              <View style={{ flexDirection: "row", gap: 24 }}>
                <View style={{ flex: 1 }}>
                  <CheckItem label="System Operational" ok={inspection.systemOperational} />
                  <CheckItem label="Pressure Within Range" ok={inspection.pressureOk} />
                  <CheckItem label="Flow Rate Acceptable" ok={inspection.flowOk} />
                  <CheckItem label="Site Clearance Met" ok={inspection.siteClearanceOk} />
                </View>
                <View style={{ flex: 1 }}>
                  <CheckItem label="No Visible Leaks" ok={!inspection.visibleLeaks} />
                  <CheckItem label="No Safety Issues" ok={!inspection.safetyIssues} />
                  <CheckItem label="No Contamination Risk" ok={!inspection.contaminationRisk} />
                </View>
              </View>
            </View>

            {/* Evaluation rationale */}
            {inspection.statusRationale.length > 0 && (
              <View wrap={false} style={{ marginTop: 12 }}>
                <Text style={[s.cellLabel, { marginBottom: 6 }]}>Evaluation Notes</Text>
                {inspection.statusRationale.map((note: string, i: number) => (
                  <View key={i} style={s.bulletRow}>
                    <View style={s.bulletDot} />
                    <Text style={s.bulletText}>{note}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Welgard Well Warranty Operations · {inspection.reportId ?? "Draft"}</Text>
          <Text style={s.footerText}>Confidential — For authorized use only</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE 3 — Notes, Photos & Disclaimer
          ══════════════════════════════════════════════════════════════════ */}
      <Page size="LETTER" style={s.page}>
        <View style={s.miniHeader}>
          <Text style={s.miniHeaderText}>Findings, Recommendations & Photos</Text>
          <Text style={s.miniHeaderId}>{inspection.reportId ?? inspection.homeownerName}</Text>
        </View>

        <View style={s.body}>
          {/* Notes & Findings */}
          {hasNotes && (
            <View style={s.section}>
              <SectionTitle>Findings & Recommendations</SectionTitle>

              {inspection.memberFacingSummary && (
                <View wrap={false} style={s.noteBox}>
                  <Text style={s.noteLabel}>Member Summary</Text>
                  <Text style={s.noteText}>{inspection.memberFacingSummary}</Text>
                </View>
              )}

              {inspection.requiredRepairs && (
                <View wrap={false} style={s.alertBox}>
                  <Text style={s.alertLabel}>Required Repairs</Text>
                  <Text style={s.alertText}>{inspection.requiredRepairs}</Text>
                </View>
              )}

              {inspection.recommendedRepairs && (
                <View wrap={false} style={s.noteBox}>
                  <Text style={s.noteLabel}>Recommended Repairs / Updates</Text>
                  <Text style={s.noteText}>{inspection.recommendedRepairs}</Text>
                </View>
              )}

              {inspection.inspectorNotes && (
                <View wrap={false} style={s.noteBox}>
                  <Text style={s.noteLabel}>Inspector Notes</Text>
                  <Text style={s.noteText}>{inspection.inspectorNotes}</Text>
                </View>
              )}
            </View>
          )}

          {/* Additional Photos (non-property-front) */}
          {otherPhotos.length > 0 && (
            <View wrap={false} style={s.section}>
              <SectionTitle>Inspection Photos</SectionTitle>
              <View style={s.photoGrid}>
                {otherPhotos.slice(0, 6).map((photo: { id: string; url: string; label: string | null }) => (
                  <View key={photo.id} style={s.photoItem}>
                    <Image src={photo.url} style={s.photoImg} />
                    <Text style={s.photoCaption}>{photo.label?.replace(/_/g, " ") ?? "Photo"}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Disclaimer */}
          <View wrap={false} style={s.disclaimer}>
            <Text style={s.disclaimerTitle}>Important Disclaimer</Text>
            <Text style={s.disclaimerText}>
              This report is based solely on the visible and accessible conditions observed during
              the inspection conducted on the date noted above. It does not constitute a guarantee
              of the well system&apos;s future performance, longevity, or suitability for any
              particular use. The inspection is limited to items and areas accessible at the time
              and does not include assessment of concealed, underground, or inaccessible
              components.{"\n\n"}
              Final coverage eligibility, participation decisions, and warranty terms remain
              subject to Welgard&apos;s standard review process and program guidelines. This
              report is intended for internal operational use and authorized member communication
              only. It should not be relied upon as a comprehensive engineering assessment or
              substitute for professional engineering consultation.
            </Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Welgard Well Warranty Operations · {inspection.reportId ?? "Draft"}</Text>
          <Text style={s.footerText}>Confidential — For authorized use only</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
