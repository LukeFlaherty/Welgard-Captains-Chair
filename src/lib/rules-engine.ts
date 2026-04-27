// Tier/status metadata used across the app.
// Calculation logic has moved to src/lib/inspection-calc.ts.

// "red" = Standard (DB-compatible with legacy records); "ineligible" = new Ineligible tier.
// UI renders "red" as blue and "ineligible" as red.
export const STATUS_LABELS: Record<string, string> = {
  green:      "Premium",
  yellow:     "Superior",
  red:        "Standard",
  ineligible: "Ineligible",
};

export const TIER_LABELS: Record<string, string> = {
  premium:    "Premium",
  superior:   "Superior",
  standard:   "Standard",
  ineligible: "Ineligible",
};

export const STATUS_DESCRIPTIONS: Record<string, string> = {
  green:
    "All inspection categories pass and the well meets eligibility criteria for WelGard Premium coverage.",
  yellow:
    "Major inspection items pass, but one or more minor criteria need attention. The well qualifies for WelGard Superior coverage.",
  red:
    "One or more external criteria need attention, but all major items pass. The well does not qualify for Superior or Premium at this time. Addressing the flagged items may open eligibility.",
  ineligible:
    "One or more major inspection criteria have failed, or the member's state is not eligible for WelGard programs. Coverage cannot be offered under current conditions.",
};

export const CATEGORY_LABELS = {
  externalEquipment: "External Equipment",
  internalEquipment: "Internal Equipment",
  cycleTime:         "Cycle Time",
  wellYield:         "Well Yield",
} as const;
