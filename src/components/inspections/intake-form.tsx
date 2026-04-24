"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, CheckCircle2, UserCheck, Building2 } from "lucide-react";
import Link from "next/link";

import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createIntakeInspection } from "@/actions/intake";
import {
  WELL_TYPE_OPTIONS,
  PUMP_TYPE_OPTIONS,
  WELL_OBSTRUCTION_OPTIONS,
  WELL_CAP_OPTIONS,
  TANK_CONDITION_OPTIONS,
  CONTROL_BOX_OPTIONS,
  PRESSURE_COMPONENT_OPTIONS,
} from "@/config/inspection-fields";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  homeownerName:          z.string().min(1, "Homeowner name is required"),
  homeownerEmail:         z.string().email("Invalid email").or(z.literal("")).optional(),
  homeownerPhone:         z.string().optional(),
  propertyAddress:        z.string().min(1, "Property address is required"),
  city:                   z.string().optional(),
  state:                  z.string().optional(),
  zip:                    z.string().optional(),
  inspectionDate:         z.string().min(1, "Inspection date is required"),
  wellType:               z.string().optional(),
  wellDepthFt:            z.coerce.number().nullable().optional(),
  wellDepthUnknown:       z.boolean().optional(),
  pumpType:               z.string().optional(),
  wellObstructions:       z.string().optional(),
  wellCap:                z.string().optional(),
  casingHeightInches:     z.coerce.number().nullable().optional(),
  amperageReading:        z.coerce.number().nullable().optional(),
  tankCondition:          z.string().optional(),
  controlBoxCondition:    z.string().optional(),
  pressureSwitch:         z.string().optional(),
  pressureGauge:          z.string().optional(),
  constantPressureSystem: z.boolean().optional(),
  secondsToHighReading:   z.coerce.number().nullable().optional(),
  secondsToLowReading:    z.coerce.number().nullable().optional(),
  inspectorNotes:         z.string().optional(),
  requiredRepairs:        z.string().optional(),
  recommendedRepairs:     z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({
  label,
  required,
  hint,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function FormSelect({
  value,
  onChange,
  options,
  placeholder = "Select…",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select value={value ?? ""} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessCard({ inspectionId, onAnother }: { inspectionId: string; onAnother: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-6 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-green-600" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Inspection Submitted</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Your inspection has been saved as a draft. A Welgard team member will review and finalize it.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onAnother}>
          Submit Another
        </Button>
        <Link href={`/inspections/${inspectionId}`} className={cn(buttonVariants())}>
          View Draft
        </Link>
      </div>
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
  inspectorName: string;
  inspectionCompany: string | null;
};

// ─── Main component ───────────────────────────────────────────────────────────

export function IntakeForm({ inspectorName, inspectionCompany }: Props) {
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      homeownerName: "",
      homeownerEmail: "",
      homeownerPhone: "",
      propertyAddress: "",
      city: "",
      state: "",
      zip: "",
      inspectionDate: new Date().toISOString().slice(0, 10),
      wellType: "",
      wellDepthFt: null,
      wellDepthUnknown: false,
      pumpType: "",
      wellObstructions: "",
      wellCap: "",
      casingHeightInches: null,
      amperageReading: null,
      tankCondition: "",
      controlBoxCondition: "",
      pressureSwitch: "",
      pressureGauge: "",
      constantPressureSystem: false,
      secondsToHighReading: null,
      secondsToLowReading: null,
      inspectorNotes: "",
      requiredRepairs: "",
      recommendedRepairs: "",
    },
  });

  const wellDepthUnknown       = watch("wellDepthUnknown");
  const constantPressureSystem = watch("constantPressureSystem");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const result = await createIntakeInspection({
      homeownerName:          values.homeownerName,
      homeownerEmail:         values.homeownerEmail ?? "",
      homeownerPhone:         values.homeownerPhone ?? "",
      propertyAddress:        values.propertyAddress,
      city:                   values.city ?? "",
      state:                  values.state ?? "",
      zip:                    values.zip ?? "",
      inspectionDate:         values.inspectionDate,
      wellType:               values.wellType ?? "",
      wellDepthFt:            values.wellDepthUnknown ? null : (values.wellDepthFt ?? null),
      wellDepthUnknown:       values.wellDepthUnknown ?? false,
      pumpType:               values.pumpType ?? "",
      wellObstructions:       values.wellObstructions ?? "",
      wellCap:                values.wellCap ?? "",
      casingHeightInches:     values.casingHeightInches ?? null,
      amperageReading:        values.amperageReading ?? null,
      tankCondition:          values.tankCondition ?? "",
      controlBoxCondition:    values.controlBoxCondition ?? "",
      pressureSwitch:         values.pressureSwitch ?? "",
      pressureGauge:          values.pressureGauge ?? "",
      constantPressureSystem: values.constantPressureSystem ?? false,
      secondsToHighReading:   values.secondsToHighReading ?? null,
      secondsToLowReading:    values.secondsToLowReading ?? null,
      inspectorNotes:         values.inspectorNotes ?? "",
      requiredRepairs:        values.requiredRepairs ?? "",
      recommendedRepairs:     values.recommendedRepairs ?? "",
    });
    setSubmitting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    setSubmittedId(result.id);
  }

  if (submittedId) {
    return (
      <SuccessCard
        inspectionId={submittedId}
        onAnother={() => {
          setSubmittedId(null);
          reset();
        }}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

      {/* Inspector identity — read-only */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-5">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-primary/70" />
              <div>
                <p className="text-xs text-muted-foreground">Inspector</p>
                <p className="font-semibold text-sm">{inspectorName}</p>
              </div>
            </div>
            {inspectionCompany && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary/70" />
                <div>
                  <p className="text-xs text-muted-foreground">Company</p>
                  <p className="font-semibold text-sm">{inspectionCompany}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 1: Property & Homeowner ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Property &amp; Homeowner</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Homeowner Name" required error={errors.homeownerName?.message}>
            <Input placeholder="Jane Smith" {...register("homeownerName")} />
          </Field>
          <Field label="Homeowner Email" error={errors.homeownerEmail?.message}>
            <Input type="email" placeholder="jane@email.com" {...register("homeownerEmail")} />
          </Field>
          <Field label="Homeowner Phone">
            <Input placeholder="555-000-0000" {...register("homeownerPhone")} />
          </Field>
          <Field label="Inspection Date" required error={errors.inspectionDate?.message}>
            <Input type="date" {...register("inspectionDate")} />
          </Field>
          <div className="md:col-span-2">
            <Field label="Property Address" required error={errors.propertyAddress?.message}>
              <Input placeholder="123 Main Street" {...register("propertyAddress")} />
            </Field>
          </div>
          <Field label="City">
            <Input placeholder="Springfield" {...register("city")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="State">
              <Input placeholder="VA" maxLength={2} {...register("state")} />
            </Field>
            <Field label="ZIP">
              <Input placeholder="22801" {...register("zip")} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Well System ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Well System</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Well Type">
            <FormSelect
              value={watch("wellType") ?? ""}
              onChange={(v) => setValue("wellType", v)}
              options={WELL_TYPE_OPTIONS}
              placeholder="Select well type…"
            />
          </Field>
          <Field label="Pump Type">
            <FormSelect
              value={watch("pumpType") ?? ""}
              onChange={(v) => setValue("pumpType", v)}
              options={PUMP_TYPE_OPTIONS}
              placeholder="Select pump type…"
            />
          </Field>
          <Field label="Well Depth (ft)" hint={wellDepthUnknown ? "Depth unknown — field skipped" : undefined}>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                min={0}
                step={1}
                placeholder="e.g. 220"
                disabled={wellDepthUnknown}
                {...register("wellDepthFt")}
                className="flex-1"
              />
              <label className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap cursor-pointer">
                <input
                  type="checkbox"
                  className="w-3.5 h-3.5"
                  {...register("wellDepthUnknown")}
                />
                Unknown
              </label>
            </div>
          </Field>
          <Field label="Casing Height Above Grade (in)">
            <Input type="number" min={0} step={0.5} placeholder="e.g. 12" {...register("casingHeightInches")} />
          </Field>
        </CardContent>
      </Card>

      {/* ── Section 3: External Equipment ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">External Equipment</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Well Obstructions">
            <FormSelect
              value={watch("wellObstructions") ?? ""}
              onChange={(v) => setValue("wellObstructions", v)}
              options={WELL_OBSTRUCTION_OPTIONS}
              placeholder="Select…"
            />
          </Field>
          <Field label="Well Cap Condition">
            <FormSelect
              value={watch("wellCap") ?? ""}
              onChange={(v) => setValue("wellCap", v)}
              options={WELL_CAP_OPTIONS}
              placeholder="Select…"
            />
          </Field>
        </CardContent>
      </Card>

      {/* ── Section 4: Internal Equipment ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Internal Equipment</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Amperage Reading (A)" hint="Measured at pump start">
            <Input type="number" min={0} step={0.1} placeholder="e.g. 8.5" {...register("amperageReading")} />
          </Field>
          <Field label="Tank Condition">
            <FormSelect
              value={watch("tankCondition") ?? ""}
              onChange={(v) => setValue("tankCondition", v)}
              options={TANK_CONDITION_OPTIONS}
              placeholder="Select…"
            />
          </Field>
          <Field label="Control Box Condition">
            <FormSelect
              value={watch("controlBoxCondition") ?? ""}
              onChange={(v) => setValue("controlBoxCondition", v)}
              options={CONTROL_BOX_OPTIONS}
              placeholder="Select…"
            />
          </Field>
          <Field label="Pressure Switch">
            <FormSelect
              value={watch("pressureSwitch") ?? ""}
              onChange={(v) => setValue("pressureSwitch", v)}
              options={PRESSURE_COMPONENT_OPTIONS}
              placeholder="Select…"
            />
          </Field>
          <Field label="Pressure Gauge">
            <FormSelect
              value={watch("pressureGauge") ?? ""}
              onChange={(v) => setValue("pressureGauge", v)}
              options={PRESSURE_COMPONENT_OPTIONS}
              placeholder="Select…"
            />
          </Field>
          <Field label="Constant Pressure System">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="w-4 h-4"
                {...register("constantPressureSystem")}
              />
              Variable-speed / constant pressure system present
            </label>
          </Field>
        </CardContent>
      </Card>

      {/* ── Section 5: Cycle Test ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Cycle Test</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Seconds to High Reading" hint="Time for pressure to rise to cut-out (seconds)">
            <Input type="number" min={0} step={1} placeholder="e.g. 120" {...register("secondsToHighReading")} />
          </Field>
          <Field
            label="Seconds to Low Reading"
            hint={constantPressureSystem ? "N/A for constant pressure systems" : "Time for pressure to drop to cut-in (seconds)"}
          >
            <Input
              type="number"
              min={0}
              step={1}
              placeholder="e.g. 90"
              disabled={constantPressureSystem}
              {...register("secondsToLowReading")}
            />
          </Field>
        </CardContent>
      </Card>

      {/* ── Section 6: Notes ── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Notes &amp; Findings</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <Field label="Inspector Notes" hint="General observations, site conditions, anything notable">
            <Textarea rows={4} placeholder="Describe the condition of the system and any observations…" {...register("inspectorNotes")} />
          </Field>
          <Field label="Required Repairs" hint="Repairs necessary before the system can qualify">
            <Textarea rows={3} placeholder="List any required repairs…" {...register("requiredRepairs")} />
          </Field>
          <Field label="Recommended Repairs" hint="Proactive or non-urgent recommendations">
            <Textarea rows={3} placeholder="List any recommendations…" {...register("recommendedRepairs")} />
          </Field>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex items-center gap-3 pt-2 pb-8">
        <Button type="submit" disabled={submitting} className="gap-2" size="lg">
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {submitting ? "Submitting…" : "Submit Inspection"}
        </Button>
        <p className="text-xs text-muted-foreground">
          Saved as a draft — Welgard will review and finalize.
        </p>
      </div>
    </form>
  );
}
