"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createVendor, updateVendor } from "@/actions/vendors";
import type { VendorFormValues } from "@/actions/vendors";

const VENDOR_TYPES = ["Contractor", "Inspector", "Water Treatment", "Real Estate Agent", "Admin", "Other"];

const schema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  vendorType: z.string().optional(),
  primaryContact: z.string().optional(),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().optional(),
  phone2: z.string().optional(),
  licenseNumber: z.string().optional(),
  notes: z.string().optional(),
  websiteUrl: z.string().optional(),
  ghlReferenceId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

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

type ExistingVendor = {
  id: string;
  companyName: string;
  vendorType: string | null;
  primaryContact: string | null;
  email: string | null;
  phone: string | null;
  phone2: string | null;
  licenseNumber: string | null;
  notes: string | null;
  websiteUrl: string | null;
  ghlReferenceId: string | null;
};

type Props =
  | { mode: "create" }
  | { mode: "edit"; vendor: ExistingVendor };

export function VendorForm(props: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const existing = props.mode === "edit" ? props.vendor : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      companyName: existing?.companyName ?? "",
      vendorType: existing?.vendorType ?? "",
      primaryContact: existing?.primaryContact ?? "",
      email: existing?.email ?? "",
      phone: existing?.phone ?? "",
      phone2: existing?.phone2 ?? "",
      licenseNumber: existing?.licenseNumber ?? "",
      notes: existing?.notes ?? "",
      websiteUrl: existing?.websiteUrl ?? "",
      ghlReferenceId: existing?.ghlReferenceId ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const payload: VendorFormValues = {
      companyName: values.companyName,
      vendorType: values.vendorType ?? "",
      primaryContact: values.primaryContact ?? "",
      email: values.email ?? "",
      phone: values.phone ?? "",
      phone2: values.phone2 ?? "",
      licenseNumber: values.licenseNumber ?? "",
      notes: values.notes ?? "",
      websiteUrl: values.websiteUrl ?? "",
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
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Company Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Company Name *" error={errors.companyName?.message}>
            <Input placeholder="ClearWater Inspection Services" {...register("companyName")} />
          </Field>
          <Field label="Vendor Type">
            <select
              {...register("vendorType")}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">— Select type —</option>
              {VENDOR_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
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
