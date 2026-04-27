// Pure calculation engine for well inspection approval logic.
// No server-only imports — used both client-side (live preview) and server-side (on save).

export type YieldTestInput = {
  testNumber: number;
  startTime?: string | null;       // "HH:MM"
  totalGallons?: number | null;
  secondsToFillBucket?: number | null;
};

export type InspectionCalcInput = {
  wellType?: string | null;
  wellDepthFt?: number | null;
  wellDepthUnknown: boolean;
  wellObstructions?: string | null;
  wellCap?: string | null;
  casingHeightInches?: number | null;
  amperageReading?: number | null;
  tankCondition?: string | null;
  controlBoxCondition?: string | null;
  pressureSwitch?: string | null;
  pressureGauge?: string | null;
  constantPressureSystem: boolean;
  secondsToHighReading?: number | null;
  secondsToLowReading?: number | null;
  wellCalculationVersion: number;
  state?: string | null;
  yieldTests: YieldTestInput[];
};

export type CategoryStatus = "pass" | "needs_attention" | null; // null = indeterminate (missing data)

export type MembershipTier = "premium" | "superior" | "standard" | "ineligible";

export type CalcResult = {
  cycleTime: number | null;
  wellYieldGpm: number | null;
  totalGallons: number | null;
  avgMinutesToReach350: number | null;
  gallonsPerDay: number | null;
  externalEquipmentStatus: CategoryStatus;
  internalEquipmentStatus: CategoryStatus;
  cycleTimeStatus: CategoryStatus;
  wellYieldStatus: CategoryStatus;
  eligibleForSuperior: boolean | null;
  membershipTier: MembershipTier | null;
  systemStatus: "green" | "yellow" | "red" | "ineligible";
  statusRationale: string[];
};

// ─── Constants ────────────────────────────────────────────────────────────────

const EXTERNAL_WELL_TYPE_PASS = ["drilled", "bored"];

const EXTERNAL_WELL_OBSTRUCTION_PASS = ["none", "ornamental"];

const EXTERNAL_WELL_CAP_PASS = [
  "sealed_contamination_resistant",
  "bored_well",
  "not_applicable_buried",
  "secured_bolted",
];

// Well types that trigger Needs Attention for the Superior eligibility minor check
const SUPERIOR_MINOR_FAIL_WELL_TYPES = ["hand_dug", "stick", "other"];

// States where WelGard does not offer Superior (Navigator Pro only)
const SUPERIOR_INELIGIBLE_STATES = ["CA", "TX", "FL"];

// ─── Time helpers ──────────────────────────────────────────────────────────────

function parseTimeMinutes(time: string): number {
  const parts = time.split(":");
  if (parts.length !== 2) return NaN;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
}

// ─── Yield calculation helpers ────────────────────────────────────────────────

function sortedValidTests(tests: YieldTestInput[]): YieldTestInput[] {
  // secondsToFillBucket is NOT required here — it is only needed by calcAvgMinutesToReach350,
  // which checks it explicitly. The interval yield calculation only needs startTime + totalGallons.
  return [...tests]
    .filter((t) => t.startTime && t.totalGallons != null)
    .sort((a, b) => a.testNumber - b.testNumber);
}

function minutesBetween(t1: string, t2: string): number {
  return parseTimeMinutes(t2) - parseTimeMinutes(t1);
}

function individualYield(t1: YieldTestInput, t2: YieldTestInput): number | null {
  if (!t1.startTime || !t2.startTime) return null;
  if (t1.totalGallons == null || t2.totalGallons == null) return null;
  const mins = minutesBetween(t1.startTime, t2.startTime);
  if (isNaN(mins) || mins <= 0) return null;
  return (t2.totalGallons - t1.totalGallons) / mins;
}

function calcWellYieldV1(tests: YieldTestInput[]): number | null {
  const valid = sortedValidTests(tests);
  if (valid.length < 2) return null;
  return individualYield(valid[valid.length - 2], valid[valid.length - 1]);
}

