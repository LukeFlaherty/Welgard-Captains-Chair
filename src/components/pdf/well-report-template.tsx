import React from "react";
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";
import type { Inspection, InspectionPhoto } from "@/generated/prisma";
import { STATUS_LABELS, STATUS_DESCRIPTIONS } from "@/lib/rules-engine";

// ─── Colors ───────────────────────────────────────────────────────────────────

const C = {
  navy: "#0f2340",
  navyLight: "#1a3a60",
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

const STATUS_COLOR: Record<string, string> = {
  green: C.green,
  yellow: C.yellow,
  red: C.red,
};
const STATUS_BG: Record<string, string> = {
  green: C.greenBg,
  yellow: C.yellowBg,
  red: C.redBg,
};
const STATUS_BORDER: Record<string, string> = {
  green: C.greenBorder,
  yellow: C.yellowBorder,
  red: C.redBorder,
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: C.white,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
    fontSize: 10,
    color: C.text,
  },
  // Header band
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 28,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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

  // Body padding
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

  // Section
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingBottom: 4,
    marginBottom: 10,
  },

  // Grid
  grid2: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 0,
  },
  gridCell: {
    width: "50%",
    paddingRight: 16,
    marginBottom: 8,
  },
  cellLabel: {
    fontSize: 7.5,
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1.5,
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
    marginBottom: 8,
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
  pillOk: { backgroundColor: C.greenBg, color: C.green },
  pillNotOk: { backgroundColor: C.redBg, color: C.red },

  // Check items table
  checkRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
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

  // Notes block
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

  // Alert box (required repairs)
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
    marginTop: 3,
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
    backgroundColor: C.bg,
    borderRadius: 6,
    padding: 12,
    marginTop: 8,
  },
  disclaimerTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  disclaimerText: {
    fontSize: 7.5,
    color: C.muted,
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
  const style =
    value === "good" ? s.pillGood : value === "fair" ? s.pillFair : value === "poor" ? s.pillPoor : null;
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
      <Text style={[s.checkValue, { color: ok ? C.green : C.red }]}>
        {ok ? "✓" : "✗"}
      </Text>
    </View>
  );
}

// ─── PDF Document ─────────────────────────────────────────────────────────────

type Props = {
  inspection: Inspection & { photos: InspectionPhoto[] };
};

