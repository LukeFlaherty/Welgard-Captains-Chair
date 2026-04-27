"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  Loader2, Save, CheckCircle, UploadCloud, X, Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

import { StatusBadge } from "./status-badge";
import { CategoryBadge } from "./category-badge";
import { YieldTestTable } from "./yield-test-table";
import { calculateInspection } from "@/lib/inspection-calc";
import { createInspection, updateInspection } from "@/actions/inspections";
import { STATUS_LABELS } from "@/lib/rules-engine";
import type { InspectionFormValues, InspectionWithRelations, InspectionStatus } from "@/types/inspection";
import {
  WELL_TYPE_OPTIONS,
  PUMP_TYPE_OPTIONS,
  PUMP_MANUFACTURER_OPTIONS,
  PUMP_HP_OPTIONS,
  WELL_DATA_SOURCE_OPTIONS,
  WELL_OBSTRUCTION_OPTIONS,
  WELL_CAP_OPTIONS,
  CASING_TYPE_OPTIONS,
  CASING_SIZE_OPTIONS,
  TANK_CONDITION_OPTIONS,
  TANK_BRAND_OPTIONS,
  PSI_SETTINGS_OPTIONS,
  WATER_TREATMENT_OPTIONS,
  WIRE_TYPE_OPTIONS,
  CONTROL_BOX_OPTIONS,
  PRESSURE_COMPONENT_OPTIONS,
  YIELD_TEST_TYPE_OPTIONS,
  ACTIVITY_OPTIONS,
  FINAL_STATUS_OPTIONS,
  PHOTO_LABELS,
} from "@/config/inspection-fields";

// ─── Schema ───────────────────────────────────────────────────────────────────

const numField = z.preprocess(
  (v) => (v === "" || v == null || (typeof v === "number" && isNaN(v)) ? null : Number(v)),
  z.number().nullable().optional()
);

const yieldTestSchema = z.object({
  testNumber:          z.number(),
  startTime:           z.string().optional().default(""),
  totalGallons:        numField,
  secondsToFillBucket: numField,
  staticWaterLevelFt:  numField,
});

const schema = z.object({
  inspectorId:           z.string().optional().default(""),
  homeownerName:         z.string().min(1, "Owner name is required"),
  homeownerEmail:        z.string().email("Invalid email").or(z.literal("")).optional().default(""),
  homeownerEmail2:       z.string().optional().default(""),
  homeownerPhone:        z.string().optional().default(""),
  propertyAddress:       z.string().min(1, "Property address is required"),
  propertyAddress2:      z.string().optional().default(""),
  city:                  z.string().optional().default(""),
  county:                z.string().optional().default(""),
  state:                 z.string().optional().default(""),
  zip:                   z.string().optional().default(""),
  realtorInvolved:       z.boolean().default(false),
  requestedByRealtor:    z.boolean().default(false),
  realtorName:           z.string().optional().default(""),
  realtorEmail:          z.string().optional().default(""),
  realtorPhone:          z.string().optional().default(""),
  realtorPhoneType:      z.string().optional().default(""),
  inspectorName:         z.string().optional().default(""),
  inspectionCompany:     z.string().optional().default(""),
  inspectionDate:        z.string().min(1, "Inspection date is required"),
  wellType:                  z.string().optional().default(""),
  wellDepthFt:               numField,
  wellDepthUnknown:          z.boolean().default(false),
  pumpType:                  z.string().optional().default(""),
  pumpManufacturer:          z.string().optional().default(""),
  pumpHp:                    z.string().optional().default(""),
  wellCompletionDate:        z.string().optional().default(""),
  wellCompletionDateUnknown: z.boolean().default(false),
  wellPermit:                z.string().optional().default(""),
  wellPermitUnknown:         z.boolean().default(false),
  wellDataSource:            z.string().optional().default(""),
  wellObstructions:          z.string().optional().default(""),
  wellCap:                   z.string().optional().default(""),
  casingHeightInches:        numField,
  casingType:                z.string().optional().default(""),
  casingSize:                z.string().optional().default(""),
  distanceFromHouseFt:       numField,
  amperageReading:           numField,
  tankCondition:             z.string().optional().default(""),
  tankBrand:                 z.string().optional().default(""),
  tankModel:                 z.string().optional().default(""),
  tankSizeGal:               numField,
  psiSettings:               z.string().optional().default(""),
  controlBoxCondition:       z.string().optional().default(""),
  waterTreatment:            z.string().optional().default(""),
  wireType:                  z.string().optional().default(""),
  pressureSwitch:            z.string().optional().default(""),
  pressureGauge:             z.string().optional().default(""),
  constantPressureSystem:    z.boolean().default(false),
  secondsToHighReading:      numField,
  secondsToLowReading:       numField,
  yieldTestType:             z.string().optional().default(""),
  yieldTests:                z.array(yieldTestSchema),
  wellCalculationVersion: z.number().default(2),
  inspectorNotes:        z.string().optional().default(""),
  internalReviewerNotes: z.string().optional().default(""),
  requiredRepairs:       z.string().optional().default(""),
  recommendedRepairs:    z.string().optional().default(""),
  memberFacingSummary:   z.string().optional().default(""),
  activity:              z.string().optional().default(""),
  finalStatus:           z.enum(["green", "yellow", "red", "ineligible", ""]).optional().default(""),
  overrideReason:        z.string().optional().default(""),
  ghlContactId:          z.string().optional().default(""),
  ghlOpportunityId:      z.string().optional().default(""),
  ghlLocationId:         z.string().optional().default(""),
  isDraft:               z.boolean().default(true),
});

type FormValues = z.infer<typeof schema>;

// ─── Default yield test rows ──────────────────────────────────────────────────