function calcWellYieldV2(tests: YieldTestInput[]): number | null {
  const valid = sortedValidTests(tests);
  if (valid.length < 2) return null;

  const yields: number[] = [];
  for (let i = 1; i < valid.length; i++) {
    const y = individualYield(valid[i - 1], valid[i]);
    if (y === null) return null; // gap in data = indeterminate
    yields.push(y);
  }

  if (yields.length === 1) return yields[0];

  const lastWeight = 0.80;
  const priorWeight = 0.20 / (yields.length - 1);
  const lastYield = yields[yields.length - 1];
  const priorYields = yields.slice(0, -1);

  return lastYield * lastWeight + priorYields.reduce((sum, y) => sum + y * priorWeight, 0);
}

export function calcTotalGallons(tests: YieldTestInput[]): number | null {
  const withGallons = tests
    .filter((t) => t.totalGallons != null)
    .sort((a, b) => a.testNumber - b.testNumber);
  if (withGallons.length === 0) return null;
  return withGallons[withGallons.length - 1].totalGallons!;
}

export function calcAvgMinutesToReach350(tests: YieldTestInput[]): number | null {
  const sorted = [...tests].sort((a, b) => a.testNumber - b.testNumber);
  if (sorted.length < 2) return null;

  const test1 = sorted[0];
  if (!test1.startTime) return null;

  // First of tests 2–6 where totalGallons >= 350
  const testX = sorted.slice(1).find((t) => t.totalGallons != null && t.totalGallons >= 350);
  if (!testX) return null; // no test reached 350 gallons
  if (!testX.startTime || testX.totalGallons == null || testX.secondsToFillBucket == null) return null;

  const mins = minutesBetween(test1.startTime, testX.startTime);
  if (isNaN(mins) || mins < 0) return null;

  const totalMinutes = mins + testX.secondsToFillBucket / 60;
  if (totalMinutes <= 0) return null;

  return 350 / (testX.totalGallons / totalMinutes);
}

// ─── Category status calculations ─────────────────────────────────────────────

function calcExternalEquipmentStatus(input: InspectionCalcInput): CategoryStatus {
  const { wellType, wellObstructions, wellCap, casingHeightInches, wellDepthFt, wellDepthUnknown } = input;

  if (!wellType || !wellObstructions || !wellCap || casingHeightInches == null) return null;
  if (!wellDepthUnknown && wellDepthFt == null) return null;

  const wellTypeOk = EXTERNAL_WELL_TYPE_PASS.includes(wellType);
  const obstructionOk = EXTERNAL_WELL_OBSTRUCTION_PASS.includes(wellObstructions);
  const wellCapOk = EXTERNAL_WELL_CAP_PASS.includes(wellCap);
  const casingOk = casingHeightInches > 6;

  let depthOk: boolean;
  if (wellDepthUnknown) {
    depthOk = true; // Unknown depth passes
  } else {
    const d = wellDepthFt!;
    depthOk = d < 100 || (d >= 100 && d <= 500); // > 500 fails
  }

  return wellTypeOk && obstructionOk && wellCapOk && casingOk && depthOk ? "pass" : "needs_attention";
}

function calcInternalEquipmentStatus(input: InspectionCalcInput): CategoryStatus {
  const {
    amperageReading,
    tankCondition,
    controlBoxCondition,
    pressureSwitch,
    pressureGauge,
    constantPressureSystem,
  } = input;

  if (amperageReading == null || !tankCondition || !controlBoxCondition) return null;
  if (!constantPressureSystem && (!pressureSwitch || !pressureGauge)) return null;

  // Amperage: any reading < 12 passes (covers all 4 spec ranges: <5, 5-7.49, 7.5-9.99, 10-11.99)
  const amperageOk = amperageReading >= 0 && amperageReading < 12;
  const tankOk = ["good", "fair", "poor"].includes(tankCondition);
  const controlBoxOk = ["ok", "not_present"].includes(controlBoxCondition);
  const pressureSwitchOk = constantPressureSystem || pressureSwitch === "visibly_present_intact";
  const pressureGaugeOk = constantPressureSystem || pressureGauge === "visibly_present_intact";

  return amperageOk && tankOk && controlBoxOk && pressureSwitchOk && pressureGaugeOk
    ? "pass"
    : "needs_attention";
}

function calcCycleTimeStatus(
  cycleTime: number | null,
  constantPressureSystem: boolean
): CategoryStatus {
  if (constantPressureSystem) return "pass";
  if (cycleTime == null) return null;
  return cycleTime >= 30 && cycleTime <= 420 ? "pass" : "needs_attention";
}

