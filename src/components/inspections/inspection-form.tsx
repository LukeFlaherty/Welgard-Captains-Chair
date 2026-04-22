"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, CheckCircle, UploadCloud, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

import { StatusBadge } from "./status-badge";
import { evaluateInspection } from "@/lib/rules-engine";
import { createInspection, updateInspection } from "@/actions/inspections";
import type { InspectionFormValues, ConditionRating, InspectionStatus } from "@/types/inspection";
import type { InspectionWithRelations } from "@/types/inspection";

// ─── Zod schema ───────────────────────────────────────────────────────────────

const schema = z.object({
  inspectorId: z.string().optional(),
  homeownerName: z.string().min(1, "Owner name is required"),
  homeownerEmail: z.string().email("Invalid email").or(z.literal("")).optional(),
  homeownerPhone: z.string().optional(),
  propertyAddress: z.string().min(1, "Property address is required"),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  inspectorName: z.string().optional(),
  inspectionCompany: z.string().optional(),
  inspectionDate: z.string().min(1, "Inspection date is required"),
  wellType: z.string().optional(),
  wellDepthFt: z.string().optional(),
  pumpType: z.string().optional(),
  pumpAgeYears: z.string().optional(),
  pressureTankAgeYears: z.string().optional(),
  casingCondition: z.enum(["good", "fair", "poor", ""]).optional(),
  wellCapCondition: z.enum(["good", "fair", "poor", ""]).optional(),
  wiringCondition: z.enum(["good", "fair", "poor", ""]).optional(),
  // Booleans without .default() — defaults set in useForm defaultValues
  visibleLeaks: z.boolean(),
  safetyIssues: z.boolean(),
  contaminationRisk: z.boolean(),
  systemOperational: z.boolean(),
  pressureOk: z.boolean(),
  flowOk: z.boolean(),
  siteClearanceOk: z.boolean(),
  inspectorNotes: z.string().optional(),
  internalReviewerNotes: z.string().optional(),
  requiredRepairs: z.string().optional(),
  recommendedRepairs: z.string().optional(),
  memberFacingSummary: z.string().optional(),
  finalStatus: z.enum(["green", "yellow", "red", ""]).optional(),
  overrideReason: z.string().optional(),
  ghlContactId: z.string().optional(),
  ghlOpportunityId: z.string().optional(),
  ghlLocationId: z.string().optional(),
  isDraft: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

// ─── Helper sub-components ────────────────────────────────────────────────────

function Field({
  label,
  error,
  children,
  required,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function SwitchField({
  label,
  description,
  checked,
  onChange,
  danger,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b last:border-b-0">
      <div className="flex-1">
        <p className={`text-sm font-medium ${danger ? "text-destructive" : ""}`}>{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ConditionSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string | null) => void;
}) {
  return (
    <Select value={value || ""} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select condition" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="good">Good</SelectItem>
        <SelectItem value="fair">Fair</SelectItem>
        <SelectItem value="poor">Poor</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ─── Live score preview ───────────────────────────────────────────────────────

function ScorePreview({ values }: { values: Partial<FormValues> }) {
  const result = evaluateInspection({
    visibleLeaks: values.visibleLeaks,
    safetyIssues: values.safetyIssues,
    contaminationRisk: values.contaminationRisk,
    systemOperational: values.systemOperational,
    pressureOk: values.pressureOk,
    flowOk: values.flowOk,
    siteClearanceOk: values.siteClearanceOk,
    casingCondition: values.casingCondition || null,
    wellCapCondition: values.wellCapCondition || null,
    wiringCondition: values.wiringCondition || null,
    pumpAgeYears: values.pumpAgeYears ? parseInt(values.pumpAgeYears) : null,
    pressureTankAgeYears: values.pressureTankAgeYears
      ? parseInt(values.pressureTankAgeYears)
      : null,
  });

  return (
    <Card className="border-dashed">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Live Status Preview</CardTitle>
          <StatusBadge status={result.status} size="sm" />
        </div>
        <CardDescription className="text-xs">
          System score: <strong>{result.score}/100</strong>
        </CardDescription>
      </CardHeader>
      {result.rationale.length > 0 && (
        <CardContent className="pt-0">
          <ul className="space-y-1">
            {result.rationale.map((r, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                <span className="mt-0.5 shrink-0">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

type InspectorOption = { id: string; name: string; company: string | null };

type Props = {
  mode: "create" | "edit";
  inspection?: InspectionWithRelations;
  inspectors?: InspectorOption[];
};

function toFormValues(inspection: InspectionWithRelations): FormValues {
  return {
    inspectorId: inspection.inspectorId ?? "",
    homeownerName: inspection.homeownerName,
    homeownerEmail: inspection.homeownerEmail ?? "",
    homeownerPhone: inspection.homeownerPhone ?? "",
    propertyAddress: inspection.propertyAddress,
    city: inspection.city ?? "",
    state: inspection.state ?? "",
    zip: inspection.zip ?? "",
    inspectorName: inspection.inspectorName ?? "",
    inspectionCompany: inspection.inspectionCompany ?? "",
    inspectionDate: inspection.inspectionDate
      ? new Date(inspection.inspectionDate).toISOString().slice(0, 10)
      : "",
    wellType: inspection.wellType ?? "",
    wellDepthFt: inspection.wellDepthFt?.toString() ?? "",
    pumpType: inspection.pumpType ?? "",
    pumpAgeYears: inspection.pumpAgeYears?.toString() ?? "",
    pressureTankAgeYears: inspection.pressureTankAgeYears?.toString() ?? "",
    casingCondition: (inspection.casingCondition as ConditionRating | "") ?? "",
    wellCapCondition: (inspection.wellCapCondition as ConditionRating | "") ?? "",
    wiringCondition: (inspection.wiringCondition as ConditionRating | "") ?? "",
    visibleLeaks: inspection.visibleLeaks,
    safetyIssues: inspection.safetyIssues,
    contaminationRisk: inspection.contaminationRisk,
    systemOperational: inspection.systemOperational,
    pressureOk: inspection.pressureOk,
    flowOk: inspection.flowOk,
    siteClearanceOk: inspection.siteClearanceOk,
    inspectorNotes: inspection.inspectorNotes ?? "",
    internalReviewerNotes: inspection.internalReviewerNotes ?? "",
    requiredRepairs: inspection.requiredRepairs ?? "",
    recommendedRepairs: inspection.recommendedRepairs ?? "",
    memberFacingSummary: inspection.memberFacingSummary ?? "",
    finalStatus: (inspection.finalStatus as InspectionStatus | "") ?? "",
    overrideReason: inspection.overrideReason ?? "",
    ghlContactId: inspection.ghlContactId ?? "",
    ghlOpportunityId: inspection.ghlOpportunityId ?? "",
    ghlLocationId: inspection.ghlLocationId ?? "",
    isDraft: inspection.isDraft,
  };
}

export function InspectionForm({ mode, inspection, inspectors = [] }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState<
    { url: string; label: string }[]
  >(
    inspection?.photos.map((p: { url: string; label: string | null }) => ({
      url: p.url,
      label: p.label ?? "additional",
    })) ?? []
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues:
      mode === "edit" && inspection
        ? toFormValues(inspection)
        : {
            inspectorId: "",
            homeownerName: "",
            homeownerEmail: "",
            homeownerPhone: "",
            propertyAddress: "",
            city: "",
            state: "",
            zip: "",
            inspectorName: "",
            inspectionCompany: "",
            inspectionDate: new Date().toISOString().slice(0, 10),
            wellType: "",
            wellDepthFt: "",
            pumpType: "",
            pumpAgeYears: "",
            pressureTankAgeYears: "",
            casingCondition: "",
            wellCapCondition: "",
            wiringCondition: "",
            visibleLeaks: false,
            safetyIssues: false,
            contaminationRisk: false,
            systemOperational: true,
            pressureOk: true,
            flowOk: true,
            siteClearanceOk: true,
            inspectorNotes: "",
            internalReviewerNotes: "",
            requiredRepairs: "",
            recommendedRepairs: "",
            memberFacingSummary: "",
            finalStatus: "",
            overrideReason: "",
            ghlContactId: "",
            ghlOpportunityId: "",
            ghlLocationId: "",
            isDraft: true,
          },
  });

  const watched = watch();

  async function handlePhotoUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    label: string
  ) {
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
        setUploadedPhotos((prev) => [...prev, { url: json.url, label }]);
        toast.success("Photo uploaded.");
      } else {
        toast.error("Upload failed.");
      }
    } catch {
      toast.error("Upload failed.");
    } finally {
      setUploadingPhoto(false);
      e.target.value = "";
    }
  }

  async function onSubmit(values: FormValues, isDraft: boolean) {
    setSubmitting(true);
    const payload: InspectionFormValues = {
      ...values,
      isDraft,
      inspectorId: values.inspectorId ?? "",
      homeownerEmail: values.homeownerEmail ?? "",
      homeownerPhone: values.homeownerPhone ?? "",
      city: values.city ?? "",
      state: values.state ?? "",
      zip: values.zip ?? "",
      inspectorName: values.inspectorName ?? "",
      inspectionCompany: values.inspectionCompany ?? "",
      wellType: values.wellType ?? "",
      wellDepthFt: values.wellDepthFt ?? "",
      pumpType: values.pumpType ?? "",
      pumpAgeYears: values.pumpAgeYears ?? "",
      pressureTankAgeYears: values.pressureTankAgeYears ?? "",
      casingCondition: (values.casingCondition as ConditionRating | "") ?? "",
      wellCapCondition: (values.wellCapCondition as ConditionRating | "") ?? "",
      wiringCondition: (values.wiringCondition as ConditionRating | "") ?? "",
      inspectorNotes: values.inspectorNotes ?? "",
      internalReviewerNotes: values.internalReviewerNotes ?? "",
      requiredRepairs: values.requiredRepairs ?? "",
      recommendedRepairs: values.recommendedRepairs ?? "",
      memberFacingSummary: values.memberFacingSummary ?? "",
      finalStatus: (values.finalStatus as InspectionStatus | "") ?? "",
      overrideReason: values.overrideReason ?? "",
      ghlContactId: values.ghlContactId ?? "",
      ghlOpportunityId: values.ghlOpportunityId ?? "",
      ghlLocationId: values.ghlLocationId ?? "",
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
        <TabsList className="flex-wrap h-auto gap-1 mb-2">
          <TabsTrigger value="member">Member & Property</TabsTrigger>
          <TabsTrigger value="source">Inspection Source</TabsTrigger>
          <TabsTrigger value="well">Well System</TabsTrigger>
          <TabsTrigger value="conditions">Conditions</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="review">Review & Status</TabsTrigger>
        </TabsList>

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
                <Input
                  {...register("homeownerEmail")}
                  type="email"
                  placeholder="jane@example.com"
                />
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
              <Field label="State" error={errors.state?.message}>
                <Input {...register("state")} placeholder="IL" maxLength={2} />
              </Field>
              <Field label="ZIP Code" error={errors.zip?.message}>
                <Input {...register("zip")} placeholder="62701" />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 2: Inspection Source ──────────────────────────────────────── */}
        <TabsContent value="source" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Source</CardTitle>
              <CardDescription>Link an inspector from the roster and set the inspection date.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Inspector dropdown — spans full width */}
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
                    <SelectTrigger>
                      <SelectValue placeholder="Select inspector…" />
                    </SelectTrigger>
                    <SelectContent>
                      {inspectors.map((inspector) => (
                        <SelectItem key={inspector.id} value={inspector.id}>
                          {inspector.name}
                          {inspector.company ? ` — ${inspector.company}` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              {/* Name + Company are auto-filled but remain editable */}
              <Field label="Inspector Name" error={errors.inspectorName?.message}>
                <Input {...register("inspectorName")} placeholder="John Doe" />
              </Field>
              <Field label="Inspection Company" error={errors.inspectionCompany?.message}>
                <Input {...register("inspectionCompany")} placeholder="ABC Well Services" />
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
              <CardTitle>Well System Details</CardTitle>
              <CardDescription>Physical characteristics of the well system.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Field label="Well Type" error={errors.wellType?.message}>
                <Select
                  value={watched.wellType ?? ""}
                  onValueChange={(v) => setValue("wellType", v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="drilled">Drilled</SelectItem>
                    <SelectItem value="dug">Dug</SelectItem>
                    <SelectItem value="bored">Bored</SelectItem>
                    <SelectItem value="driven">Driven Point</SelectItem>
                    <SelectItem value="artesian">Artesian</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Well Depth (ft)" error={errors.wellDepthFt?.message}>
                <Input
                  {...register("wellDepthFt")}
                  type="number"
                  min={0}
                  step="0.1"
                  placeholder="e.g. 120"
                />
              </Field>
              <Field label="Pump Type" error={errors.pumpType?.message}>
                <Select
                  value={watched.pumpType ?? ""}
                  onValueChange={(v) => setValue("pumpType", v ?? "")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="submersible">Submersible</SelectItem>
                    <SelectItem value="jet">Jet Pump</SelectItem>
                    <SelectItem value="hand">Hand Pump</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Pump Age (years)" error={errors.pumpAgeYears?.message}>
                <Input
                  {...register("pumpAgeYears")}
                  type="number"
                  min={0}
                  placeholder="e.g. 8"
                />
              </Field>
              <Field
                label="Pressure Tank Age (years)"
                error={errors.pressureTankAgeYears?.message}
              >
                <Input
                  {...register("pressureTankAgeYears")}
                  type="number"
                  min={0}
                  placeholder="e.g. 5"
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 4: Conditions ─────────────────────────────────────────────── */}
        <TabsContent value="conditions" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card>
              <CardHeader>
                <CardTitle>Physical Condition Ratings</CardTitle>
                <CardDescription>Rate visible component conditions.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <Field label="Casing Condition" error={errors.casingCondition?.message}>
                  <ConditionSelect
                    value={watched.casingCondition ?? ""}
                    onChange={(v) => setValue("casingCondition", (v ?? "") as ConditionRating | "")}
                  />
                </Field>
                <Field label="Well Cap Condition" error={errors.wellCapCondition?.message}>
                  <ConditionSelect
                    value={watched.wellCapCondition ?? ""}
                    onChange={(v) => setValue("wellCapCondition", (v ?? "") as ConditionRating | "")}
                  />
                </Field>
                <Field label="Wiring Condition" error={errors.wiringCondition?.message}>
                  <ConditionSelect
                    value={watched.wiringCondition ?? ""}
                    onChange={(v) => setValue("wiringCondition", (v ?? "") as ConditionRating | "")}
                  />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Safety & Operational Checks</CardTitle>
                <CardDescription>
                  Toggle items that apply. Safety issues immediately disqualify coverage.
                </CardDescription>
              </CardHeader>
              <CardContent className="divide-y">
                <SwitchField
                  label="Safety Issues Present"
                  description="Immediate disqualifier for coverage"
                  checked={watched.safetyIssues ?? false}
                  onChange={(v) => setValue("safetyIssues", v)}
                  danger
                />
                <SwitchField
                  label="Contamination Risk Identified"
                  description="Immediate disqualifier for coverage"
                  checked={watched.contaminationRisk ?? false}
                  onChange={(v) => setValue("contaminationRisk", v)}
                  danger
                />
                <SwitchField
                  label="Visible Leaks Present"
                  checked={watched.visibleLeaks ?? false}
                  onChange={(v) => setValue("visibleLeaks", v)}
                />
                <SwitchField
                  label="System Operational"
                  description="Uncheck if non-operational — immediate disqualifier"
                  checked={watched.systemOperational ?? true}
                  onChange={(v) => setValue("systemOperational", v)}
                />
                <SwitchField
                  label="Pressure Within Range"
                  checked={watched.pressureOk ?? true}
                  onChange={(v) => setValue("pressureOk", v)}
                />
                <SwitchField
                  label="Flow Rate Acceptable"
                  checked={watched.flowOk ?? true}
                  onChange={(v) => setValue("flowOk", v)}
                />
                <SwitchField
                  label="Site Clearance Requirements Met"
                  checked={watched.siteClearanceOk ?? true}
                  onChange={(v) => setValue("siteClearanceOk", v)}
                />
              </CardContent>
            </Card>

            <div className="lg:col-span-2">
              <ScorePreview values={watched} />
            </div>
          </div>
        </TabsContent>

        {/* ── Tab 5: Notes ──────────────────────────────────────────────────── */}
        <TabsContent value="notes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Notes & Findings</CardTitle>
              <CardDescription>
                Inspector findings, internal notes, and member-facing summary.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5">
              <Field label="Inspector Notes" error={errors.inspectorNotes?.message}>
                <Textarea
                  {...register("inspectorNotes")}
                  rows={4}
                  placeholder="Inspector's observations and findings..."
                />
              </Field>
              <Field
                label="Internal Reviewer Notes"
                error={errors.internalReviewerNotes?.message}
              >
                <Textarea
                  {...register("internalReviewerNotes")}
                  rows={3}
                  placeholder="Internal team notes (not shown to member)..."
                />
              </Field>
              <Separator />
              <Field label="Required Repairs" error={errors.requiredRepairs?.message}>
                <Textarea
                  {...register("requiredRepairs")}
                  rows={3}
                  placeholder="List repairs that must be completed before coverage..."
                />
              </Field>
              <Field label="Recommended Repairs / Updates" error={errors.recommendedRepairs?.message}>
                <Textarea
                  {...register("recommendedRepairs")}
                  rows={3}
                  placeholder="Non-blocking but recommended actions..."
                />
              </Field>
              <Separator />
              <Field
                label="Member-Facing Summary"
                error={errors.memberFacingSummary?.message}
              >
                <Textarea
                  {...register("memberFacingSummary")}
                  rows={4}
                  placeholder="Plain-language summary that will appear on the member PDF report..."
                />
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 6: Photos ─────────────────────────────────────────────────── */}
        <TabsContent value="photos" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Inspection Photos</CardTitle>
              <CardDescription>
                Upload photos to be included in the PDF report. Photos are saved
                immediately on upload.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6">
              {(
                [
                  { label: "property_front", display: "Property Front Photo" },
                  { label: "well_head", display: "Well Head Photo" },
                  { label: "pressure_system", display: "Pressure System Photo" },
                  { label: "additional", display: "Additional Photo" },
                ] as const
              ).map(({ label, display }) => {
                const existing = uploadedPhotos.find((p) => p.label === label);
                return (
                  <div key={label} className="flex flex-col gap-2">
                    <Label className="text-sm font-medium">{display}</Label>
                    {existing ? (
                      <div className="relative w-48 h-32 rounded-lg overflow-hidden border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={existing.url}
                          alt={display}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setUploadedPhotos((prev) =>
                              prev.filter(
                                (p) => !(p.label === label && p.url === existing.url)
                              )
                            )
                          }
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
                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          disabled={uploadingPhoto}
                          onChange={(e) => handlePhotoUpload(e, label)}
                        />
                      </label>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab 7: Review & Status ────────────────────────────────────────── */}
        <TabsContent value="review" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ScorePreview values={watched} />

            <Card>
              <CardHeader>
                <CardTitle>Status Override</CardTitle>
                <CardDescription>
                  Override the system-computed status. Provide a reason when overriding.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Field label="Final Status Override" error={errors.finalStatus?.message}>
                  <Select
                    value={watched.finalStatus ?? ""}
                    onValueChange={(v) =>
                      setValue("finalStatus", (v ?? "") as "green" | "yellow" | "red" | "")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Use system-computed (recommended)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="green">Green — Approved</SelectItem>
                      <SelectItem value="yellow">Yellow — Conditional</SelectItem>
                      <SelectItem value="red">Red — Not Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                {watched.finalStatus && (
                  <Field label="Override Reason" error={errors.overrideReason?.message}>
                    <Textarea
                      {...register("overrideReason")}
                      rows={3}
                      placeholder="Explain why the system recommendation was overridden..."
                    />
                  </Field>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>GoHighLevel Integration</CardTitle>
                <CardDescription>
                  Link this record to a GHL contact or opportunity for future sync.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Field label="GHL Contact ID" error={errors.ghlContactId?.message}>
                  <Input
                    {...register("ghlContactId")}
                    placeholder="GHL contact ID (optional)"
                  />
                </Field>
                <Field label="GHL Opportunity ID" error={errors.ghlOpportunityId?.message}>
                  <Input
                    {...register("ghlOpportunityId")}
                    placeholder="GHL opportunity ID (optional)"
                  />
                </Field>
                <Field label="GHL Location ID" error={errors.ghlLocationId?.message}>
                  <Input
                    {...register("ghlLocationId")}
                    placeholder="GHL location ID (optional)"
                  />
                </Field>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Record Status</CardTitle>
                <CardDescription>
                  Save as draft to continue editing, or finalize to lock and generate the PDF.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SwitchField
                  label="Save as Draft"
                  description="Draft records are excluded from reporting until finalized"
                  checked={watched.isDraft ?? true}
                  onChange={(v) => setValue("isDraft", v)}
                />
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
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle className="w-4 h-4" />
          )}
          {mode === "create" ? "Create Record" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
