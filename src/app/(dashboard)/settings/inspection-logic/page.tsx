import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Inspection Logic Reference" };

function PassBadge() {
  return (
    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 text-xs font-medium">
      Pass
    </Badge>
  );
}

function AttentionBadge() {
  return (
    <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 text-xs font-medium">
      Needs Attention
    </Badge>
  );
}

function TierBadge({ tier }: { tier: "premium" | "superior" | "standard" | "ineligible" }) {
  const styles = {
    premium:    "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
    superior:   "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
    standard:   "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100",
    ineligible: "bg-red-100 text-red-800 border-red-200 hover:bg-red-100",
  };
  const labels = { premium: "Premium", superior: "Superior", standard: "Standard", ineligible: "Ineligible" };
  return (
    <Badge className={cn("text-xs font-semibold", styles[tier])}>
      {labels[tier]}
    </Badge>
  );
}

function SectionHeader({ label, description }: { label: string; description: string }) {
  return (
    <div className="flex flex-col gap-1 pb-2">
      <h2 className="text-lg font-semibold tracking-tight">{label}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function CriteriaRow({
  field,
  passValues,
  failNote,
  note,
}: {
  field: string;
  passValues: string[];
  failNote?: string;
  note?: string;
}) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 py-3 border-b last:border-0">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">{field}</span>
        <div className="flex flex-wrap gap-1.5 mt-0.5">
          {passValues.map((v) => (
            <span
              key={v}
              className="inline-flex items-center rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 font-medium"
            >
              {v}
            </span>
          ))}
        </div>
        {failNote && <p className="text-xs text-muted-foreground mt-1">{failNote}</p>}
        {note && (
          <p className="flex items-start gap-1.5 text-xs text-sky-700 bg-sky-50 border border-sky-100 rounded-md px-2 py-1.5 mt-1">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            {note}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1 pt-0.5">
        <PassBadge />
        {failNote && <AttentionBadge />}
      </div>
    </div>
  );
}

export default function InspectionLogicPage() {
  return (
    <div className="flex flex-col gap-8 p-4 sm:p-8 max-w-3xl mx-auto w-full pb-16">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Settings
        </Link>
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-muted-foreground" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Inspection Logic Reference</h1>
            <p className="text-sm text-muted-foreground">
              How inspection results are calculated and what determines each membership tier.
            </p>
          </div>
        </div>
      </div>

      {/* Tier Overview */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Membership Tiers"
          description="Every completed inspection produces one of four outcomes based on the criteria below."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <CardTitle className="text-sm text-emerald-800">Premium</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-emerald-700">
                All four inspection categories pass and the member&apos;s state is eligible. The highest tier offered.
              </p>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50/40">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-yellow-600" />
                <CardTitle className="text-sm text-yellow-800">Superior</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-yellow-700">
                All major items pass, but one or more minor items need attention. The well qualifies for Superior coverage.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/40">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-sm text-blue-800">Standard</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-blue-700">
                External items need attention but all major items pass. Does not qualify for Superior or Premium. Addressing flagged items may open eligibility.
              </p>
            </CardContent>
          </Card>

          <Card className="border-red-200 bg-red-50/40">
            <CardHeader className="pb-2 pt-4 px-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <CardTitle className="text-sm text-red-800">Ineligible</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-red-700">
                One or more <strong>major</strong> items fail (Amperage, Tank, Control Box, Pressure Switch, or Cycle Time), or the member&apos;s state is not eligible for WelGard programs. Coverage cannot be offered.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* External Equipment */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="External Equipment"
          description="All five fields must meet the criteria below for this category to pass."
        />
        <Card>
          <CardContent className="pt-4 px-4 pb-2">
            <CriteriaRow
              field="Well Type"
              passValues={["Drilled", "Bored"]}
              failNote="Hand Dug, Stick, Artesian, Driven Point, or Other → Needs Attention"
            />
            <CriteriaRow
              field="Well Obstructions"
              passValues={["None", "Ornamental"]}
              failNote="Vegetation, Debris, Structural, or Other → Needs Attention"
            />
            <CriteriaRow
              field="Well Cap"
              passValues={[
                "Sealed / Contamination Resistant",
                "Bored Well",
                "Not Applicable / Buried",
                "Secured / Bolted",
              ]}
              failNote="Unsecured / Open or Missing / Damaged → Needs Attention"
            />
            <CriteriaRow
              field="Height of Casing Above Ground"
              passValues={["> 6 inches"]}
              failNote="6 inches or less → Needs Attention"
            />
            <CriteriaRow
              field="Well Depth"
              passValues={["Unknown", "< 100 ft", "100 – 500 ft"]}
              failNote="> 500 ft → Needs Attention"
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Internal Equipment */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Internal Equipment"
          description="All five fields must meet the criteria below for this category to pass."
        />
        <Card>
          <CardContent className="pt-4 px-4 pb-2">
            <CriteriaRow
              field="Amperage Reading"
              passValues={[
                "Less than 5 amps",
                "5 – 7.49 amps",
                "7.5 – 9.99 amps",
                "10 – 11.99 amps",
              ]}
              failNote="12 amps or higher → Needs Attention"
            />
            <CriteriaRow
              field="Tank Condition"
              passValues={["Good", "Fair", "Poor"]}
              failNote="Failed → Needs Attention"
            />
            <CriteriaRow
              field="Control Box Condition"
              passValues={["OK", "Not Present"]}
              failNote="Damaged → Needs Attention"
            />
            <CriteriaRow
              field="Pressure Switch"
              passValues={["Visibly Present / Intact"]}
              failNote="Not Present or Damaged → Needs Attention"
              note="When Constant Pressure System = Yes, Pressure Switch is not required and always passes."
            />
            <CriteriaRow
              field="Pressure Gauge"
              passValues={["Visibly Present / Intact"]}
              failNote="Not Present or Damaged → Needs Attention"
              note="When Constant Pressure System = Yes, Pressure Gauge is not required and always passes."
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Cycle Time */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Cycle Time"
          description="A calculated field: Seconds to High Reading + Seconds to Low Reading."
        />
        <Card>
          <CardContent className="pt-4 px-4 pb-2">
            <CriteriaRow
              field="Cycle Time"
              passValues={["30 – 420 seconds"]}
              failNote="< 30 seconds or > 420 seconds → Needs Attention"
              note="When Constant Pressure System = Yes, Cycle Time always passes regardless of the calculated value."
            />
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Well Yield */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Well Yield"
          description="Three criteria must all pass. Well Yield and Total Gallons are calculated from yield test data."
        />
        <Card>
          <CardContent className="pt-4 px-4 pb-2">
            <CriteriaRow
              field="Well Yield (GPM)"
              passValues={["≥ 1.0 GPM"]}
              failNote="< 1.0 GPM → Needs Attention"
            />
            <CriteriaRow
              field="Total Gallons (last yield test)"
              passValues={["≥ 350 gallons"]}
              failNote="< 350 gallons → Needs Attention"
            />
            <CriteriaRow
              field="Average Minutes to Reach 350 Gallons"
              passValues={["≤ 120 minutes"]}
              failNote="> 120 minutes → Needs Attention"
              note="This criterion only applies to inspections using Calculation Version 2 or later. If no yield test reached 350 gallons, this field is blank and the category Needs Attention."
            />
          </CardContent>
        </Card>
        <p className="flex items-start gap-1.5 text-xs text-sky-700 bg-sky-50 border border-sky-100 rounded-md px-3 py-2">
          <Info className="w-3 h-3 mt-0.5 shrink-0" />
          When Constant Pressure System = Yes, the entire Well Yield category always passes.
        </p>
      </div>

      <Separator />

      {/* Superior Eligibility */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          label="Superior Eligibility"
          description="Superior is awarded when the well doesn't qualify for Premium but still meets a minimum standard. It is only auto-calculated for Calculation Version 2+; earlier records allow manual entry."
        />

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Requirements — all must be true</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">1. All major items must pass</p>
              <div className="flex flex-wrap gap-1.5 pl-2">
                {[
                  "Amperage Reading",
                  "Tank Condition",
                  "Control Box Condition",
                  "Pressure Switch",
                  "Cycle Time",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 font-medium"
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {item}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pl-2">
                If any major item needs attention, the well is Ineligible — not Superior or Standard.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">2. At least one minor item needs attention</p>
              <div className="pl-2 flex flex-col gap-1">
                {[
                  { label: "Well Type", condition: "is Hand Dug, Stick, or Other" },
                  { label: "Total Gallons", condition: "< 350" },
                  { label: "Average Minutes to Reach 350 Gallons", condition: "> 120 minutes" },
                  { label: "Well Yield", condition: "< 1.0 GPM" },
                ].map(({ label, condition }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-800 font-medium">
                      {label}
                    </span>
                    <span className="text-xs text-muted-foreground">{condition}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground pl-2">
                Other minor items (e.g., Well Cap, Casing Height) can also need attention without disqualifying Superior.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium">3. Member state must be eligible</p>
              <p className="text-xs text-muted-foreground pl-2">
                Members in <strong>California, Texas, or Florida</strong> are not eligible for Superior. Only Navigator Pro coverage is available in those states.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader className="pb-1 pt-4 px-4">
            <CardTitle className="text-sm text-amber-800">When Superior cannot be calculated</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ul className="text-xs text-amber-700 flex flex-col gap-1 list-disc list-inside">
              <li>Any major item is missing data (result is indeterminate).</li>
              <li>An entire category (External Equipment, Internal Equipment, Cycle Time, or Well Yield) shows Needs Attention but no individual field within it is the cause — for example, when the category was manually overridden or data is incomplete.</li>
              <li>Calculation Version is below 2 (handled by manual entry instead).</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Calculated Fields */}
      <div className="flex flex-col gap-4">
        <SectionHeader
          label="How Calculated Fields Work"
          description="These values are derived from the raw numbers entered during the inspection."
        />

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cycle Time</CardTitle>
              <CardDescription className="text-xs">Used to evaluate pump cycling behavior.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <code className="block bg-muted rounded-md px-3 py-2 text-sm">
                Cycle Time = Seconds to High Reading + Seconds to Low Reading
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Well Yield (GPM)</CardTitle>
              <CardDescription className="text-xs">Measures how fast the well replenishes water.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col gap-3">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  Original Calculation (pre-Oct 2022)
                </p>
                <p className="text-xs text-muted-foreground mb-1">
                  Uses only the last two yield tests:
                </p>
                <code className="block bg-muted rounded-md px-3 py-2 text-sm">
                  Yield = (Last Test Gallons − Previous Test Gallons) ÷ Minutes Between Tests
                </code>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
                  New Calculation — Version 2+ (Oct 2022 onward)
                </p>
                <p className="text-xs text-muted-foreground mb-1">
                  Weighted average across all test intervals:
                </p>
                <ul className="text-xs text-muted-foreground list-disc list-inside flex flex-col gap-1 pl-1">
                  <li>Last interval carries <strong>80%</strong> of the weight.</li>
                  <li>All prior intervals share the remaining <strong>20%</strong> equally.</li>
                </ul>
                <code className="block bg-muted rounded-md px-3 py-2 text-sm mt-2">
                  Yield = (Last Interval × 0.80) + (Each Prior Interval × 0.20 ÷ count of prior intervals)
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Average Minutes to Reach 350 Gallons</CardTitle>
              <CardDescription className="text-xs">Version 2+ only. Measures how long the well takes to yield 350 gallons.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4 flex flex-col gap-3">
              <p className="text-xs text-muted-foreground">
                Uses the <strong>first</strong> yield test (Tests 2–6) where total gallons ≥ 350, relative to Test 1&apos;s start time.
              </p>
              <code className="block bg-muted rounded-md px-3 py-2 text-sm leading-relaxed">
                Total Minutes = (Start Time of Test X − Start Time of Test 1)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (Seconds to Fill 5-Gallon Bucket from Test X ÷ 60)<br />
                <br />
                Avg Minutes to 350 = 350 ÷ (Test X Total Gallons ÷ Total Minutes)
              </code>
              <p className="text-xs text-muted-foreground">
                If no yield test reaches 350 gallons, or if data is missing from Test X, this field will be blank and Well Yield will show Needs Attention.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Gallons of Water Yielded Per Day</CardTitle>
              <CardDescription className="text-xs">Informational display only — does not affect tier.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <code className="block bg-muted rounded-md px-3 py-2 text-sm">
                Gallons Per Day = Well Yield GPM × 60 minutes × 24 hours
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total Gallons</CardTitle>
              <CardDescription className="text-xs">Used in Well Yield and Superior eligibility checks.</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground">
                Taken from whichever yield test is the <strong>last one conducted</strong> (highest test number with a recorded gallon value).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Informational Fields */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Informational Fields"
          description="These fields are recorded on the inspection worksheet for documentation purposes. They do not affect pass/fail scoring or membership tier."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">External Equipment</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="text-xs flex flex-col gap-1 text-muted-foreground list-disc list-inside">
                <li>Well Completion Date</li>
                <li>Well Permit (Date / #)</li>
                <li>Data Source (Homeowner / Official / Notation near well)</li>
                <li>Casing Type (PVC / Steel)</li>
                <li>Casing Size (&lt;4&quot; / 4&quot; / 6&quot;)</li>
                <li>Distance from House (ft)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Internal Equipment</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="text-xs flex flex-col gap-1 text-muted-foreground list-disc list-inside">
                <li>Pump Manufacturer (Franklin / Goulds / Grundfos)</li>
                <li>Pump HP (½ – 2 hp)</li>
                <li>Tank Brand, Model, and Size (Gal)</li>
                <li>PSI Settings (30/50 or 40/60)</li>
                <li>Water Treatment (Softener / Sediment Filter)</li>
                <li>Wire Type (12 / 10 / 8 / 2-wire / 3-wire)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Yield Tests</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="text-xs flex flex-col gap-1 text-muted-foreground list-disc list-inside">
                <li>Test Method (Flow Test or Static Water Level Test)</li>
                <li>Static Water Level (ft) — recorded per test row when using the static level method</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Quick Reference */}
      <div className="flex flex-col gap-3">
        <SectionHeader
          label="Quick Reference"
          description="Summary of which items are major vs. minor and how they affect tier assignment."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card className="border-red-100">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Major Items (any fail → Ineligible)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="text-xs flex flex-col gap-1 text-muted-foreground list-disc list-inside">
                <li>Amperage Reading</li>
                <li>Tank Condition</li>
                <li>Control Box Condition</li>
                <li>Pressure Switch</li>
                <li>Cycle Time</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-amber-100">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                Minor Items (fail → Superior eligible)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ul className="text-xs flex flex-col gap-1 text-muted-foreground list-disc list-inside">
                <li>Well Type (hand dug / stick / other)</li>
                <li>Total Gallons (&lt; 350)</li>
                <li>Avg Minutes to 350 Gallons (&gt; 120)</li>
                <li>Well Yield (&lt; 1.0 GPM)</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-2 italic">
                Other external equipment items (well cap, casing height, etc.) can also need attention without blocking Superior.
              </p>
            </CardContent>
          </Card>

          <Card className="border-blue-100">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-500" />
                External-Only Items (fail → Standard)
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground mb-2">
                When only external equipment items need attention (and no major or minor items fail), the result is <strong>Standard</strong>. These items are fixable — addressing them may allow the well to qualify for Superior or Premium.
              </p>
              <ul className="text-xs flex flex-col gap-1 text-muted-foreground list-disc list-inside">
                <li>Well Cap condition</li>
                <li>Casing Height Above Ground</li>
                <li>Well Obstructions</li>
                <li>Well Depth (&gt; 500 ft)</li>
                <li>Well Type (non-drilled/bored but not in hand dug / stick / other)</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-red-100">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                Ineligible States
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-muted-foreground mb-2">
                Members in the following states are not eligible for WelGard Premium or Superior coverage regardless of inspection results. Only Navigator Pro coverage is available in these states.
              </p>
              <div className="flex gap-2 flex-wrap">
                {["California", "Texas", "Florida"].map((s) => (
                  <span key={s} className="inline-flex items-center rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-xs text-red-800 font-medium">
                    {s}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
