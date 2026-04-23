import React from "react";
import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import {
  WELL_TYPE_OPTIONS,
  PUMP_TYPE_OPTIONS,
  WELL_OBSTRUCTION_OPTIONS,
  WELL_CAP_OPTIONS,
  TANK_CONDITION_OPTIONS,
  CONTROL_BOX_OPTIONS,
  PRESSURE_COMPONENT_OPTIONS,
  PHOTO_LABELS,
} from "@/config/inspection-fields";

// ─── Brand Colors ─────────────────────────────────────────────────────────────

const C = {
  brand: "#2060ad",
  brandDark: "#174a8a",
  brandLight: "#e8f0fb",
  muted: "#6b7280",
  border: "#d1d5db",
  text: "#111827",
  textLight: "#374151",
  white: "#ffffff",
  lineColor: "#9ca3af",
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: C.white,
    paddingTop: 0,
    paddingBottom: 48,
    paddingHorizontal: 0,
    fontSize: 9,
    color: C.text,
  },
  header: {
    backgroundColor: C.brand,
    paddingHorizontal: 40,
    paddingTop: 24,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: C.white, fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  headerSubtitle: { color: "#b3cef0", fontSize: 9, marginTop: 2 },
  inspectorBar: {
    backgroundColor: C.brandLight,
    borderBottomWidth: 1,
    borderBottomColor: "#b3cef0",
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 32,
  },
  inspectorBarItem: { flexDirection: "column", gap: 2, flex: 1 },
  inspectorBarLabel: { fontSize: 7, color: C.muted, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.5 },
  inspectorBarValue: { fontSize: 9, color: C.text, borderBottomWidth: 1, borderBottomColor: C.lineColor, paddingBottom: 2, minWidth: 80 },
  body: { paddingHorizontal: 40, paddingTop: 20 },
  sectionHeader: {
    backgroundColor: C.brandDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
    marginTop: 16,
  },
  sectionHeaderText: { color: C.white, fontSize: 9, fontFamily: "Helvetica-Bold", textTransform: "uppercase", letterSpacing: 0.8 },
  fieldGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  fieldWrap: { flexDirection: "column", gap: 3, marginBottom: 10 },
  fieldLabel: { fontSize: 7, fontFamily: "Helvetica-Bold", color: C.muted, textTransform: "uppercase", letterSpacing: 0.5 },
  writeLine: { borderBottomWidth: 1, borderBottomColor: C.lineColor, height: 16 },
  circleOneRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 2 },
  circleOneLabel: { fontSize: 7, color: C.muted, fontStyle: "italic" },
  circleOption: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 3 },
  circleOptionText: { fontSize: 8, color: C.textLight },
  booleanRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
  },
  booleanLabel: { fontSize: 8, color: C.text, fontFamily: "Helvetica-Bold", flex: 1 },
  booleanOptions: { flexDirection: "row", gap: 10 },
  booleanOption: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  booleanOptionText: { fontSize: 8, color: C.textLight },
  textareaLine: { borderBottomWidth: 1, borderBottomColor: C.lineColor, height: 18, marginTop: 2 },
  noteBox: { fontSize: 7.5, color: C.muted, fontStyle: "italic", marginBottom: 8 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1.5, borderBottomColor: C.brandDark, paddingBottom: 4, marginBottom: 3 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: C.border, paddingVertical: 6 },
  tableCell: { fontSize: 8, color: C.muted, textTransform: "uppercase", letterSpacing: 0.4, fontFamily: "Helvetica-Bold" },
  tableValueLine: { borderBottomWidth: 1, borderBottomColor: C.lineColor, flex: 1, height: 14 },
  photoCheckRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  checkbox: { width: 12, height: 12, borderWidth: 1, borderColor: C.border, borderRadius: 2 },
  photoLabel: { fontSize: 8, color: C.text },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7, color: C.muted },
});

// ─── Shared field primitives ──────────────────────────────────────────────────

