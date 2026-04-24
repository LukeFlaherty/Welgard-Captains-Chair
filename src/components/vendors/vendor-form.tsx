"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, X } from "lucide-react";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createVendor, updateVendor } from "@/actions/vendors";
import type { VendorFormValues } from "@/actions/vendors";

// ─── Config ───────────────────────────────────────────────────────────────────

const VENDOR_TYPES = [
  "Contractor",
  "Inspector",
  "Water Treatment",
  "Real Estate Agent",
  "Admin",
  "Other",
];

const RATING_OPTIONS: { value: string; label: string; cls: string; activeCls: string }[] = [
  { value: "1", label: "★ 1 — Best",    cls: "border-green-300  text-green-700",  activeCls: "bg-green-100  border-green-400  text-green-800"  },
  { value: "2", label: "★ 2 — Average", cls: "border-yellow-300 text-yellow-700", activeCls: "bg-yellow-100 border-yellow-400 text-yellow-800" },
  { value: "3", label: "★ 3 — Caution", cls: "border-red-300    text-red-700",    activeCls: "bg-red-100    border-red-400    text-red-800"    },
  { value: "Prospect", label: "Prospect", cls: "border-blue-300 text-blue-700",   activeCls: "bg-blue-100  border-blue-400   text-blue-800"   },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  companyName:    z.string().min(1, "Company name is required"),
  vendorType:     z.string().optional(),
  rating:         z.string().optional(),
  primaryContact: z.string().optional(),
  email:          z.string().email("Invalid email").or(z.literal("")).optional(),
  phone:          z.string().optional(),
  phone2:         z.string().optional(),
  licenseNumber:  z.string().optional(),
  notes:          z.string().optional(),
  websiteUrl:     z.string().optional(),
  ghlReferenceId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm font-medium">{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function BadgePicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; cls: string; activeCls: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3 h-3" />
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(active ? "" : opt.value)}
              className={cn(
                "px-3 py-1 rounded-full border text-xs font-medium transition-colors",
                active ? opt.activeCls : cn("bg-transparent hover:bg-muted/60", opt.cls)
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Existing vendor type ─────────────────────────────────────────────────────

type ExistingVendor = {
  id: string;
  companyName: string;
  vendorType: string | null;
  rating: string | null;
  primaryContact: string | null;
  email: string | null;
  phone: string | null;
  phone2: string | null;
  licenseNumber: string | null;
  notes: string | null;
  websiteUrl: string | null;
  ghlReferenceId: string | null;
};

type Props = { mode: "create" } | { mode: "edit"; vendor: ExistingVendor };

// ─── Form ─────────────────────────────────────────────────────────────────────

export function VendorForm(props: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const existing = props.mode === "edit" ? props.vendor : null;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      companyName:    existing?.companyName    ?? "",
      vendorType:     existing?.vendorType     ?? "",
      rating:         existing?.rating         ?? "",
      primaryContact: existing?.primaryContact ?? "",
      email:          existing?.email          ?? "",
      phone:          existing?.phone          ?? "",
      phone2:         existing?.phone2         ?? "",
      licenseNumber:  existing?.licenseNumber  ?? "",
      notes:          existing?.notes          ?? "",
      websiteUrl:     existing?.websiteUrl     ?? "",
      ghlReferenceId: existing?.ghlReferenceId ?? "",
    },
  });

  const vendorTypeOptions = VENDOR_TYPES.map((t) => ({
    value: t,
    label: t,
    cls: "border-border text-foreground",
    activeCls: "bg-muted border-foreground/30 text-foreground font-semibold",
  }));

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const payload: VendorFormValues = {
      companyName:    values.companyName,
      vendorType:     values.vendorType     ?? "",
      rating:         values.rating         ?? "",
      primaryContact: values.primaryContact ?? "",
      email:          values.email          ?? "",
      phone:          values.phone          ?? "",
      phone2:         values.phone2         ?? "",
      licenseNumber:  values.licenseNumber  ?? "",
      notes:          values.notes          ?? "",
      websiteUrl:     values.websiteUrl     ?? "",
      ghlReferenceId: values.ghlReferenceId ?? "",
    };

    const result =
      props.mode === "edit"
        ? await updateVendor(props.vendor.id, payload)
        : await createVendor(payload);

    setSubmitting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(props.mode === "edit" ? "Vendor updated." : "Vendor company created.");
    router.push(`/vendors/${result.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

      {/* ── Classification (badges) ────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Classification</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <BadgePicker
            label="Vendor Type"
            options={vendorTypeOptions}
            value={watch("vendorType") ?? ""}
            onChange={(v) => setValue("vendorType", v)}
          />
          <BadgePicker
            label="Rating"
            options={RATING_OPTIONS}
            value={watch("rating") ?? ""}
            onChange={(v) => setValue("rating", v)}
          />
        </CardContent>
      </Card>

      {/* ── Company Details ────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Company Name *" error={errors.companyName?.message}>
            <Input placeholder="ClearWater Inspection Services" {...register("companyName")} />
          </Field>
          <Field label="Primary Contact">
            <Input placeholder="Jane Smith" {...register("primaryContact")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" placeholder="contact@company.com" {...register("email")} />
          </Field>
          <Field label="Phone">
            <Input placeholder="555-000-0000" {...register("phone")} />
          </Field>
          <Field label="Phone 2">
            <Input placeholder="555-000-0001" {...register("phone2")} />
          </Field>
          <Field label="License Number">
            <Input placeholder="WI-2024-0000" {...register("licenseNumber")} />
          </Field>
          <Field label="Website">
            <Input placeholder="https://example.com" {...register("websiteUrl")} />
          </Field>
          <Field label="GHL Reference ID" hint="GoHighLevel reference for syncing">
            <Input placeholder="ghl-ref-id" {...register("ghlReferenceId")} />
          </Field>
        </CardContent>
      </Card>

      {/* ── Notes ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Contact details, pricing, service area, availability notes..."
            rows={4}
            {...register("notes")}
          />
        </CardContent>
      </Card>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {props.mode === "edit" ? "Save Changes" : "Create Vendor Company"}
        </Button>
      </div>
    </form>
  );
}