export function WellReportPDF({ inspection }: Props) {
  const status = inspection.finalStatus;
  const statusColor = STATUS_COLOR[status] ?? C.muted;
  const statusBg = STATUS_BG[status] ?? C.bg;
  const statusBorder = STATUS_BORDER[status] ?? C.border;
  const generatedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const inspectionDate = new Date(inspection.inspectionDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document
      title={`Well Inspection Report — ${inspection.homeownerName}`}
      author="Welgard Operations"
      subject="Residential Well Inspection Report"
    >
      <Page size="LETTER" style={s.page}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerRow}>
            <View>
              <Text style={s.brandName}>Welgard</Text>
              <Text style={s.brandSub}>Well Warranty Operations</Text>
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
          {/* ── Status Banner ───────────────────────────────────────────── */}
          <View
            style={[
              s.statusBanner,
              {
                backgroundColor: statusBg,
                borderWidth: 1.5,
                borderColor: statusBorder,
              },
            ]}
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
              <Text style={s.statusDesc}>
                {STATUS_DESCRIPTIONS[status]}
              </Text>
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

          {/* ── Member & Property ───────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Member & Property</Text>
            <View style={s.grid2}>
              <DetailCell label="Owner Name" value={inspection.homeownerName} />
              <DetailCell label="Email" value={inspection.homeownerEmail} />
              <DetailCell label="Phone" value={inspection.homeownerPhone} />
              <DetailCell
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
            </View>
          </View>

          {/* ── Inspection Source ───────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Inspection Source</Text>
            <View style={s.grid2}>
              <DetailCell label="Inspector" value={inspection.inspectorName} />
              <DetailCell label="Company" value={inspection.inspectionCompany} />
              <DetailCell label="Inspection Date" value={inspectionDate} />
            </View>
          </View>

          {/* ── Well System ─────────────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Well System Details</Text>
            <View style={s.grid2}>
              <DetailCell label="Well Type" value={inspection.wellType} />
              <DetailCell
                label="Well Depth"
                value={inspection.wellDepthFt ? `${inspection.wellDepthFt} ft` : null}
              />
              <DetailCell label="Pump Type" value={inspection.pumpType} />
              <DetailCell
                label="Pump Age"
                value={inspection.pumpAgeYears ? `${inspection.pumpAgeYears} years` : null}
              />
              <DetailCell
                label="Pressure Tank Age"
                value={
                  inspection.pressureTankAgeYears
                    ? `${inspection.pressureTankAgeYears} years`
                    : null
                }
              />
            </View>
          </View>

          {/* ── Condition Assessment ────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Condition Assessment</Text>

            {/* Physical ratings */}
            <View style={s.pillRow}>
              <ConditionPill label="Casing" value={inspection.casingCondition} />
              <ConditionPill label="Well Cap" value={inspection.wellCapCondition} />
              <ConditionPill label="Wiring" value={inspection.wiringCondition} />
            </View>

            {/* Operational checks — two column layout */}
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

            {/* Evaluation rationale */}
            {inspection.statusRationale.length > 0 && (
              <View style={{ marginTop: 8 }}>
                <Text style={[s.cellLabel, { marginBottom: 4 }]}>Evaluation Notes</Text>
                {inspection.statusRationale.map((note: string, i: number) => (
                  <View key={i} style={s.bulletRow}>
                    <View style={s.bulletDot} />
                    <Text style={s.bulletText}>{note}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Notes & Findings ────────────────────────────────────────── */}
          {(inspection.inspectorNotes ||
            inspection.requiredRepairs ||
            inspection.recommendedRepairs ||
            inspection.memberFacingSummary) && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Findings & Recommendations</Text>

              {inspection.memberFacingSummary && (
                <View style={s.noteBox}>
                  <Text style={s.noteLabel}>Summary</Text>
                  <Text style={s.noteText}>{inspection.memberFacingSummary}</Text>
                </View>
              )}

              {inspection.requiredRepairs && (
                <View style={s.alertBox}>
                  <Text style={s.alertLabel}>Required Repairs</Text>
                  <Text style={s.alertText}>{inspection.requiredRepairs}</Text>
                </View>
              )}

              {inspection.recommendedRepairs && (
                <View style={s.noteBox}>
                  <Text style={s.noteLabel}>Recommended Repairs / Updates</Text>
                  <Text style={s.noteText}>{inspection.recommendedRepairs}</Text>
                </View>
              )}

              {inspection.inspectorNotes && (
                <View style={s.noteBox}>
                  <Text style={s.noteLabel}>Inspector Notes</Text>
                  <Text style={s.noteText}>{inspection.inspectorNotes}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Photos ──────────────────────────────────────────────────── */}
          {inspection.photos.length > 0 && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Inspection Photos</Text>
              <View style={s.photoGrid}>
                {inspection.photos.slice(0, 6).map((photo: { id: string; url: string; label: string | null }) => (
                  <View key={photo.id} style={s.photoItem}>
                    <Image src={photo.url} style={s.photoImg} />
                    <Text style={s.photoCaption}>
                      {photo.label?.replace(/_/g, " ") ?? "Photo"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Disclaimer ──────────────────────────────────────────────── */}
          <View style={s.disclaimer}>
            <Text style={s.disclaimerTitle}>Important Disclaimer</Text>
            <Text style={s.disclaimerText}>
              This report is based solely on the visible and accessible conditions
              observed during the inspection conducted on the date noted above. It does
              not constitute a guarantee of the well system&apos;s future performance,
              longevity, or suitability for any particular use. The inspection is
              limited to the items and areas accessible at the time of inspection and
              does not include assessment of concealed, underground, or inaccessible
              components.{"\n\n"}
              Final coverage eligibility, participation decisions, and warranty terms
              remain subject to Welgard&apos;s standard review process and program
              guidelines. This report is intended for internal operational use and
              authorized member communication only. It should not be relied upon as a
              comprehensive engineering assessment or substitute for professional
              engineering consultation.
            </Text>
          </View>
        </View>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Welgard Well Warranty Operations · {inspection.reportId ?? "Draft"}
          </Text>
          <Text style={s.footerText}>
            Confidential — For authorized use only
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}
