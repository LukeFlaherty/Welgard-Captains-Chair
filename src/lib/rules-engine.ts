// Tier/status metadata used across the app.
// Calculation logic has moved to src/lib/inspection-calc.ts.

export const STATUS_LABELS: Record<string, string> = {
  green:  "Premium",
  yellow: "Superior",
  red:    "Standard",
};

export const TIER_LABELS: Record<string, string> = {
  premium:  "Premium",
  superior: "Superior",
  standard: "Standard",
};

export const STATUS_DESCRIPTIONS: Record<string, string> = {
  green:
    "All inspection categories pass and the well meets eligibility criteria for WelGard Premium coverage.",
  yellow:
    "Major inspection items pass, but one or more minor criteria need attention. The well qualifies for WelGard Superior coverage.",
  red:
    "One or more major inspection criteria need attention. The well does not currently qualify for WelGard Superior or Premium coverage. Required items must be addressed before coverage can be offered.",
};

export const CATEGORY_LABELS = {
  externalEquipment: "External Equipment",
  internalEquipment: "Internal Equipment",
  cycleTime:         "Cycle Time",
  wellYield:         "Well Yield",
} as const;
