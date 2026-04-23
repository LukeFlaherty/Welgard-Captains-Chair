import React from "react";
import { Document, Page, View, Text, StyleSheet, Image } from "@react-pdf/renderer";
import {
  INSPECTION_SECTIONS,
  PHOTO_LABELS,
  getFieldsBySection,
  type FieldDef,
  type FieldSection,
} from "@/config/inspection-fields";

// ─── Brand Colors (matches well-report-template) ──────────────────────────────

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
  headerLogo: {
    width: 120,
    height: 36,
    objectFit: "contain",
  },
  headerTitle: {
    color: C.white,
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: "#b3cef0",
    fontSize: 9,
    marginTop: 2,
    textAlign: "right",
  },
  inspectorBar: {
    backgroundColor: C.brandLight,
    borderBottomWidth: 1,
    borderBottomColor: "#b3cef0",
    paddingHorizontal: 40,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 32,
  },
  inspectorBarItem: {
    flexDirection: "column",
    gap: 2,
    flex: 1,
  },
  inspectorBarLabel: {
    fontSize: 7,
    color: C.muted,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  inspectorBarValue: {
    fontSize: 9,
    color: C.text,
    borderBottomWidth: 1,
    borderBottomColor: C.lineColor,
    paddingBottom: 2,
    minWidth: 80,
  },
  body: {
    paddingHorizontal: 40,
    paddingTop: 20,
  },
  sectionHeader: {
    backgroundColor: C.brandDark,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 12,
    marginTop: 16,
  },
  sectionHeaderText: {
    color: C.white,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  fieldGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  fieldWrap: {
    flexDirection: "column",
    gap: 3,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: C.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldLabelRequired: {
    color: "#dc2626",
  },
  writeLine: {
    borderBottomWidth: 1,
    borderBottomColor: C.lineColor,
    height: 16,
  },
  writeLineFull: {
    borderBottomWidth: 1,
    borderBottomColor: C.lineColor,
    height: 16,
    marginTop: 4,
  },
  circleOneRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  circleOneLabel: {
    fontSize: 7,
    color: C.muted,
    fontStyle: "italic",
  },
  circleOption: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  circleOptionText: {
    fontSize: 8,
    color: C.textLight,
  },
  booleanRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingVertical: 6,
  },
  booleanLabelGroup: {
    flex: 1,
    flexDirection: "column",
    gap: 1,
  },
  booleanLabel: {
    fontSize: 8,
    color: C.text,
    fontFamily: "Helvetica-Bold",
  },
  booleanDescription: {
    fontSize: 7,
    color: C.muted,
    fontStyle: "italic",
  },
  booleanOptions: {
    flexDirection: "row",
    gap: 10,
  },
  booleanOption: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  booleanOptionText: {
    fontSize: 8,
    color: C.textLight,
  },
  textareaWrap: {
    flexDirection: "column",
    gap: 3,
    marginBottom: 12,
  },
  textareaLine: {
    borderBottomWidth: 1,
    borderBottomColor: C.lineColor,
    height: 18,
    marginTop: 2,
  },
  photoSection: {
    marginTop: 16,
  },
  photoCheckRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 2,
  },
  photoLabel: {
    fontSize: 8,
    color: C.text,
  },
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
  footerText: {
    fontSize: 7,
    color: C.muted,
  },
});

// ─── Field renderers ──────────────────────────────────────────────────────────

function TextField({ field, width }: { field: FieldDef; width: string | number }) {
  return (
    <View style={[s.fieldWrap, { width: width as number }]}>
      <Text style={s.fieldLabel}>
        {field.label}
        {field.required ? <Text style={s.fieldLabelRequired}> *</Text> : null}
      </Text>
      <View style={s.writeLine} />
    </View>
  );
}

function NumberField({ field, width }: { field: FieldDef; width: string | number }) {
  return (
    <View style={[s.fieldWrap, { width: width as number }]}>
      <Text style={s.fieldLabel}>{field.label}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 4 }}>
        <View style={[s.writeLine, { flex: 1 }]} />
        {field.unit ? <Text style={{ fontSize: 7, color: C.muted, marginBottom: 2 }}>{field.unit}</Text> : null}
      </View>
    </View>
  );
}