function WriteField({ label, width, unit }: { label: string; width: string | number; unit?: string }) {
  return (
    <View style={[s.fieldWrap, { width: width as number }]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
        <View style={[s.writeLine, { flex: 1 }]} />
        {unit && <Text style={{ fontSize: 7, color: C.muted, marginBottom: 2 }}>{unit}</Text>}
      </View>
    </View>
  );
}

function SelectField({ label, options }: { label: string; options: { value: string; label: string }[] }) {
  return (
    <View style={[s.fieldWrap, { width: "100%" }]}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.circleOneRow}>
        <Text style={s.circleOneLabel}>Circle one:</Text>
        {options.map((opt) => (
          <View key={opt.value} style={s.circleOption}>
            <Text style={s.circleOptionText}>{opt.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BoolField({ label }: { label: string }) {
  return (
    <View style={s.booleanRow}>
      <Text style={s.booleanLabel}>{label}</Text>
      <View style={s.booleanOptions}>
        <View style={s.booleanOption}><Text style={s.booleanOptionText}>Yes</Text></View>
        <View style={s.booleanOption}><Text style={s.booleanOptionText}>No</Text></View>
      </View>
    </View>
  );
}

function TextareaLines({ label, lines = 3 }: { label: string; lines?: number }) {
  return (
    <View style={[s.fieldWrap, { width: "100%", marginBottom: 14 }]}>
      <Text style={s.fieldLabel}>{label}</Text>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={s.textareaLine} />
      ))}
    </View>
  );
}

function SectionHead({ children }: { children: string }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionHeaderText}>{children}</Text>
    </View>
  );
}

// ─── Blank Form Props ─────────────────────────────────────────────────────────

type BlankFormProps = {
  inspector?: { name: string; company: string | null } | null;
  logoPath?: string;
};

// ─── PDF Document ─────────────────────────────────────────────────────────────

export function BlankInspectionFormPDF({ inspector, logoPath }: BlankFormProps) {
  return (
    <Document title="Welgard Well Inspection — Blank Form" author="Welgard Operations">
      {/* ══════════════════════════════════════════════════════════
          PAGE 1 — Member/Property + Well System + External Equip
          ══════════════════════════════════════════════════════ */}
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          {logoPath && <Image src={logoPath} style={{ width: 120, height: 36, objectFit: "contain" }} />}
          <View>
            <Text style={s.headerTitle}>Well Inspection Form</Text>
            <Text style={s.headerSubtitle}>Complete all sections. Inspector to retain a copy.</Text>
          </View>
        </View>

        {/* Inspector bar */}
        <View style={s.inspectorBar}>
          <View style={s.inspectorBarItem}>
            <Text style={s.inspectorBarLabel}>Inspector Name</Text>
            <Text style={s.inspectorBarValue}>{inspector?.name ?? " "}</Text>
          </View>
          <View style={s.inspectorBarItem}>
            <Text style={s.inspectorBarLabel}>Company</Text>
            <Text style={s.inspectorBarValue}>{inspector?.company ?? " "}</Text>
          </View>
          <View style={s.inspectorBarItem}>
            <Text style={s.inspectorBarLabel}>Inspection Date</Text>
            <Text style={s.inspectorBarValue}> </Text>
          </View>
        </View>

        <View style={s.body}>
          {/* Member & Property */}
          <SectionHead>Member & Property</SectionHead>
          <View style={s.fieldGrid}>
            <WriteField label="Owner Name *" width="100%" />
            <WriteField label="Email" width="48%" />
            <WriteField label="Phone" width="48%" />
            <WriteField label="Property Address *" width="100%" />
            <WriteField label="City" width="48%" />
            <WriteField label="State" width="20%" />
            <WriteField label="ZIP Code" width="25%" />
          </View>

          {/* Well System */}
          <SectionHead>Well System</SectionHead>
          <View style={[s.fieldGrid, { marginBottom: 4 }]}>
            <SelectField label="Well Type" options={WELL_TYPE_OPTIONS} />
          </View>
          <View style={s.fieldGrid}>
            <WriteField label="Well Depth (ft)" width="40%" unit="ft" />
            <View style={[s.fieldWrap, { width: "55%" }]}>
              <Text style={s.fieldLabel}>Or check if unknown</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
                <View style={s.checkbox} />
                <Text style={{ fontSize: 8, color: C.text }}>Depth Unknown</Text>
              </View>
            </View>
            <SelectField label="Pump Type" options={PUMP_TYPE_OPTIONS} />
          </View>

          {/* External Equipment */}
          <SectionHead>External Equipment</SectionHead>
          <View style={s.fieldGrid}>
            <SelectField label="Well Obstructions" options={WELL_OBSTRUCTION_OPTIONS} />
            <SelectField label="Well Cap" options={WELL_CAP_OPTIONS} />
            <WriteField label="Height of Casing Above Ground" width="48%" unit="in" />
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Welgard Well Inspection Form — Blank</Text>
          <Text style={s.footerText}>Inspector Copy</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ══════════════════════════════════════════════════════════
          PAGE 2 — Internal Equipment + Cycle Test
          ══════════════════════════════════════════════════════ */}
      <Page size="LETTER" style={s.page}>
        <View style={[s.header, { paddingTop: 12, paddingBottom: 12 }]}>
          <Text style={s.headerTitle}>Well Inspection Form — Internal Equipment & Cycle Test</Text>
        </View>

        <View style={s.body}>
          {/* Internal Equipment */}
          <SectionHead>Internal Equipment</SectionHead>
          <BoolField label="Constant Pressure System" />
          <View style={s.fieldGrid}>
            <WriteField label="Amperage Reading" width="40%" unit="amps" />
            <SelectField label="Tank Condition" options={TANK_CONDITION_OPTIONS} />
            <SelectField label="Control Box Condition" options={CONTROL_BOX_OPTIONS} />
            <SelectField label="Pressure Switch" options={PRESSURE_COMPONENT_OPTIONS} />
            <SelectField label="Pressure Gauge" options={PRESSURE_COMPONENT_OPTIONS} />
          </View>
          <Text style={s.noteBox}>
            Note: When Constant Pressure System = Yes, Pressure Switch, Pressure Gauge, and Cycle Time automatically pass.
          </Text>

          {/* Cycle Test */}
          <SectionHead>Cycle Test</SectionHead>
          <Text style={[s.noteBox, { marginTop: 4 }]}>
            Cycle Time = Seconds to High Reading + Seconds to Low Reading. Valid range: 30–420 seconds.
          </Text>
          <View style={s.fieldGrid}>
            <WriteField label="Seconds to High Reading" width="48%" unit="sec" />
            <WriteField label="Seconds to Low Reading"  width="48%" unit="sec" />
            <WriteField label="Cycle Time (computed)"   width="48%" unit="sec" />
          </View>

          {/* Notes — first half */}
          <SectionHead>Inspector Notes</SectionHead>
          <TextareaLines label="Inspector observations and findings" lines={6} />
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Welgard Well Inspection Form — Blank</Text>
          <Text style={s.footerText}>Inspector Copy</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>

      {/* ══════════════════════════════════════════════════════════
          PAGE 3 — Yield Tests Table (6 rows)
          ══════════════════════════════════════════════════════ */}
      <Page size="LETTER" style={s.page}>
        <View style={[s.header, { paddingTop: 12, paddingBottom: 12 }]}>
          <Text style={s.headerTitle}>Well Inspection Form — Yield Tests</Text>
        </View>

        <View style={s.body}>
          <SectionHead>Yield Test Data</SectionHead>
          <Text style={[s.noteBox, { marginTop: 4 }]}>
            Record up to 6 sequential pump tests. All tests assumed same day. Start Time in HH:MM format.
            Well Yield ≥ 1.0 gpm, Total Gallons ≥ 350, and Avg Min to 350 Gal ≤ 120 min required to pass.
          </Text>

          {/* Table header */}
          <View style={s.tableHeader}>
            <Text style={[s.tableCell, { width: 36 }]}>Test #</Text>
            <Text style={[s.tableCell, { width: 70 }]}>Start Time</Text>
            <Text style={[s.tableCell, { flex: 1 }]}>Total Gallons</Text>
            <Text style={[s.tableCell, { flex: 1 }]}>Sec to Fill 5-Gal Bucket</Text>
          </View>

          {/* 6 rows */}
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <View key={n} style={s.tableRow}>
              <Text style={{ fontSize: 10, fontFamily: "Helvetica-Bold", width: 36, color: C.brand }}>{n}</Text>
              <View style={[s.tableValueLine, { width: 70, marginRight: 12 }]} />
              <View style={[s.tableValueLine, { marginRight: 12 }]} />
              <View style={s.tableValueLine} />
            </View>
          ))}

          {/* Computed results area */}
          <View style={{ marginTop: 24 }}>
            <SectionHead>Computed Results (office use)</SectionHead>
            <View style={s.fieldGrid}>
              <WriteField label="Well Yield (gpm)" width="40%" unit="gpm" />
              <WriteField label="Total Gallons (last test)" width="48%" unit="gal" />
              <WriteField label="Avg Min to 350 Gallons" width="48%" unit="min" />
              <WriteField label="Gallons Per Day" width="40%" unit="gal/day" />
            </View>
          </View>

          {/* Required/Recommended Repairs */}
          <SectionHead>Required & Recommended Repairs</SectionHead>
          <TextareaLines label="Required Repairs (must be completed before coverage)" lines={4} />
          <TextareaLines label="Recommended Repairs / Updates" lines={3} />

          {/* Photo checklist */}
          <SectionHead>Photo Checklist</SectionHead>
          {PHOTO_LABELS.map(({ key, label }) => (
            <View key={key} style={s.photoCheckRow}>
              <View style={s.checkbox} />
              <Text style={s.photoLabel}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>Welgard Well Inspection Form — Blank</Text>
          <Text style={s.footerText}>Inspector Copy</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}
