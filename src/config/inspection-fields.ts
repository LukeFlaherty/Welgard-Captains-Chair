// Single source of truth for all inspection form fields.
// The blank printable PDF and the web form both derive from this config.
// When fields change, update here and both surfaces update automatically.

export type FieldType = "text" | "email" | "phone" | "number" | "date" | "select" | "boolean" | "textarea";

export type FieldSection =
  | "Member & Property"
  | "Inspection Source"
  | "Well System"
  | "Conditions"
  | "Notes & Findings"
  | "Review & Status";

export type SelectOption = { value: string; label: string };

export type FieldDef = {
  key: string;
  label: string;
  section: FieldSection;
  type: FieldType;
  required?: boolean;
  options?: SelectOption[];
  unit?: string;
  printLines?: number;
  description?: string;
  defaultTrue?: boolean; // for boolean fields: default state hint on printed form
};

export const INSPECTION_SECTIONS: FieldSection[] = [
  "Member & Property",
  "Inspection Source",
  "Well System",
  "Conditions",
  "Notes & Findings",
  "Review & Status",
];

export const CONDITION_OPTIONS: SelectOption[] = [
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

export const WELL_TYPE_OPTIONS: SelectOption[] = [
  { value: "drilled", label: "Drilled" },
  { value: "dug", label: "Dug" },
  { value: "bored", label: "Bored" },
  { value: "driven", label: "Driven Point" },
  { value: "artesian", label: "Artesian" },
  { value: "other", label: "Other" },
];

export const PUMP_TYPE_OPTIONS: SelectOption[] = [
  { value: "submersible", label: "Submersible" },
  { value: "jet", label: "Jet Pump" },
  { value: "hand", label: "Hand Pump" },
  { value: "other", label: "Other" },
];

export const ACTIVITY_OPTIONS: SelectOption[] = [
  { value: "Activation", label: "Activation" },
  { value: "Prospect", label: "Prospect" },
  { value: "Deactivation", label: "Deactivation" },
  { value: "Ineligible", label: "Ineligible" },
  { value: "New Member", label: "New Member" },
  { value: "Termination", label: "Termination" },
  { value: "Renew-Avail", label: "Renew-Avail" },
  { value: "Conversion Possible", label: "Conversion Possible" },
  { value: "Conversion Actual", label: "Conversion Actual" },
  { value: "Conversion Rate", label: "Conversion Rate" },
];

export const FINAL_STATUS_OPTIONS: SelectOption[] = [
  { value: "green", label: "Green — Approved" },
  { value: "yellow", label: "Yellow — Conditional" },
  { value: "red", label: "Red — Not Approved" },
];

export const INSPECTION_FIELDS: FieldDef[] = [
  // ── Member & Property ──────────────────────────────────────────────────────
  { key: "homeownerName",  label: "Owner Name",       section: "Member & Property", type: "text",  required: true },
  { key: "homeownerEmail", label: "Email",             section: "Member & Property", type: "email" },
  { key: "homeownerPhone", label: "Phone",             section: "Member & Property", type: "phone" },
  { key: "propertyAddress",label: "Property Address", section: "Member & Property", type: "text",  required: true },
  { key: "city",           label: "City",             section: "Member & Property", type: "text" },
  { key: "state",          label: "State",            section: "Member & Property", type: "text" },
  { key: "zip",            label: "ZIP Code",         section: "Member & Property", type: "text" },

  // ── Inspection Source ──────────────────────────────────────────────────────
  { key: "inspectorName",     label: "Inspector Name",     section: "Inspection Source", type: "text" },
  { key: "inspectionCompany", label: "Inspection Company", section: "Inspection Source", type: "text" },
  { key: "inspectionDate",    label: "Inspection Date",    section: "Inspection Source", type: "date", required: true },

  // ── Well System ────────────────────────────────────────────────────────────
  { key: "wellType",             label: "Well Type",             section: "Well System", type: "select",  options: WELL_TYPE_OPTIONS },
  { key: "wellDepthFt",          label: "Well Depth",            section: "Well System", type: "number",  unit: "ft" },
  { key: "pumpType",             label: "Pump Type",             section: "Well System", type: "select",  options: PUMP_TYPE_OPTIONS },
  { key: "pumpAgeYears",         label: "Pump Age",              section: "Well System", type: "number",  unit: "years" },
  { key: "pressureTankAgeYears", label: "Pressure Tank Age",     section: "Well System", type: "number",  unit: "years" },

  // ── Conditions ─────────────────────────────────────────────────────────────
  { key: "casingCondition",  label: "Casing Condition",  section: "Conditions", type: "select",  options: CONDITION_OPTIONS },
  { key: "wellCapCondition", label: "Well Cap Condition", section: "Conditions", type: "select",  options: CONDITION_OPTIONS },
  { key: "wiringCondition",  label: "Wiring Condition",  section: "Conditions", type: "select",  options: CONDITION_OPTIONS },
  {
    key: "safetyIssues",
    label: "Safety Issues Present",
    section: "Conditions",
    type: "boolean",
    description: "Immediate disqualifier for coverage",
    defaultTrue: false,
  },
  {
    key: "contaminationRisk",
    label: "Contamination Risk Identified",
    section: "Conditions",
    type: "boolean",
    description: "Immediate disqualifier for coverage",
    defaultTrue: false,
  },
  { key: "visibleLeaks",     label: "Visible Leaks Present",            section: "Conditions", type: "boolean", defaultTrue: false },
  {
    key: "systemOperational",
    label: "System Operational",
    section: "Conditions",
    type: "boolean",
    description: "Uncheck if non-operational — immediate disqualifier",
    defaultTrue: true,
  },
  { key: "pressureOk",      label: "Pressure Within Range",            section: "Conditions", type: "boolean", defaultTrue: true },
  { key: "flowOk",          label: "Flow Rate Acceptable",             section: "Conditions", type: "boolean", defaultTrue: true },
  { key: "siteClearanceOk", label: "Site Clearance Requirements Met",  section: "Conditions", type: "boolean", defaultTrue: true },

  // ── Notes & Findings ───────────────────────────────────────────────────────
  { key: "inspectorNotes",        label: "Inspector Notes",           section: "Notes & Findings", type: "textarea", printLines: 5 },
  { key: "internalReviewerNotes", label: "Internal Reviewer Notes",   section: "Notes & Findings", type: "textarea", printLines: 3 },
  { key: "requiredRepairs",       label: "Required Repairs",          section: "Notes & Findings", type: "textarea", printLines: 3 },
  { key: "recommendedRepairs",    label: "Recommended Repairs",       section: "Notes & Findings", type: "textarea", printLines: 3 },
  { key: "memberFacingSummary",   label: "Member-Facing Summary",     section: "Notes & Findings", type: "textarea", printLines: 4 },

  // ── Review & Status ────────────────────────────────────────────────────────
  { key: "activity",          label: "Activity Type",         section: "Review & Status", type: "select",  options: ACTIVITY_OPTIONS },
  { key: "finalStatus",       label: "Final Approval Status", section: "Review & Status", type: "select",  options: FINAL_STATUS_OPTIONS },
  { key: "overrideReason",    label: "Override Reason",       section: "Review & Status", type: "textarea", printLines: 3 },
  { key: "ghlContactId",      label: "GHL Contact ID",        section: "Review & Status", type: "text" },
  { key: "ghlOpportunityId",  label: "GHL Opportunity ID",    section: "Review & Status", type: "text" },
  { key: "ghlLocationId",     label: "GHL Location ID",       section: "Review & Status", type: "text" },
];

// Photos are excluded from the form PDF as input fields but listed as a checklist.
export const PHOTO_LABELS: { key: string; label: string }[] = [
  { key: "property_front",  label: "Property Front Photo" },
  { key: "well_head",       label: "Well Head Photo" },
  { key: "pressure_system", label: "Pressure System Photo" },
  { key: "additional",      label: "Additional Photo" },
];

export function getFieldsBySection(): Record<FieldSection, FieldDef[]> {
  const grouped = Object.fromEntries(INSPECTION_SECTIONS.map((s) => [s, [] as FieldDef[]])) as Record<FieldSection, FieldDef[]>;
  for (const field of INSPECTION_FIELDS) {
    grouped[field.section].push(field);
  }
  return grouped;
}