function SelectField({ field }: { field: FieldDef }) {
  return (
    <View style={[s.fieldWrap, { width: "100%" }]}>
      <Text style={s.fieldLabel}>{field.label}</Text>
      <View style={s.circleOneRow}>
        <Text style={s.circleOneLabel}>Circle one:</Text>
        {(field.options ?? []).map((opt) => (
          <View key={opt.value} style={s.circleOption}>
            <Text style={s.circleOptionText}>{opt.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function BooleanField({ field }: { field: FieldDef }) {
  return (
    <View style={s.booleanRow}>
      <View style={s.booleanLabelGroup}>
        <Text style={s.booleanLabel}>{field.label}</Text>
        {field.description ? <Text style={s.booleanDescription}>{field.description}</Text> : null}
      </View>
      <View style={s.booleanOptions}>
        <View style={s.booleanOption}><Text style={s.booleanOptionText}>Yes</Text></View>
        <View style={s.booleanOption}><Text style={s.booleanOptionText}>No</Text></View>
      </View>
    </View>
  );
}

function TextareaField({ field }: { field: FieldDef }) {
  const lines = field.printLines ?? 3;
  return (
    <View style={[s.textareaWrap, { width: "100%" }]}>
      <Text style={s.fieldLabel}>{field.label}</Text>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={s.textareaLine} />
      ))}
    </View>
  );
}

function renderField(field: FieldDef) {
  const halfWidth = "48%";
  const fullWidth = "100%";

  switch (field.type) {
    case "boolean":
      return <BooleanField key={field.key} field={field} />;
    case "textarea":
      return <TextareaField key={field.key} field={field} />;
    case "select":
      return <SelectField key={field.key} field={field} />;
    case "number":
      return <NumberField key={field.key} field={field} width={halfWidth} />;
    default:
      return <TextField key={field.key} field={field} width={field.required ? fullWidth : halfWidth} />;
  }
}

// ─── Section renderer ─────────────────────────────────────────────────────────

function SectionBlock({ section, fields }: { section: FieldSection; fields: FieldDef[] }) {
  if (fields.length === 0) return null;

  const boolFields = fields.filter((f) => f.type === "boolean");
  const nonBoolFields = fields.filter((f) => f.type !== "boolean");

  return (
    <View>
      <View style={s.sectionHeader}>
        <Text style={s.sectionHeaderText}>{section}</Text>
      </View>

      {/* Non-boolean fields in a wrapping flex row */}
      {nonBoolFields.length > 0 && (
        <View style={s.fieldGrid}>
          {nonBoolFields.map(renderField)}
        </View>
      )}

      {/* Boolean fields stacked as a checklist */}
      {boolFields.length > 0 && (
        <View style={{ marginTop: nonBoolFields.length > 0 ? 8 : 0 }}>
          {boolFields.map((f) => <BooleanField key={f.key} field={f} />)}
        </View>
      )}
    </View>
  );
}

// ─── Photos Checklist ─────────────────────────────────────────────────────────

function PhotosChecklist() {
  return (
    <View style={s.photoSection}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionHeaderText}>Photos Required</Text>
      </View>
      <Text style={{ fontSize: 7, color: C.muted, marginBottom: 8, fontStyle: "italic" }}>
        Check each photo as captured. Upload these when submitting the record digitally.
      </Text>
      {PHOTO_LABELS.map((p) => (
        <View key={p.key} style={s.photoCheckRow}>
          <View style={s.checkbox} />
          <Text style={s.photoLabel}>{p.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Document ─────────────────────────────────────────────────────────────────

type Props = {
  logoPath: string;
  inspector?: { name: string; company: string | null } | null;
};

export function BlankInspectionFormPDF({ logoPath, inspector }: Props) {
  const fieldsBySection = getFieldsBySection();

  return (
    <Document title="Welgard Well Inspection Form" author="Welgard">
      <Page size="LETTER" style={s.page}>
        {/* Header */}
        <View style={s.header} fixed>
          <Image src={logoPath} style={s.headerLogo} />
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.headerTitle}>WELL INSPECTION FORM</Text>
            <Text style={s.headerSubtitle}>Welgard Well Protection Program</Text>
          </View>
        </View>

        {/* Inspector info bar */}
        <View style={s.inspectorBar}>
          <View style={s.inspectorBarItem}>
            <Text style={s.inspectorBarLabel}>Inspector Name</Text>
            <Text style={s.inspectorBarValue}>
              {inspector?.name ?? ""}
            </Text>
          </View>
          <View style={s.inspectorBarItem}>
            <Text style={s.inspectorBarLabel}>Company</Text>
            <Text style={s.inspectorBarValue}>
              {inspector?.company ?? ""}
            </Text>
          </View>
          <View style={s.inspectorBarItem}>
            <Text style={s.inspectorBarLabel}>Inspection Date</Text>
            <Text style={s.inspectorBarValue}>{""}</Text>
          </View>
          <View style={s.inspectorBarItem}>
            <Text style={s.inspectorBarLabel}>Report ID</Text>
            <Text style={s.inspectorBarValue}>{""}</Text>
          </View>
        </View>

        {/* Body */}
        <View style={s.body}>
          {INSPECTION_SECTIONS.map((section) => (
            <SectionBlock
              key={section}
              section={section}
              fields={fieldsBySection[section]}
            />
          ))}
          <PhotosChecklist />
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>Welgard Well Protection Program — Confidential</Text>
          <Text style={s.footerText} render={({ pageNumber, totalPages }) =>
            `Page ${pageNumber} of ${totalPages}`
          } />
        </View>
      </Page>
    </Document>
  );
}
