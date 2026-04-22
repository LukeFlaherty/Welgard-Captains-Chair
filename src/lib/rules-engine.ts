import type { StatusEvaluation, InspectionStatus } from "@/types/inspection";

type EvalInput = {
  visibleLeaks?: boolean;
  safetyIssues?: boolean;
  contaminationRisk?: boolean;
  systemOperational?: boolean;
  pressureOk?: boolean;
  flowOk?: boolean;
  siteClearanceOk?: boolean;
  casingCondition?: string | null;
  wellCapCondition?: string | null;
  wiringCondition?: string | null;
  pumpAgeYears?: number | null;
  pressureTankAgeYears?: number | null;
};

export function evaluateInspection(data: EvalInput): StatusEvaluation {
  const rationale: string[] = [];
  let score = 100;

  // ── Immediate RED disqualifiers ─────────────────────────────────────────────
  if (data.safetyIssues) {
    rationale.push("Safety issues identified — immediate disqualifier.");
    return { status: "red", score: 0, rationale };
  }
  if (data.contaminationRisk) {
    rationale.push("Contamination risk detected — immediate disqualifier.");
    return { status: "red", score: 0, rationale };
  }
  if (data.systemOperational === false) {
    rationale.push("Well system is non-operational — immediate disqualifier.");
    return { status: "red", score: 0, rationale };
  }

  // ── High-impact deductions ──────────────────────────────────────────────────
  if (data.visibleLeaks) {
    score -= 25;
    rationale.push("Visible leaks present (-25 pts).");
  }
  if (data.pressureOk === false) {
    score -= 20;
    rationale.push("Pressure readings outside acceptable range (-20 pts).");
  }
  if (data.flowOk === false) {
    score -= 20;
    rationale.push("Flow rate outside acceptable range (-20 pts).");
  }

  // ── Condition ratings ───────────────────────────────────────────────────────
  if (data.casingCondition === "poor") {
    score -= 20;
    rationale.push("Well casing in poor condition (-20 pts).");
  } else if (data.casingCondition === "fair") {
    score -= 10;
    rationale.push("Well casing in fair condition (-10 pts).");
  }
  if (data.wellCapCondition === "poor") {
    score -= 15;
    rationale.push("Well cap in poor condition (-15 pts).");
  } else if (data.wellCapCondition === "fair") {
    score -= 8;
    rationale.push("Well cap in fair condition (-8 pts).");
  }
  if (data.wiringCondition === "poor") {
    score -= 15;
    rationale.push("Wiring in poor condition (-15 pts).");
  } else if (data.wiringCondition === "fair") {
    score -= 8;
    rationale.push("Wiring in fair condition (-8 pts).");
  }

  // ── Age-based deductions ────────────────────────────────────────────────────
  if (data.pumpAgeYears != null) {
    if (data.pumpAgeYears > 20) {
      score -= 20;
      rationale.push(`Pump age ${data.pumpAgeYears} yrs — exceeds 20 yr threshold (-20 pts).`);
    } else if (data.pumpAgeYears > 15) {
      score -= 10;
      rationale.push(`Pump age ${data.pumpAgeYears} yrs — elevated age (-10 pts).`);
    } else if (data.pumpAgeYears > 10) {
      score -= 5;
      rationale.push(`Pump age ${data.pumpAgeYears} yrs — approaching service age (-5 pts).`);
    }
  }
  if (data.pressureTankAgeYears != null) {
    if (data.pressureTankAgeYears > 15) {
      score -= 15;
      rationale.push(
        `Pressure tank age ${data.pressureTankAgeYears} yrs — exceeds 15 yr threshold (-15 pts).`
      );
    } else if (data.pressureTankAgeYears > 10) {
      score -= 5;
      rationale.push(`Pressure tank age ${data.pressureTankAgeYears} yrs — approaching service age (-5 pts).`);
    }
  }

  // ── Site clearance ──────────────────────────────────────────────────────────
  if (data.siteClearanceOk === false) {
    score -= 10;
    rationale.push("Site clearance requirements not met (-10 pts).");
  }

  score = Math.max(0, score);

  let status: InspectionStatus;
  if (score >= 70) {
    status = "green";
    if (rationale.length === 0) rationale.push("All evaluated criteria are within acceptable parameters.");
  } else if (score >= 40) {
    status = "yellow";
  } else {
    status = "red";
  }

  return { status, score, rationale };
}

export const STATUS_LABELS: Record<string, string> = {
  green: "Approved",
  yellow: "Conditional",
  red: "Not Approved",
};

export const STATUS_DESCRIPTIONS: Record<string, string> = {
  green:
    "The well system appears operational and in acceptable condition. The property qualifies for consideration under current coverage guidelines.",
  yellow:
    "The well system is operational, however concerns were noted during inspection. Repairs or updates are recommended before full coverage can be confirmed. Follow-up may be required.",
  red: "The well system has significant issues that must be resolved before the property can qualify for coverage. Required repairs must be completed and the system re-inspected.",
};
