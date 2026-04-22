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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createInspector, updateInspector } from "@/actions/inspectors";
import type { InspectorFormValues } from "@/actions/inspectors";
import type { Inspector } from "@/generated/prisma";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  licenseNumber: z.string().optional(),
  licenseStates: z.string().optional(),
  certifications: z.string().optional(),
  yearsExperience: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

// ─── Component ────────────────────────────────────────────────────────────────

type Props =
  | { mode: "create" }
  | { mode: "edit"; inspector: Inspector };

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

export function InspectorForm(props: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const existing = props.mode === "edit" ? props.inspector : null;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: existing?.name ?? "",
      email: existing?.email ?? "",
      phone: existing?.phone ?? "",
      company: existing?.company ?? "",
      licenseNumber: existing?.licenseNumber ?? "",
      licenseStates: existing?.licenseStates?.join(", ") ?? "",
      certifications: existing?.certifications?.join(", ") ?? "",
      yearsExperience: existing?.yearsExperience?.toString() ?? "",
      status: existing?.status ?? "active",
      notes: existing?.notes ?? "",
    },
  });

  const statusValue = watch("status");

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    const payload: InspectorFormValues = {
      name: values.name,
      email: values.email ?? "",
      phone: values.phone ?? "",
      company: values.company ?? "",
      licenseNumber: values.licenseNumber ?? "",
      licenseStates: values.licenseStates ?? "",
      certifications: values.certifications ?? "",
      yearsExperience: values.yearsExperience ?? "",
      status: values.status ?? "active",
      notes: values.notes ?? "",
    };

    const result =
      props.mode === "edit"
        ? await updateInspector(props.inspector.id, payload)
        : await createInspector(payload);

    setSubmitting(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    toast.success(props.mode === "edit" ? "Inspector updated." : "Inspector created.");
    router.push(`/inspectors/${result.id}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      {/* Contact */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Inspector Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Full Name *" error={errors.name?.message}>
            <Input placeholder="Marcus Webb" {...register("name")} />
          </Field>
          <Field label="Email" error={errors.email?.message}>
            <Input type="email" placeholder="inspector@company.com" {...register("email")} />
          </Field>
          <Field label="Phone">
            <Input placeholder="555-000-0000" {...register("phone")} />
          </Field>
          <Field label="Company / Organization">
            <Input placeholder="ClearWater Inspection Services" {...register("company")} />
          </Field>
          <Field label="License Number">
            <Input placeholder="WI-2024-0000" {...register("licenseNumber")} />
          </Field>
          <Field label="Years of Experience">
            <Input type="number" min={0} max={60} placeholder="0" {...register("yearsExperience")} />
          </Field>
        </CardContent>
      </Card>

      {/* Licensing & Certifications */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Licensing &amp; Coverage</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field
            label="Licensed States"
            hint="Comma-separated state abbreviations, e.g. VA, MD, WV"
          >
            <Input placeholder="VA, MD, WV" {...register("licenseStates")} />
          </Field>
          <Field
            label="Certifications"
            hint="Comma-separated, e.g. NGWA Certified Well Inspector, VA Licensed Well Inspector"
          >
            <Input
              placeholder="NGWA Certified Well Inspector"
              {...register("certifications")}
            />
          </Field>
        </CardContent>
      </Card>

      {/* Status & Notes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Status &amp; Notes</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Status">
            <Select
              value={statusValue ?? "active"}
              onValueChange={(v) => setValue("status", v ?? undefined)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Internal Notes">
              <Textarea
                rows={3}
                placeholder="Any notes about this inspector for internal use..."
                {...register("notes")}
              />
            </Field>
          </div>
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
          {props.mode === "edit" ? "Save Changes" : "Create Inspector"}
        </Button>
      </div>
    </form>
  );
}