function calcWellYieldStatus(
  wellYieldGpm: number | null,
  totalGallons: number | null,
  avgMinutesToReach350: number | null,
  hasYieldTests: boolean,
  wellCalculationVersion: number,
  constantPressureSystem: boolean
): CategoryStatus {
  if (constantPressureSystem) return "pass";
  if (wellYieldGpm == null || totalGallons == null) return null;

  const yieldOk = wellYieldGpm >= 1.0;
  const gallonsOk = totalGallons >= 350;

  if (wellCalculationVersion >= 2) {
    // If tests exist but none reached 350 gallons → avgMinutes is null → needs_attention
    // If no tests exist → wellYieldGpm is also null → caught above as indeterminate
    const avgMinutesOk = avgMinutesToReach350 != null && avgMinutesToReach350 <= 120;
    return yieldOk && gallonsOk && avgMinutesOk ? "pass" : "needs_attention";
  }

  return yieldOk && gallonsOk ? "pass" : "needs_attention";
}

// ─── Superior eligibility ─────────────────────────────────────────────────────

function calcEligibleForSuperior(
  input: InspectionCalcInput,
  wellYieldGpm: number | null,
  totalGallons: number | null,
  avgMinutesToReach350: number | null,
  cycleTime: number | null
): boolean | null {
  if (input.wellCalculationVersion < 2) return null; // manual entry for v1

  // State eligibility check
  if (!input.state) return null;
  const stateUpper = input.state.toUpperCase().trim();
  if (SUPERIOR_INELIGIBLE_STATES.includes(stateUpper)) return false;

  // All major items must have data to calculate
  const { amperageReading, tankCondition, controlBoxCondition, pressureSwitch, constantPressureSystem } = input;
  if (amperageReading == null || !tankCondition || !controlBoxCondition) return null;
  if (!constantPressureSystem && !pressureSwitch) return null;
  if (!constantPressureSystem && cycleTime == null) return null;

  // Check all major items pass
  const amperagePass = amperageReading >= 0 && amperageReading < 12;
  const tankPass = ["good", "fair", "poor"].includes(tankCondition);
  const controlBoxPass = ["ok", "not_present"].includes(controlBoxCondition);
  const pressureSwitchPass = constantPressureSystem || pressureSwitch === "visibly_present_intact";
  const cycleTimePass =
    constantPressureSystem || (cycleTime != null && cycleTime >= 30 && cycleTime <= 420);

  if (!amperagePass || !tankPass || !controlBoxPass || !pressureSwitchPass || !cycleTimePass) {
    return false;
  }

  // Check at least one minor item needs attention
  const wellTypeNA = !!input.wellType && SUPERIOR_MINOR_FAIL_WELL_TYPES.includes(input.wellType);
  const totalGallonsNA = totalGallons != null && totalGallons < 350;
  const avgMinutesNA = avgMinutesToReach350 != null && avgMinutesToReach350 > 120;
  const wellYieldNA = wellYieldGpm != null && wellYieldGpm < 1.0;

  return wellTypeNA || totalGallonsNA || avgMinutesNA || wellYieldNA;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function calculateInspection(input: InspectionCalcInput): CalcResult {
  const { secondsToHighReading, secondsToLowReading, wellCalculationVersion, constantPressureSystem, yieldTests } = input;

  // Cycle Time
  const cycleTime =
    secondsToHighReading != null && secondsToLowReading != null
      ? secondsToHighReading + secondsToLowReading
      : null;

  // Well Yield
  const wellYieldGpm =
    wellCalculationVersion >= 2 ? calcWellYieldV2(yieldTests) : calcWellYieldV1(yieldTests);

  // Total Gallons (from last test)
  const totalGallons = calcTotalGallons(yieldTests);

  // Average Minutes to Reach 350 (v2+ only)
  const avgMinutesToReach350 =
    wellCalculationVersion >= 2 ? calcAvgMinutesToReach350(yieldTests) : null;

  // Gallons Per Day
  const gallonsPerDay = wellYieldGpm != null ? Math.ceil(wellYieldGpm * 60 * 24) : null;

  // Category statuses
  const externalEquipmentStatus = calcExternalEquipmentStatus(input);
  const internalEquipmentStatus = calcInternalEquipmentStatus(input);
  const cycleTimeStatus = calcCycleTimeStatus(cycleTime, constantPressureSystem);
  const wellYieldStatus = calcWellYieldStatus(
    wellYieldGpm,
    totalGallons,
    avgMinutesToReach350,
    yieldTests.length > 0,
    wellCalculationVersion,
    constantPressureSystem
  );

  // Superior eligibility
  const eligibleForSuperior = calcEligibleForSuperior(
    input,
    wellYieldGpm,
    totalGallons,
    avgMinutesToReach350,
    cycleTime
  );

  // Membership tier
  let membershipTier: MembershipTier | null = null;
  const allDetermined =
    externalEquipmentStatus !== null &&
    internalEquipmentStatus !== null &&
    cycleTimeStatus !== null &&
    wellYieldStatus !== null;

  // Ineligible when major items fail or state disqualifies from all programs
  const stateUpperForTier = input.state?.toUpperCase().trim() ?? "";
  const stateIneligible = !!input.state && SUPERIOR_INELIGIBLE_STATES.includes(stateUpperForTier);
  // Internal equipment and cycle time are the "major" items — failure = ineligible
  const majorItemsFail =
    internalEquipmentStatus === "needs_attention" ||
    cycleTimeStatus === "needs_attention";

  if (allDetermined) {
    const allPass =
      externalEquipmentStatus === "pass" &&
      internalEquipmentStatus === "pass" &&
      cycleTimeStatus === "pass" &&
      wellYieldStatus === "pass";

    if (allPass && !stateIneligible) {
      membershipTier = "premium";
    } else if (eligibleForSuperior === true) {
      membershipTier = "superior";
    } else if (stateIneligible || majorItemsFail) {
      membershipTier = "ineligible";
    } else {
      membershipTier = "standard";
    }
  }

  // System status (auto-computed): "red" = Standard (DB-compatible), "ineligible" = new Ineligible
  const systemStatus: "green" | "yellow" | "red" | "ineligible" =
    membershipTier === "premium"
      ? "green"
      : membershipTier === "superior"
      ? "yellow"
      : membershipTier === "ineligible"
      ? "ineligible"
      : membershipTier === "standard"
      ? "red"
      : "green"; // default when indeterminate

  // Build rationale
  const statusRationale: string[] = [];
  if (externalEquipmentStatus === "needs_attention") statusRationale.push("External Equipment needs attention.");
  if (internalEquipmentStatus === "needs_attention") statusRationale.push("Internal Equipment needs attention.");
  if (cycleTimeStatus === "needs_attention")
    statusRationale.push(`Cycle Time ${cycleTime?.toFixed(0) ?? "—"} sec is outside the 30–420 sec range.`);
  if (wellYieldStatus === "needs_attention") {
    if (wellYieldGpm != null && wellYieldGpm < 1.0)
      statusRationale.push(`Well Yield ${wellYieldGpm.toFixed(2)} gpm is below 1.0 gpm minimum.`);
    if (totalGallons != null && totalGallons < 350)
      statusRationale.push(`Total Gallons ${totalGallons} is below 350 minimum.`);
    if (avgMinutesToReach350 != null && avgMinutesToReach350 > 120)
      statusRationale.push(`Avg Minutes to 350 Gal (${avgMinutesToReach350.toFixed(1)} min) exceeds 120 min.`);
    if (wellCalculationVersion >= 2 && avgMinutesToReach350 === null && wellYieldGpm != null)
      statusRationale.push("No yield test reached 350 gallons.");
  }
  if (stateIneligible && allDetermined)
    statusRationale.push(`Member's state (${input.state}) is not eligible for WelGard Premium or Superior coverage.`);
  if (membershipTier === null)
    statusRationale.push("Inspection incomplete — one or more required fields are missing.");

  return {
    cycleTime,
    wellYieldGpm,
    totalGallons,
    avgMinutesToReach350,
    gallonsPerDay,
    externalEquipmentStatus,
    internalEquipmentStatus,
    cycleTimeStatus,
    wellYieldStatus,
    eligibleForSuperior,
    membershipTier,
    systemStatus,
    statusRationale,
  };
}
