// Single source of truth for inspection form option sets.
// The blank printable PDF derives from these where applicable.

export type SelectOption = { value: string; label: string };

// ─── Well System ──────────────────────────────────────────────────────────────

export const WELL_TYPE_OPTIONS: SelectOption[] = [
  { value: "drilled",      label: "Drilled" },
  { value: "bored",        label: "Bored" },
  { value: "hand_dug",     label: "Hand Dug" },
  { value: "stick",        label: "Stick" },
  { value: "artesian",     label: "Artesian" },
  { value: "driven_point", label: "Driven Point" },
  { value: "other",        label: "Other" },
];

export const PUMP_TYPE_OPTIONS: SelectOption[] = [
  { value: "submersible", label: "Submersible" },
  { value: "jet",         label: "Jet Pump" },
  { value: "hand",        label: "Hand Pump" },
  { value: "other",       label: "Other" },
];

// ─── External Equipment ───────────────────────────────────────────────────────

export const WELL_OBSTRUCTION_OPTIONS: SelectOption[] = [
  { value: "none",        label: "None" },
  { value: "ornamental",  label: "Ornamental" },
  { value: "vegetation",  label: "Vegetation / Overgrowth" },
  { value: "debris",      label: "Debris / Objects" },
  { value: "structural",  label: "Structural Obstruction" },
  { value: "other",       label: "Other" },
];

export const WELL_CAP_OPTIONS: SelectOption[] = [
  { value: "sealed_contamination_resistant", label: "Sealed / Contamination Resistant" },
  { value: "bored_well",                     label: "Bored Well" },
  { value: "not_applicable_buried",          label: "Not Applicable / Buried" },
  { value: "secured_bolted",                 label: "Secured / Bolted" },
  { value: "unsecured_open",                 label: "Unsecured / Open" },
  { value: "missing_damaged",                label: "Missing / Damaged" },
];

// ─── Internal Equipment ───────────────────────────────────────────────────────

export const TANK_CONDITION_OPTIONS: SelectOption[] = [
  { value: "good",   label: "Good" },
  { value: "fair",   label: "Fair" },
  { value: "poor",   label: "Poor" },
  { value: "failed", label: "Failed / Non-functional" },
];

export const CONTROL_BOX_OPTIONS: SelectOption[] = [
  { value: "ok",        label: "OK" },
  { value: "not_present", label: "Not Present" },
  { value: "damaged",   label: "Damaged / Non-functional" },
];

export const PRESSURE_COMPONENT_OPTIONS: SelectOption[] = [
  { value: "visibly_present_intact", label: "Visibly Present / Intact" },
  { value: "not_present",            label: "Not Present / Not Visible" },
  { value: "damaged",                label: "Damaged / Non-functional" },
];

// ─── Review & Status ──────────────────────────────────────────────────────────

export const ACTIVITY_OPTIONS: SelectOption[] = [
  { value: "Activation",          label: "Activation" },
  { value: "Prospect",            label: "Prospect" },
  { value: "Deactivation",        label: "Deactivation" },
  { value: "Ineligible",          label: "Ineligible" },
  { value: "New Member",          label: "New Member" },
  { value: "Termination",         label: "Termination" },
  { value: "Renew-Avail",         label: "Renew-Avail" },
  { value: "Conversion Possible", label: "Conversion Possible" },
  { value: "Conversion Actual",   label: "Conversion Actual" },
  { value: "Conversion Rate",     label: "Conversion Rate" },
];

export const FINAL_STATUS_OPTIONS: SelectOption[] = [
  { value: "green",  label: "Green — Approved" },
  { value: "yellow", label: "Yellow — Conditional" },
  { value: "red",    label: "Red — Not Approved" },
];

// ─── Photos ───────────────────────────────────────────────────────────────────

export const PHOTO_LABELS: { key: string; label: string }[] = [
  { key: "property_front",  label: "Property Front Photo" },
  { key: "well_head",       label: "Well Head Photo" },
  { key: "pressure_system", label: "Pressure System Photo" },
  { key: "additional",      label: "Additional Photo" },
];

// ─── Human-readable label helpers ────────────────────────────────────────────

function labelFrom(options: SelectOption[], value: string | null | undefined): string {
  if (!value) return "—";
  return options.find((o) => o.value === value)?.label ?? value;
}

export const wellTypeLabel    = (v: string | null | undefined) => labelFrom(WELL_TYPE_OPTIONS, v);
export const pumpTypeLabel    = (v: string | null | undefined) => labelFrom(PUMP_TYPE_OPTIONS, v);
export const obstructionLabel = (v: string | null | undefined) => labelFrom(WELL_OBSTRUCTION_OPTIONS, v);
export const wellCapLabel     = (v: string | null | undefined) => labelFrom(WELL_CAP_OPTIONS, v);
export const tankCondLabel    = (v: string | null | undefined) => labelFrom(TANK_CONDITION_OPTIONS, v);
export const controlBoxLabel  = (v: string | null | undefined) => labelFrom(CONTROL_BOX_OPTIONS, v);
export const pressureCompLabel = (v: string | null | undefined) => labelFrom(PRESSURE_COMPONENT_OPTIONS, v);
