"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Save, Upload, X, FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { createServiceTicket, updateServiceTicket } from "@/actions/service-tickets";
import type { ServiceTicketFormValues } from "@/actions/service-tickets";

// ─── Schema ───────────────────────────────────────────────────────────────────

const numField = z.preprocess(
  (v) => (v === "" || v == null || (typeof v === "number" && isNaN(v)) ? null : Number(v)),
  z.number().nullable().optional()
);

const schema = z.object({
  memberFirstName: z.string().min(1, "First name is required"),
  memberLastName:  z.string().min(1, "Last name is required"),
  memberEmail:        z.string().optional().default(""),
  memberAltEmail:     z.string().optional().default(""),
  memberPhone:        z.string().optional().default(""),
  memberPhoneType:    z.string().optional().default(""),
  memberAltPhone:     z.string().optional().default(""),
  memberAltPhoneType: z.string().optional().default(""),
  streetAddress:  z.string().min(1, "Address is required"),
  streetAddress2: z.string().optional().default(""),
  city:    z.string().optional().default(""),
  county:  z.string().optional().default(""),
  state:   z.string().optional().default(""),
  zip:     z.string().optional().default(""),
  serviceType:     z.string().min(1, "Service type is required"),
  status:          z.string().default("open"),
  callReceivedAt:  z.string().min(1, "Call received time is required"),
  scheduledFor:    z.string().optional().default(""),
  lastServiceDate: z.string().optional().default(""),
  vendorId:           z.string().optional().default(""),
  serviceCompletedBy: z.string().optional().default(""),
  callInNumber:        z.string().optional().default(""),
  customerInquiry:     z.string().optional().default(""),
  customerFollowUp:    z.string().optional().default(""),
  specialInstructions: z.string().optional().default(""),
  rightOfFirstRefusal: z.boolean().nullable().default(null),
  valvesOpen:          z.string().optional().default(""),
  filterClogged:       z.string().optional().default(""),
  circuitBreakerReset: z.string().optional().default(""),
  lowPressureSwitch:   z.string().optional().default(""),
  backwashCycle:       z.string().optional().default(""),
  pressureGauge:       z.boolean().nullable().default(null),
  technicianResponse: z.string().optional().default(""),
  amperageReading:    numField,
  yieldValue:         numField,
  depthPerCustomer:   numField,
  invoiceNumber:      z.string().optional().default(""),
  invoiceAmount:      numField,
  invoicePaymentType: z.string().optional().default(""),
  invoiceAttachment:  z.string().optional().default(""),
  servicePrice:       numField,
  isComplete:  z.boolean().default(false),
  completedBy: z.string().optional().default(""),
  ghlContactId: z.string().optional().default(""),
});

type FormValues = z.infer<typeof schema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toLocalDatetime(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 16);
}

function toLocalDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const dt = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dt.getTime())) return "";
  return dt.toISOString().slice(0, 10);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const TRI_OPTIONS = [
  { value: "", label: "—" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "dont_know", label: "Don't Know" },
];

function TriSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
      <SelectContent>
        {TRI_OPTIONS.map((o) => (
          <SelectItem key={o.value || "blank"} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// ─── Invoice file upload ──────────────────────────────────────────────────────

function InvoiceUpload({
  ticketId,
  value,
  onChange,
}: {
  ticketId?: string;
  value: string;
  onChange: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      if (ticketId) fd.append("ticketId", ticketId);
      const res = await fetch("/api/service-tickets/invoice", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onChange(json.url);
      toast.success("Invoice uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const filename = value ? value.split("/").pop() : null;

  return (
    <div className="flex flex-col gap-2">
      {value ? (
        <div className="flex items-center gap-2 p-2 border rounded-lg text-sm">
          <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
          <a href={value} target="_blank" rel="noopener noreferrer" className="flex-1 truncate text-primary hover:underline">
            {filename ?? "Invoice"}
          </a>
          <button onClick={() => onChange("")} className="text-muted-foreground hover:text-destructive">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <label className="flex items-center gap-2 px-3 py-2 border rounded-lg text-sm cursor-pointer hover:bg-muted/50 text-muted-foreground">
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          {uploading ? "Uploading…" : "Upload invoice PDF"}
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
            disabled={uploading}
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
      )}
    </div>
  );
}

// ─── Existing ticket type ─────────────────────────────────────────────────────

export type ExistingTicket = {
  id: string;
  memberFirstName: string;
  memberLastName: string;
  memberEmail: string | null;
  memberAltEmail: string | null;
  memberPhone: string | null;
  memberPhoneType: string | null;
  memberAltPhone: string | null;
  memberAltPhoneType: string | null;
  streetAddress: string;
  streetAddress2: string | null;
  city: string | null;
  county: string | null;
  state: string | null;
  zip: string | null;
  serviceType: string;
  status: string;
  callReceivedAt: Date;
  scheduledFor: Date | null;
  lastServiceDate: Date | null;
  vendorId: string | null;
  serviceCompletedBy: string | null;
  callInNumber: string | null;
  customerInquiry: string | null;
  customerFollowUp: string | null;
  specialInstructions: string | null;
  rightOfFirstRefusal: boolean | null;
  valvesOpen: string | null;
  filterClogged: string | null;
  circuitBreakerReset: string | null;
  lowPressureSwitch: string | null;
  backwashCycle: string | null;
  pressureGauge: boolean | null;
  technicianResponse: string | null;
  amperageReading: number | null;
  yieldValue: number | null;
  depthPerCustomer: number | null;
  invoiceNumber: string | null;
  invoiceAmount: number | null;
  invoicePaymentType: string | null;
  invoiceAttachment: string | null;
  servicePrice: number | null;
  isComplete: boolean;
  completedBy: string | null;
  ghlContactId: string | null;
};

type Vendor = { id: string; companyName: string };

type Props = {
  mode: "create" | "edit";
  ticket?: ExistingTicket;
  vendors: Vendor[];
  isAdmin: boolean;
};

// ─── Form ─────────────────────────────────────────────────────────────────────

export function ServiceTicketForm({ mode, ticket, vendors, isAdmin }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: ticket
      ? {
          memberFirstName:    ticket.memberFirstName,
          memberLastName:     ticket.memberLastName,
          memberEmail:        ticket.memberEmail ?? "",
          memberAltEmail:     ticket.memberAltEmail ?? "",
          memberPhone:        ticket.memberPhone ?? "",
          memberPhoneType:    ticket.memberPhoneType ?? "",
          memberAltPhone:     ticket.memberAltPhone ?? "",
          memberAltPhoneType: ticket.memberAltPhoneType ?? "",
          streetAddress:      ticket.streetAddress,
          streetAddress2:     ticket.streetAddress2 ?? "",
          city:               ticket.city ?? "",
          county:             ticket.county ?? "",
          state:              ticket.state ?? "",
          zip:                ticket.zip ?? "",
          serviceType:        ticket.serviceType,
          status:             ticket.status,
          callReceivedAt:     toLocalDatetime(ticket.callReceivedAt),
          scheduledFor:       toLocalDatetime(ticket.scheduledFor),
          lastServiceDate:    toLocalDate(ticket.lastServiceDate),
          vendorId:           ticket.vendorId ?? "",
          serviceCompletedBy: ticket.serviceCompletedBy ?? "",
          callInNumber:       ticket.callInNumber ?? "",
          customerInquiry:    ticket.customerInquiry ?? "",
          customerFollowUp:   ticket.customerFollowUp ?? "",
          specialInstructions: ticket.specialInstructions ?? "",
          rightOfFirstRefusal: ticket.rightOfFirstRefusal,
          valvesOpen:         ticket.valvesOpen ?? "",
          filterClogged:      ticket.filterClogged ?? "",
          circuitBreakerReset: ticket.circuitBreakerReset ?? "",
          lowPressureSwitch:  ticket.lowPressureSwitch ?? "",
          backwashCycle:      ticket.backwashCycle ?? "",
          pressureGauge:      ticket.pressureGauge,
          technicianResponse: ticket.technicianResponse ?? "",
          amperageReading:    ticket.amperageReading,
          yieldValue:         ticket.yieldValue,
          depthPerCustomer:   ticket.depthPerCustomer,
          invoiceNumber:      ticket.invoiceNumber ?? "",
          invoiceAmount:      ticket.invoiceAmount,
          invoicePaymentType: ticket.invoicePaymentType ?? "",
          invoiceAttachment:  ticket.invoiceAttachment ?? "",
          servicePrice:       ticket.servicePrice,
          isComplete:         ticket.isComplete,
          completedBy:        ticket.completedBy ?? "",
          ghlContactId:       ticket.ghlContactId ?? "",
        }
      : {
          callReceivedAt: toLocalDatetime(new Date()),
          status: "open",
          serviceType: "",
          rightOfFirstRefusal: null,
          pressureGauge: null,
          isComplete: false,
        },
  });

  const isComplete    = watch("isComplete");
  const invoiceAttach = watch("invoiceAttachment");

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const payload: ServiceTicketFormValues = {
      ...values,
      memberEmail:        values.memberEmail ?? "",
      memberAltEmail:     values.memberAltEmail ?? "",
      memberPhone:        values.memberPhone ?? "",
      memberPhoneType:    values.memberPhoneType ?? "",
      memberAltPhone:     values.memberAltPhone ?? "",
      memberAltPhoneType: values.memberAltPhoneType ?? "",
      streetAddress2:     values.streetAddress2 ?? "",
      city:               values.city ?? "",
      county:             values.county ?? "",
      state:              values.state ?? "",
      zip:                values.zip ?? "",
      scheduledFor:       values.scheduledFor ?? "",
      lastServiceDate:    values.lastServiceDate ?? "",
      vendorId:           values.vendorId ?? "",
      serviceCompletedBy: values.serviceCompletedBy ?? "",
      callInNumber:       values.callInNumber ?? "",
      customerInquiry:    values.customerInquiry ?? "",
      customerFollowUp:   values.customerFollowUp ?? "",
      specialInstructions: values.specialInstructions ?? "",
      valvesOpen:         values.valvesOpen ?? "",
      filterClogged:      values.filterClogged ?? "",
      circuitBreakerReset: values.circuitBreakerReset ?? "",
      lowPressureSwitch:  values.lowPressureSwitch ?? "",
      backwashCycle:      values.backwashCycle ?? "",
      technicianResponse: values.technicianResponse ?? "",
      amperageReading:    values.amperageReading ?? null,
      yieldValue:         values.yieldValue ?? null,
      depthPerCustomer:   values.depthPerCustomer ?? null,
      invoiceNumber:      values.invoiceNumber ?? "",
      invoiceAmount:      values.invoiceAmount ?? null,
      invoicePaymentType: values.invoicePaymentType ?? "",
      invoiceAttachment:  values.invoiceAttachment ?? "",
      servicePrice:       values.servicePrice ?? null,
      completedBy:        values.completedBy ?? "",
      ghlContactId:       values.ghlContactId ?? "",
    };

    const result =
      mode === "create"
        ? await createServiceTicket(payload)
        : await updateServiceTicket(ticket!.id, payload);

    setLoading(false);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    toast.success(mode === "create" ? "Ticket created" : "Ticket saved");
    router.push(`/service-tickets/${result.id}`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

      {/* ── Member & Contact ─────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Member & Contact</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="First Name">
            <Input {...register("memberFirstName")} />
            {errors.memberFirstName && <p className="text-xs text-destructive">{errors.memberFirstName.message}</p>}
          </Field>
          <Field label="Last Name">
            <Input {...register("memberLastName")} />
            {errors.memberLastName && <p className="text-xs text-destructive">{errors.memberLastName.message}</p>}
          </Field>
          <Field label="Email">
            <Input type="email" {...register("memberEmail")} />
          </Field>
          <Field label="Alternate Email">
            <Input type="email" {...register("memberAltEmail")} />
          </Field>
          <Field label="Phone">
            <Input {...register("memberPhone")} />
          </Field>
          <Field label="Phone Type">
            <Input placeholder="Cell / Home / Work" {...register("memberPhoneType")} />
          </Field>
          <Field label="Alternate Phone">
            <Input {...register("memberAltPhone")} />
          </Field>
          <Field label="Alt Phone Type">
            <Input placeholder="Cell / Home / Work" {...register("memberAltPhoneType")} />
          </Field>
        </CardContent>
      </Card>

      {/* ── Address ──────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Service Address</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Street Address">
              <Input {...register("streetAddress")} />
              {errors.streetAddress && <p className="text-xs text-destructive">{errors.streetAddress.message}</p>}
            </Field>
          </div>
          <Field label="Street Address 2">
            <Input {...register("streetAddress2")} />
          </Field>
          <Field label="City">
            <Input {...register("city")} />
          </Field>
          <Field label="County">
            <Input {...register("county")} />
          </Field>
          <Field label="State">
            <Input {...register("state")} />
          </Field>
          <Field label="ZIP Code">
            <Input {...register("zip")} />
          </Field>
        </CardContent>
      </Card>

      {/* ── Ticket Details ────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Ticket Details</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Service Type">
            <Select value={watch("serviceType")} onValueChange={(v) => setValue("serviceType", v ?? "")}>
              <SelectTrigger><SelectValue placeholder="Select type…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general_maintenance">General Maintenance</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            {errors.serviceType && <p className="text-xs text-destructive">{errors.serviceType.message}</p>}
          </Field>
          <Field label="Status">
            <Select value={watch("status")} onValueChange={(v) => setValue("status", v ?? "open")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Call Received">
            <Input type="datetime-local" {...register("callReceivedAt")} />
            {errors.callReceivedAt && <p className="text-xs text-destructive">{errors.callReceivedAt.message}</p>}
          </Field>
          <Field label="Scheduled For">
            <Input type="datetime-local" {...register("scheduledFor")} />
          </Field>
          <Field label="Last Service Date">
            <Input type="date" {...register("lastServiceDate")} />
          </Field>
          <Field label="Service Partner">
            <Select value={watch("vendorId")} onValueChange={(v) => setValue("vendorId", !v || v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder="Select vendor…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">— None —</SelectItem>
                {vendors.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.companyName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Service Completed By (free text)">
              <Input placeholder="Company name if not in vendor list" {...register("serviceCompletedBy")} />
            </Field>
          </div>
          <Field label="GHL Contact ID">
            <Input {...register("ghlContactId")} />
          </Field>
        </CardContent>
      </Card>

      {/* ── Initial Inquiry ───────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Initial Inquiry</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Call-In Number">
            <Input {...register("callInNumber")} />
          </Field>
          <Field label="Customer Inquiry" hint="What the member reported when they called in">
            <Textarea rows={4} {...register("customerInquiry")} />
          </Field>
          <Field label="Special Instructions">
            <Textarea rows={2} {...register("specialInstructions")} />
          </Field>
          <Field label="Customer Follow Up">
            <Textarea rows={2} {...register("customerFollowUp")} />
          </Field>
        </CardContent>
      </Card>

      {/* ── Diagnostic Checklist ─────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Diagnostic Checklist</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center justify-between sm:col-span-2 py-1">
            <Label>Right of First Refusal</Label>
            <Switch
              checked={watch("rightOfFirstRefusal") === true}
              onCheckedChange={(c) => setValue("rightOfFirstRefusal", c ? true : null)}
            />
          </div>
          <Separator className="sm:col-span-2" />
          {([
            ["valvesOpen", "Valves Open"],
            ["filterClogged", "Filter Clogged"],
            ["circuitBreakerReset", "Circuit Breaker Reset"],
            ["lowPressureSwitch", "Low Pressure Switch"],
            ["backwashCycle", "Backwash Cycle"],
          ] as const).map(([field, label]) => (
            <Field key={field} label={label}>
              <TriSelect
                value={watch(field) ?? ""}
                onChange={(v) => setValue(field, v)}
              />
            </Field>
          ))}
          <div className="flex items-center justify-between py-1">
            <Label>Pressure Gauge</Label>
            <Switch
              checked={watch("pressureGauge") === true}
              onCheckedChange={(c) => setValue("pressureGauge", c ? true : false)}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Technician Response ───────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Technician Response</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Response Notes" hint="Fault identified and repairs performed">
            <Textarea rows={5} {...register("technicianResponse")} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Amperage Reading (amps)">
              <Input type="number" step="0.01" {...register("amperageReading")} />
            </Field>
            <Field label="Yield">
              <Input type="number" step="0.01" {...register("yieldValue")} />
            </Field>
            <Field label="Depth Per Customer (ft)">
              <Input type="number" step="0.1" {...register("depthPerCustomer")} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {/* ── Invoice (admin/team only) ─────────────────────── */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Invoice & Pricing</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Invoice Number">
              <Input {...register("invoiceNumber")} />
            </Field>
            <Field label="Invoice Amount ($)">
              <Input type="number" step="0.01" {...register("invoiceAmount")} />
            </Field>
            <Field label="Payment Type">
              <Input placeholder="Credit Card / Check / Cash" {...register("invoicePaymentType")} />
            </Field>
            <Field label="Service Price ($)">
              <Input type="number" step="0.01" {...register("servicePrice")} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Invoice Attachment">
                <InvoiceUpload
                  ticketId={ticket?.id}
                  value={invoiceAttach ?? ""}
                  onChange={(url) => setValue("invoiceAttachment", url)}
                />
              </Field>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Completion ────────────────────────────────────── */}
      <Card>
        <CardHeader><CardTitle className="text-base">Completion</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Ticket Complete</Label>
              <p className="text-xs text-muted-foreground mt-0.5">Mark when all work is done and invoiced</p>
            </div>
            <Switch checked={isComplete} onCheckedChange={(c) => setValue("isComplete", c)} />
          </div>
          {isComplete && (
            <Field label="Completed By">
              <Input placeholder="Name or email of who completed" {...register("completedBy")} />
            </Field>
          )}
        </CardContent>
      </Card>

      {/* ── Submit ────────────────────────────────────────── */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {mode === "create" ? "Create Ticket" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