function emptyYieldTests() {
  return [1, 2, 3, 4, 5, 6].map((n) => ({
    testNumber: n,
    startTime: "",
    totalGallons: null as number | null,
    secondsToFillBucket: null as number | null,
    staticWaterLevelFt: null as number | null,
  }));
}

// ─── Convert existing inspection → form values ────────────────────────────────

function toFormValues(inspection: InspectionWithRelations): FormValues {
  const existingTests = inspection.yieldTests ?? [];
  const yieldTests = [1, 2, 3, 4, 5, 6].map((n) => {
    const found = existingTests.find((t) => t.testNumber === n);
    return {
      testNumber: n,
      startTime: found?.startTime ?? "",
      totalGallons: found?.totalGallons ?? null,
      secondsToFillBucket: found?.secondsToFillBucket ?? null,
      staticWaterLevelFt: (found as { staticWaterLevelFt?: number | null })?.staticWaterLevelFt ?? null,
    };
  });

  return {
    inspectorId:               inspection.inspectorId ?? "",
    homeownerName:             inspection.homeownerName,
    homeownerEmail:            inspection.homeownerEmail ?? "",
    homeownerEmail2:           (inspection as { homeownerEmail2?: string | null }).homeownerEmail2 ?? "",
    homeownerPhone:            inspection.homeownerPhone ?? "",
    propertyAddress:           inspection.propertyAddress,
    propertyAddress2:          (inspection as { propertyAddress2?: string | null }).propertyAddress2 ?? "",
    city:                      inspection.city ?? "",
    county:                    (inspection as { county?: string | null }).county ?? "",
    state:                     inspection.state ?? "",
    zip:                       inspection.zip ?? "",
    realtorInvolved:           (inspection as { realtorInvolved?: boolean }).realtorInvolved ?? false,
    requestedByRealtor:        (inspection as { requestedByRealtor?: boolean }).requestedByRealtor ?? false,
    realtorName:               (inspection as { realtorName?: string | null }).realtorName ?? "",
    realtorEmail:              (inspection as { realtorEmail?: string | null }).realtorEmail ?? "",
    realtorPhone:              (inspection as { realtorPhone?: string | null }).realtorPhone ?? "",
    realtorPhoneType:          (inspection as { realtorPhoneType?: string | null }).realtorPhoneType ?? "",
    inspectorName:             inspection.inspectorName ?? "",
    inspectionCompany:         inspection.inspectionCompany ?? "",
    inspectionDate:            new Date(inspection.inspectionDate).toISOString().slice(0, 10),
    wellType:                  inspection.wellType ?? "",
    wellDepthFt:               inspection.wellDepthFt ?? null,
    wellDepthUnknown:          inspection.wellDepthUnknown,
    pumpType:                  inspection.pumpType ?? "",
    pumpManufacturer:          (inspection as { pumpManufacturer?: string | null }).pumpManufacturer ?? "",
    pumpHp:                    (inspection as { pumpHp?: string | null }).pumpHp ?? "",
    wellCompletionDate:        (inspection as { wellCompletionDate?: string | null }).wellCompletionDate ?? "",
    wellCompletionDateUnknown: (inspection as { wellCompletionDateUnknown?: boolean }).wellCompletionDateUnknown ?? false,
    wellPermit:                (inspection as { wellPermit?: string | null }).wellPermit ?? "",
    wellPermitUnknown:         (inspection as { wellPermitUnknown?: boolean }).wellPermitUnknown ?? false,
    wellDataSource:            (inspection as { wellDataSource?: string | null }).wellDataSource ?? "",
    wellObstructions:          inspection.wellObstructions ?? "",
    wellCap:                   inspection.wellCap ?? "",
    casingHeightInches:        inspection.casingHeightInches ?? null,
    casingType:                (inspection as { casingType?: string | null }).casingType ?? "",
    casingSize:                (inspection as { casingSize?: string | null }).casingSize ?? "",
    distanceFromHouseFt:       (inspection as { distanceFromHouseFt?: number | null }).distanceFromHouseFt ?? null,
    amperageReading:           inspection.amperageReading ?? null,
    tankCondition:             inspection.tankCondition ?? "",
    tankBrand:                 (inspection as { tankBrand?: string | null }).tankBrand ?? "",
    tankModel:                 (inspection as { tankModel?: string | null }).tankModel ?? "",
    tankSizeGal:               (inspection as { tankSizeGal?: number | null }).tankSizeGal ?? null,
    psiSettings:               (inspection as { psiSettings?: string | null }).psiSettings ?? "",
    controlBoxCondition:       inspection.controlBoxCondition ?? "",
    waterTreatment:            (inspection as { waterTreatment?: string | null }).waterTreatment ?? "",
    wireType:                  (inspection as { wireType?: string | null }).wireType ?? "",
    pressureSwitch:            inspection.pressureSwitch ?? "",
    pressureGauge:             inspection.pressureGauge ?? "",
    constantPressureSystem:    inspection.constantPressureSystem,
    secondsToHighReading:      inspection.secondsToHighReading ?? null,
    secondsToLowReading:       inspection.secondsToLowReading ?? null,
    yieldTestType:             (inspection as { yieldTestType?: string | null }).yieldTestType ?? "",
    yieldTests,
    wellCalculationVersion:    inspection.wellCalculationVersion,
    inspectorNotes:        inspection.inspectorNotes ?? "",
    internalReviewerNotes: inspection.internalReviewerNotes ?? "",
    requiredRepairs:       inspection.requiredRepairs ?? "",
    recommendedRepairs:    inspection.recommendedRepairs ?? "",
    memberFacingSummary:   inspection.memberFacingSummary ?? "",
    activity:              inspection.activity ?? "",
    finalStatus:           (inspection.finalStatus as InspectionStatus) ?? "",
    overrideReason:        inspection.overrideReason ?? "",
    ghlContactId:          inspection.ghlContactId ?? "",
    ghlOpportunityId:      inspection.ghlOpportunityId ?? "",
    ghlLocationId:         inspection.ghlLocationId ?? "",
    isDraft:               inspection.isDraft,
  };
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
  required,
  hint,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// ─── Select wrapper ───────────────────────────────────────────────────────────

function FormSelect({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Select value={value || ""} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder ?? "Select…"} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Section header with status badge ────────────────────────────────────────

function SectionHeader({
  title,
  description,
  status,
}: {
  title: string;
  description?: string;
  status?: import("@/lib/inspection-calc").CategoryStatus;
}) {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <CardTitle className="text-base">{title}</CardTitle>
          {description && (
            <CardDescription className="mt-1">{description}</CardDescription>
          )}
        </div>
        {status !== undefined && <CategoryBadge status={status} size="sm" />}
      </div>
    </CardHeader>
  );
}

// ─── Computed value chip ──────────────────────────────────────────────────────

function ComputedValue({
  label, value, unit, pass, warn,
}: {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  pass?: boolean;
  warn?: boolean;
}) {
  return (
    <div className={cn(
      "flex flex-col gap-0.5 p-3 rounded-lg border",
      warn ? "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800"
           : pass ? "bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-800"
           : "bg-muted/50"
    )}>
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">{label}</span>
      <span className={cn(
        "text-lg font-semibold",
        warn ? "text-amber-700 dark:text-amber-400" : pass ? "text-green-700 dark:text-green-400" : ""
      )}>
        {value != null ? (
          <>
            {typeof value === "number" ? value.toFixed(value % 1 === 0 ? 0 : 2) : value}
            {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
          </>
        ) : (
          <span className="text-muted-foreground text-sm font-normal">—</span>
        )}
      </span>
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

type InspectorOption = { id: string; name: string; company: string | null };

type Props = {
  mode: "create" | "edit";
  inspection?: InspectionWithRelations;
  inspectors?: InspectorOption[];
};

// ─── Main component ───────────────────────────────────────────────────────────

export function InspectionForm({ mode, inspection, inspectors = [] }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<{ id?: string; url: string; label: string }[]>(
    inspection?.photos.map((p) => ({ id: p.id, url: p.url, label: p.label ?? "additional" })) ?? []
  );

  const form = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues:
      mode === "edit" && inspection
        ? toFormValues(inspection)
        : {
            inspectorId: "",
            homeownerName: "", homeownerEmail: "", homeownerPhone: "",
            propertyAddress: "", city: "", state: "", zip: "",
            inspectorName: "", inspectionCompany: "",
            inspectionDate: new Date().toISOString().slice(0, 10),
            wellType: "", wellDepthFt: null, wellDepthUnknown: false,
            pumpType: "", pumpManufacturer: "", pumpHp: "",
            wellCompletionDate: "", wellCompletionDateUnknown: false,
            wellPermit: "", wellPermitUnknown: false,
            wellDataSource: "",
            wellObstructions: "", wellCap: "", casingHeightInches: null,
            casingType: "", casingSize: "", distanceFromHouseFt: null,
            amperageReading: null,
            tankCondition: "", tankBrand: "", tankModel: "", tankSizeGal: null,
            psiSettings: "", controlBoxCondition: "",
            waterTreatment: "", wireType: "",
            pressureSwitch: "", pressureGauge: "",
            constantPressureSystem: false,
            secondsToHighReading: null, secondsToLowReading: null,
            yieldTestType: "",
            yieldTests: emptyYieldTests(),
            wellCalculationVersion: 2,
            inspectorNotes: "", internalReviewerNotes: "",
            requiredRepairs: "", recommendedRepairs: "", memberFacingSummary: "",
            activity: "", finalStatus: "", overrideReason: "",
            ghlContactId: "", ghlOpportunityId: "", ghlLocationId: "",
            isDraft: true,
          },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const watched = watch();

  // Live calculations from current form values.
  // toNum guards against RHF returning raw HTML string values from number inputs,
  // which would turn "180" + "120" into "180120" instead of 300.
  const calc = useMemo(() => {
    const toNum = (v: unknown): number | null =>
      v != null && v !== "" && !Number.isNaN(Number(v)) ? Number(v) : null;

    return calculateInspection({
      wellType:              watched.wellType || null,
      wellDepthFt:           toNum(watched.wellDepthFt),
      wellDepthUnknown:      watched.wellDepthUnknown ?? false,
      wellObstructions:      watched.wellObstructions || null,
      wellCap:               watched.wellCap || null,
      casingHeightInches:    toNum(watched.casingHeightInches),
      amperageReading:       toNum(watched.amperageReading),
      tankCondition:         watched.tankCondition || null,
      controlBoxCondition:   watched.controlBoxCondition || null,
      pressureSwitch:        watched.pressureSwitch || null,
      pressureGauge:         watched.pressureGauge || null,
      constantPressureSystem: watched.constantPressureSystem ?? false,
      secondsToHighReading:  toNum(watched.secondsToHighReading),
      secondsToLowReading:   toNum(watched.secondsToLowReading),
      wellCalculationVersion: watched.wellCalculationVersion ?? 2,
      state:                 watched.state || null,
      yieldTests: (watched.yieldTests ?? []).map((t) => ({
        testNumber:          t.testNumber,
        startTime:           t.startTime || null,
        totalGallons:        toNum(t.totalGallons),
        secondsToFillBucket: toNum(t.secondsToFillBucket),
      })),
    });
  }, [
    watched.wellType, watched.wellDepthFt, watched.wellDepthUnknown,
    watched.wellObstructions, watched.wellCap, watched.casingHeightInches,
    watched.amperageReading, watched.tankCondition, watched.controlBoxCondition,
    watched.pressureSwitch, watched.pressureGauge, watched.constantPressureSystem,
    watched.secondsToHighReading, watched.secondsToLowReading,
    watched.wellCalculationVersion, watched.state, watched.yieldTests,
  ]);

  // Photo upload
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>, label: string) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("label", label);
      if (inspection?.id) fd.append("inspectionId", inspection.id);
      const res = await fetch("/api/photos", { method: "POST", body: fd });
      const json = await res.json();
      if (json.url) {
        setUploadedPhotos((prev) => [
          ...prev.filter((p) => p.label !== label),
          { id: json.id as string | undefined, url: json.url as string, label },
        ]);
        toast.success("Photo uploaded.");
      } else {
        toast.error((json.error as string | undefined) ?? "Upload failed.");
      }
    } catch {
      toast.error("Upload failed — check your connection.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  // Submit
  async function onSubmit(values: FormValues, isDraft: boolean) {
    setSubmitting(true);
    const payload: InspectionFormValues = {
      ...values,
      isDraft,
      inspectorId:               values.inspectorId ?? "",
      homeownerEmail:            values.homeownerEmail ?? "",
      homeownerPhone:            values.homeownerPhone ?? "",
      city:                      values.city ?? "",
      state:                     values.state ?? "",
      zip:                       values.zip ?? "",
      inspectorName:             values.inspectorName ?? "",
      inspectionCompany:         values.inspectionCompany ?? "",
      wellType:                  values.wellType ?? "",
      pumpType:                  values.pumpType ?? "",
      pumpManufacturer:          values.pumpManufacturer ?? "",
      pumpHp:                    values.pumpHp ?? "",
      wellCompletionDate:        values.wellCompletionDate ?? "",
      wellCompletionDateUnknown: values.wellCompletionDateUnknown ?? false,
      wellPermit:                values.wellPermit ?? "",
      wellPermitUnknown:         values.wellPermitUnknown ?? false,
      wellDataSource:            values.wellDataSource ?? "",
      wellObstructions:          values.wellObstructions ?? "",
      wellCap:                   values.wellCap ?? "",
      casingType:                values.casingType ?? "",
      casingSize:                values.casingSize ?? "",
      distanceFromHouseFt:       values.distanceFromHouseFt ?? null,
      tankCondition:             values.tankCondition ?? "",
      tankBrand:                 values.tankBrand ?? "",
      tankModel:                 values.tankModel ?? "",
      tankSizeGal:               values.tankSizeGal ?? null,
      psiSettings:               values.psiSettings ?? "",
      controlBoxCondition:       values.controlBoxCondition ?? "",
      waterTreatment:            values.waterTreatment ?? "",
      wireType:                  values.wireType ?? "",
      pressureSwitch:            values.pressureSwitch ?? "",
      pressureGauge:             values.pressureGauge ?? "",
      yieldTestType:             values.yieldTestType ?? "",
      inspectorNotes:            values.inspectorNotes ?? "",
      internalReviewerNotes:     values.internalReviewerNotes ?? "",
      requiredRepairs:           values.requiredRepairs ?? "",
      recommendedRepairs:        values.recommendedRepairs ?? "",
      memberFacingSummary:       values.memberFacingSummary ?? "",
      finalStatus:               (values.finalStatus as InspectionStatus | "") ?? "",
      overrideReason:            values.overrideReason ?? "",
      ghlContactId:              values.ghlContactId ?? "",
      ghlOpportunityId:          values.ghlOpportunityId ?? "",
      ghlLocationId:             values.ghlLocationId ?? "",
      activity:                  values.activity ?? "",
      wellDepthFt:               values.wellDepthFt ?? null,
      casingHeightInches:        values.casingHeightInches ?? null,
      amperageReading:           values.amperageReading ?? null,
      secondsToHighReading:      values.secondsToHighReading ?? null,
      secondsToLowReading:       values.secondsToLowReading ?? null,
      yieldTests: values.yieldTests.map((t) => ({
        testNumber:         t.testNumber,
        startTime:          t.startTime ?? "",
        totalGallons:       t.totalGallons ?? null,
        secondsToFillBucket: t.secondsToFillBucket ?? null,
        staticWaterLevelFt: t.staticWaterLevelFt ?? null,
      })),
    };

    const result =
      mode === "edit" && inspection
        ? await updateInspection(inspection.id, payload)
        : await createInspection(payload);

    setSubmitting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(isDraft ? "Draft saved." : "Inspection finalized.");
    router.push(`/inspections/${result.id}`);
  }

  return (
    <form onSubmit={handleSubmit((v: FormValues) => onSubmit(v, false))} className="flex flex-col gap-6">
      <Tabs defaultValue="member" className="w-full">
        <div className="overflow-x-auto -mx-4 px-4 pb-1 md:mx-0 md:px-0">
          <TabsList className="flex-nowrap h-auto gap-1 mb-1 w-max md:w-fit flex-wrap">
            <TabsTrigger value="member">Member</TabsTrigger>
            <TabsTrigger value="source">Inspection Info</TabsTrigger>
            <TabsTrigger value="well">Well System</TabsTrigger>
            <TabsTrigger value="external">External</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
            <TabsTrigger value="cycle">Cycle Test</TabsTrigger>
            <TabsTrigger value="yield">Yield Tests</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="review">Review</TabsTrigger>
          </TabsList>
        </div>

        {/* ── Tab 1: Member & Property ──────────────────────────────────────── */}
        <TabsContent value="member" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Member & Property</CardTitle>
              <CardDescription>Homeowner contact details and property location.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Owner Name" error={errors.homeownerName?.message} required>
                <Input {...register("homeownerName")} placeholder="Jane Smith" />
              </Field>
              <Field label="Email" error={errors.homeownerEmail?.message}>
                <Input {...register("homeownerEmail")} type="email" placeholder="jane@example.com" />
              </Field>
              <Field label="Phone" error={errors.homeownerPhone?.message}>
                <Input {...register("homeownerPhone")} placeholder="(555) 000-0000" />
              </Field>
              <div className="md:col-span-2">
                <Field label="Property Address" error={errors.propertyAddress?.message} required>
                  <Input {...register("propertyAddress")} placeholder="123 Main St" />
                </Field>
              </div>
              <Field label="City" error={errors.city?.message}>
                <Input {...register("city")} placeholder="Springfield" />
              </Field>
              <Field label="State" error={errors.state?.message} hint="Used for eligibility calculations. 2-letter code.">
                <Input {...register("state")} placeholder="IL" maxLength={2} className="uppercase" />
              </Field>
              <Field label="ZIP Code" error={errors.zip?.message}>
                <Input {...register("zip")} placeholder="62701" />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Inspection Info ────────────────────────────────────────── */}
        <TabsContent value="source" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Info</CardTitle>
              <CardDescription>Link an inspector from the roster and set the inspection date.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <Field label="Inspector (from roster)">
                  <Select
                    value={watched.inspectorId ?? ""}
                    onValueChange={(v) => {
                      setValue("inspectorId", v ?? "");
                      const found = inspectors.find((i) => i.id === v);
                      if (found) {
                        setValue("inspectorName", found.name);
                        setValue("inspectionCompany", found.company ?? "");
                      }
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <span className={`flex-1 text-left truncate ${!watched.inspectorId ? "text-muted-foreground" : ""}`}>
                        {watched.inspectorId
                          ? (() => {
                              const found = inspectors.find((i) => i.id === watched.inspectorId);
                              return found ? `${found.name}${found.company ? ` — ${found.company}` : ""}` : "Select inspector…";
                            })()
                          : "Select inspector…"}
                      </span>
                    </SelectTrigger>
                    <SelectContent className="min-w-80">
                      {inspectors.map((inspector) => (
                        <SelectItem key={inspector.id} value={inspector.id}>
                          {inspector.name}{inspector.company ? ` — ${inspector.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Field label="Inspector Name">
                <Input {...register("inspectorName")} placeholder="Auto-filled from selection" readOnly className="bg-muted/50 cursor-default" />
              </Field>
              <Field label="Inspection Company">
                <Input {...register("inspectionCompany")} placeholder="Auto-filled from selection" readOnly className="bg-muted/50 cursor-default" />
              </Field>
              <Field label="Inspection Date" error={errors.inspectionDate?.message} required>
                <Input {...register("inspectionDate")} type="date" />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 3: Well System ────────────────────────────────────────────── */}
        <TabsContent value="well" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Well System</CardTitle>
              <CardDescription>Basic physical characteristics of the well.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Well Type" error={errors.wellType?.message}>
                <FormSelect
                  value={watched.wellType ?? ""}
                  onChange={(v) => setValue("wellType", v)}
                  options={WELL_TYPE_OPTIONS}
                />
              </Field>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">Well Depth</Label>
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    {...register("wellDepthFt", {
                      setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                    })}
                    placeholder="ft"
                    disabled={watched.wellDepthUnknown}
                    className="flex-1"
                  />
                  <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                    <input
                      type="checkbox"
                      {...register("wellDepthUnknown")}
                      className="rounded"
                    />
                    Unknown
                  </label>
                </div>
                <p className="text-xs text-muted-foreground">Depths &lt;100 ft and 100–500 ft pass. &gt;500 ft needs attention.</p>
              </div>

              <Field label="Pump Type">
                <FormSelect
                  value={watched.pumpType ?? ""}
                  onChange={(v) => setValue("pumpType", v)}
                  options={PUMP_TYPE_OPTIONS}
                  placeholder="Select pump type"
                />
              </Field>

              <Field label="Pump Manufacturer">
                <FormSelect
                  value={watched.pumpManufacturer ?? ""}
                  onChange={(v) => setValue("pumpManufacturer", v)}
                  options={PUMP_MANUFACTURER_OPTIONS}
                  placeholder="Select manufacturer"
                />
              </Field>

              <Field label="Pump HP">
                <FormSelect
                  value={watched.pumpHp ?? ""}
                  onChange={(v) => setValue("pumpHp", v)}
                  options={PUMP_HP_OPTIONS}
                  placeholder="Select HP"
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: External Equipment ─────────────────────────────────────── */}
        <TabsContent value="external" className="mt-4">
          <Card>
            <SectionHeader
              title="External Equipment"
              description="Visible external components of the well. All fields required for a Pass result."
              status={calc.externalEquipmentStatus}
            />
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Well history */}
              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">Well Completion Date</Label>
                <div className="flex items-center gap-3">
                  <Input
                    {...register("wellCompletionDate")}
                    placeholder="e.g. 2010 or Oct 2015"
                    disabled={watched.wellCompletionDateUnknown}
                    className="flex-1"
                  />
                  <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                    <input type="checkbox" {...register("wellCompletionDateUnknown")} className="rounded" />
                    Unknown
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label className="text-sm font-medium">Well Permit (Date / #)</Label>
                <div className="flex items-center gap-3">
                  <Input
                    {...register("wellPermit")}
                    placeholder="Permit date or number"
                    disabled={watched.wellPermitUnknown}
                    className="flex-1"
                  />
                  <label className="flex items-center gap-2 text-sm cursor-pointer whitespace-nowrap">
                    <input type="checkbox" {...register("wellPermitUnknown")} className="rounded" />
                    Unknown
                  </label>
                </div>
              </div>

              <Field label="Data Source">
                <FormSelect
                  value={watched.wellDataSource ?? ""}
                  onChange={(v) => setValue("wellDataSource", v)}
                  options={WELL_DATA_SOURCE_OPTIONS}
                  placeholder="Select data source"
                />
              </Field>

              <Field
                label="Distance from House (ft)"
              >
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  {...register("distanceFromHouseFt", {
                    setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                  })}
                  placeholder="e.g. 25"
                />
              </Field>

              {/* Obstructions & cap */}
              <Field label="Well Obstructions">
                <FormSelect
                  value={watched.wellObstructions ?? ""}
                  onChange={(v) => setValue("wellObstructions", v)}
                  options={WELL_OBSTRUCTION_OPTIONS}
                />
              </Field>
              <Field label="Well Cap" hint="Sealed / Bored Well / Not Applicable / Secured all pass.">
                <FormSelect
                  value={watched.wellCap ?? ""}
                  onChange={(v) => setValue("wellCap", v)}
                  options={WELL_CAP_OPTIONS}
                />
              </Field>

              {/* Casing */}
              <Field
                label="Height of Casing Above Ground (in)"
                hint="Must be greater than 6 inches to pass."
              >
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  {...register("casingHeightInches", {
                    setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                  })}
                  placeholder="e.g. 8"
                />
              </Field>

              <Field label="Casing Type">
                <FormSelect
                  value={watched.casingType ?? ""}
                  onChange={(v) => setValue("casingType", v)}
                  options={CASING_TYPE_OPTIONS}
                  placeholder="Select casing type"
                />
              </Field>

              <Field label="Casing Size">
                <FormSelect
                  value={watched.casingSize ?? ""}
                  onChange={(v) => setValue("casingSize", v)}
                  options={CASING_SIZE_OPTIONS}
                  placeholder="Select casing size"
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 5: Internal Equipment ─────────────────────────────────────── */}
        <TabsContent value="internal" className="mt-4">
          <Card>
            <SectionHeader
              title="Internal Equipment"
              description="Internal mechanical components. Amperage, tank, control box, pressure switch and gauge."
              status={calc.internalEquipmentStatus}
            />
            <CardContent className="flex flex-col gap-5">
              {/* Constant Pressure System toggle — affects pressure switch/gauge requirements */}
              <div className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Constant Pressure System</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    When enabled, Pressure Switch, Pressure Gauge, and Cycle Time automatically pass.
                  </p>
                </div>
                <Switch
                  checked={watched.constantPressureSystem ?? false}
                  onCheckedChange={(v) => setValue("constantPressureSystem", v)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field
                  label="Amperage Reading (amps)"
                  hint="Readings below 12 amps pass (covers all valid ranges: <5, 5–7.49, 7.5–9.99, 10–11.99)."
                >
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    {...register("amperageReading", {
                      setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                    })}
                    placeholder="e.g. 6.2"
                  />
                </Field>
                <Field label="Tank Condition" hint="Good, Fair, or Poor all pass.">
                  <FormSelect
                    value={watched.tankCondition ?? ""}
                    onChange={(v) => setValue("tankCondition", v)}
                    options={TANK_CONDITION_OPTIONS}
                  />
                </Field>
                <Field label="Tank Brand">
                  <FormSelect
                    value={watched.tankBrand ?? ""}
                    onChange={(v) => setValue("tankBrand", v)}
                    options={TANK_BRAND_OPTIONS}
                    placeholder="Select brand"
                  />
                </Field>
                <Field label="Tank Model">
                  <Input {...register("tankModel")} placeholder="e.g. WX-202" />
                </Field>
                <Field label="Tank Size (Gal)">
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    {...register("tankSizeGal", {
                      setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                    })}
                    placeholder="e.g. 44"
                  />
                </Field>
                <Field label="PSI Settings">
                  <FormSelect
                    value={watched.psiSettings ?? ""}
                    onChange={(v) => setValue("psiSettings", v)}
                    options={PSI_SETTINGS_OPTIONS}
                    placeholder="Select PSI settings"
                  />
                </Field>
                <Field label="Control Box Condition">
                  <FormSelect
                    value={watched.controlBoxCondition ?? ""}
                    onChange={(v) => setValue("controlBoxCondition", v)}
                    options={CONTROL_BOX_OPTIONS}
                  />
                </Field>
                <Field label="Water Treatment">
                  <FormSelect
                    value={watched.waterTreatment ?? ""}
                    onChange={(v) => setValue("waterTreatment", v)}
                    options={WATER_TREATMENT_OPTIONS}
                    placeholder="Select treatment type"
                  />
                </Field>
                <Field label="Wire Type">
                  <FormSelect
                    value={watched.wireType ?? ""}
                    onChange={(v) => setValue("wireType", v)}
                    options={WIRE_TYPE_OPTIONS}
                    placeholder="Select wire type"
                  />
                </Field>
                <Field label="Pressure Switch">
                  <FormSelect
                    value={watched.pressureSwitch ?? ""}
                    onChange={(v) => setValue("pressureSwitch", v)}
                    options={PRESSURE_COMPONENT_OPTIONS}
                  />
                </Field>
                <Field label="Pressure Gauge">
                  <FormSelect
                    value={watched.pressureGauge ?? ""}
                    onChange={(v) => setValue("pressureGauge", v)}
                    options={PRESSURE_COMPONENT_OPTIONS}
                  />
                </Field>
              </div>

              {watched.constantPressureSystem && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground p-3 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-700">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-blue-500" />
                  Pressure Switch and Pressure Gauge are overridden to Pass because Constant Pressure System is enabled.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 6: Cycle Test ─────────────────────────────────────────────── */}
        <TabsContent value="cycle" className="mt-4">
          <Card>
            <SectionHeader
              title="Cycle Test"
              description="Record seconds to high and low pressure readings. Cycle Time = high + low. Valid range: 30–420 seconds."
              status={calc.cycleTimeStatus}
            />
            <CardContent className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field label="Seconds to High Reading">
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    {...register("secondsToHighReading", {
                      setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                    })}
                    placeholder="e.g. 180"
                  />
                </Field>
                <Field label="Seconds to Low Reading">
                  <Input
                    type="number"
                    min={0}
                    step="0.1"
                    {...register("secondsToLowReading", {
                      setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                    })}
                    placeholder="e.g. 120"
                  />
                </Field>
              </div>

              <Separator />

              {/* Live formula: High + Low = Cycle Time */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  {/* High reading pill */}
                  <div className="flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-lg bg-muted/60 border min-w-[88px]">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">High</span>
                    <span className="text-xl font-bold tabular-nums leading-none mt-0.5">
                      {watched.secondsToHighReading != null
                        ? watched.secondsToHighReading
                        : <span className="text-muted-foreground text-sm font-normal">—</span>}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">sec</span>
                  </div>

                  <span className="text-2xl font-light text-muted-foreground select-none">+</span>

                  {/* Low reading pill */}
                  <div className="flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-lg bg-muted/60 border min-w-[88px]">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Low</span>
                    <span className="text-xl font-bold tabular-nums leading-none mt-0.5">
                      {watched.secondsToLowReading != null
                        ? watched.secondsToLowReading
                        : <span className="text-muted-foreground text-sm font-normal">—</span>}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">sec</span>
                  </div>

                  <span className="text-2xl font-light text-muted-foreground select-none">=</span>

                  {/* Cycle Time result pill — color coded */}
                  <div className={cn(
                    "flex flex-col items-center gap-0.5 px-4 py-2.5 rounded-lg border min-w-[100px]",
                    calc.cycleTime == null
                      ? "bg-muted/60"
                      : calc.cycleTimeStatus === "pass"
                      ? "bg-green-50 border-green-200 dark:bg-green-900/15 dark:border-green-800"
                      : "bg-amber-50 border-amber-200 dark:bg-amber-900/15 dark:border-amber-800"
                  )}>
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Cycle Time</span>
                    <span className={cn(
                      "text-xl font-bold tabular-nums leading-none mt-0.5",
                      calc.cycleTimeStatus === "pass" ? "text-green-700 dark:text-green-400"
                        : calc.cycleTimeStatus === "needs_attention" ? "text-amber-700 dark:text-amber-400"
                        : ""
                    )}>
                      {calc.cycleTime != null
                        ? calc.cycleTime
                        : <span className="text-muted-foreground text-sm font-normal">—</span>}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">sec</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">
                    Valid range: <span className="font-semibold text-foreground">30 – 420 seconds.</span>
                    {watched.constantPressureSystem && (
                      <span className="italic ml-1">Overridden — Constant Pressure System active.</span>
                    )}
                  </p>
                  <CategoryBadge status={calc.cycleTimeStatus} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 7: Yield Tests ────────────────────────────────────────────── */}
        <TabsContent value="yield" className="mt-4">
          <Card>
            <SectionHeader
              title="Yield Tests"
              description="Record sequential pump tests. Well Yield ≥ 1.0 gpm, Total Gallons ≥ 350, and Avg Minutes to 350 Gal ≤ 120 are required to pass."
              status={calc.wellYieldStatus}
            />
            <CardContent className="flex flex-col gap-6">
              <Field label="Test Method">
                <FormSelect
                  value={watched.yieldTestType ?? ""}
                  onChange={(v) => setValue("yieldTestType", v)}
                  options={YIELD_TEST_TYPE_OPTIONS}
                  placeholder="Select test method…"
                />
              </Field>

              <YieldTestTable form={form as unknown as import("react-hook-form").UseFormReturn<import("@/types/inspection").InspectionFormValues>} />

              <Separator />

              {/* Computed outputs */}
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Computed Results</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <ComputedValue
                    label="Well Yield"
                    value={calc.wellYieldGpm}
                    unit="gpm"
                    pass={calc.wellYieldGpm != null && calc.wellYieldGpm >= 1.0}
                    warn={calc.wellYieldGpm != null && calc.wellYieldGpm < 1.0}
                  />
                  <ComputedValue
                    label="Total Gallons"
                    value={calc.totalGallons}
                    unit="gal"
                    pass={calc.totalGallons != null && calc.totalGallons >= 350}
                    warn={calc.totalGallons != null && calc.totalGallons < 350}
                  />
                  <ComputedValue
                    label="Avg Min to 350 Gal"
                    value={calc.avgMinutesToReach350 != null ? parseFloat(calc.avgMinutesToReach350.toFixed(1)) : null}
                    unit="min"
                    pass={calc.avgMinutesToReach350 != null && calc.avgMinutesToReach350 <= 120}
                    warn={calc.avgMinutesToReach350 != null && calc.avgMinutesToReach350 > 120}
                  />
                  <ComputedValue
                    label="Gallons Per Day"
                    value={calc.gallonsPerDay}
                    unit="gal/day"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-0.5 p-3 rounded-lg bg-muted/50 border">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium">Well Yield Status</span>
                <div className="mt-1">
                  <CategoryBadge status={calc.wellYieldStatus} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 8: Notes ──────────────────────────────────────────────────── */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes & Findings</CardTitle>
              <CardDescription>Inspector findings, internal notes, and member-facing summary.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5">
              <Field label="Inspector Notes">
                <Textarea {...register("inspectorNotes")} rows={4} placeholder="Inspector's observations and findings…" />
              </Field>
              <Field label="Internal Reviewer Notes">
                <Textarea {...register("internalReviewerNotes")} rows={3} placeholder="Internal team notes (not shown to member)…" />
              </Field>
              <Separator />
              <Field label="Required Repairs">
                <Textarea {...register("requiredRepairs")} rows={3} placeholder="Repairs that must be completed before coverage…" />
              </Field>
              <Field label="Recommended Repairs / Updates">
                <Textarea {...register("recommendedRepairs")} rows={3} placeholder="Non-blocking but recommended actions…" />
              </Field>
              <Separator />
              <Field label="Member-Facing Summary">
                <Textarea {...register("memberFacingSummary")} rows={4} placeholder="Plain-language summary for the member PDF report…" />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 9: Photos ─────────────────────────────────────────────────── */}
        <TabsContent value="photos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Photos</CardTitle>
              <CardDescription>Upload photos included in the PDF report. Saved immediately on upload.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              {PHOTO_LABELS.map(({ key: label, label: display }) => {
                const existing = uploadedPhotos.find((p) => p.label === label);
                return (
                  <div key={label} className="flex flex-col gap-2">
                    <Label className="text-sm font-medium">{display}</Label>
                    {existing ? (
                      <div className="relative w-48 h-32 rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={existing.url} alt={display} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={async () => {
                            if (existing.id) {
                              try { await fetch(`/api/photos?id=${existing.id}`, { method: "DELETE" }); } catch { /* best-effort */ }
                            }
                            setUploadedPhotos((prev) => prev.filter((p) => !(p.label === label && p.url === existing.url)));
                          }}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 hover:bg-black"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        {uploadingPhoto ? (
                          <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                        ) : (
                          <>
                            <UploadCloud className="w-6 h-6 text-muted-foreground mb-1" />
                            <span className="text-xs text-muted-foreground">Click to upload</span>
                          </>
                        )}
                        <input type="file" accept="image/*" className="sr-only" disabled={uploadingPhoto} onChange={(e) => handlePhotoUpload(e, label)} />
                      </label>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 10: Review & Status ───────────────────────────────────────── */}
        <TabsContent value="review" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Computed tier summary */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle className="text-base">Live Eligibility Summary</CardTitle>
                    <CardDescription>Updates in real-time as you fill in inspection data.</CardDescription>
                  </div>
                  {calc.membershipTier && (
                    <Badge
                      className={
                        calc.membershipTier === "premium"
                          ? "bg-green-100 text-green-700 border-green-300"
                          : calc.membershipTier === "superior"
                          ? "bg-yellow-100 text-yellow-700 border-yellow-300"
                          : calc.membershipTier === "ineligible"
                          ? "bg-red-100 text-red-700 border-red-300"
                          : "bg-blue-100 text-blue-700 border-blue-300"
                      }
                    >
                      {STATUS_LABELS[
                        calc.membershipTier === "premium" ? "green"
                        : calc.membershipTier === "superior" ? "yellow"
                        : calc.membershipTier === "ineligible" ? "ineligible"
                        : "red"
                      ]} Tier
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground font-medium">External Equipment</span>
                    <CategoryBadge status={calc.externalEquipmentStatus} size="sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground font-medium">Internal Equipment</span>
                    <CategoryBadge status={calc.internalEquipmentStatus} size="sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground font-medium">Cycle Time</span>
                    <CategoryBadge status={calc.cycleTimeStatus} size="sm" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground font-medium">Well Yield</span>
                    <CategoryBadge status={calc.wellYieldStatus} size="sm" />
                  </div>
                </div>
                {calc.statusRationale.length > 0 && (
                  <ul className="mt-4 space-y-1">
                    {calc.statusRationale.map((r, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                        <span className="shrink-0">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity</CardTitle>
                <CardDescription>Classify the operational activity type.</CardDescription>
              </CardHeader>
              <CardContent>
                <Field label="Activity Type">
                  <FormSelect
                    value={watched.activity ?? ""}
                    onChange={(v) => setValue("activity", v)}
                    options={ACTIVITY_OPTIONS}
                  />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Approval Override</CardTitle>
                <CardDescription>
                  Override the computed approval status. Leave blank to use the system-computed result.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>System suggests:</span>
                  <StatusBadge status={calc.systemStatus} size="sm" />
                </div>
                <Field label="Final Approval Override">
                  <Select
                    value={watched.finalStatus ?? ""}
                    onValueChange={(v) => setValue("finalStatus", (v ?? "") as "green" | "yellow" | "red" | "ineligible" | "")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Use system-computed (recommended)" />
                    </SelectTrigger>
                    <SelectContent>
                      {FINAL_STATUS_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {watched.finalStatus && (
                  <Field label="Override Reason">
                    <Textarea {...register("overrideReason")} rows={3} placeholder="Explain why the system recommendation was overridden…" />
                  </Field>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GoHighLevel Integration</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Field label="GHL Contact ID">
                  <Input {...register("ghlContactId")} placeholder="GHL contact ID (optional)" />
                </Field>
                <Field label="GHL Opportunity ID">
                  <Input {...register("ghlOpportunityId")} placeholder="GHL opportunity ID (optional)" />
                </Field>
                <Field label="GHL Location ID">
                  <Input {...register("ghlLocationId")} placeholder="GHL location ID (optional)" />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Record Status</CardTitle>
                <CardDescription>Save as draft to continue editing, or finalize to lock the record.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-medium">Save as Draft</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Draft records are excluded from reporting until finalized</p>
                  </div>
                  <Switch
                    checked={watched.isDraft ?? true}
                    onCheckedChange={(v) => setValue("isDraft", v)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Form actions ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={submitting}
          onClick={handleSubmit((v: FormValues) => onSubmit(v, true))}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Save Draft
        </Button>
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          {mode === "create" ? "Create Record" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
