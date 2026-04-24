"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { createServiceTicket } from "@/actions/service-tickets";

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  memberFirstName: z.string().min(1, "First name is required"),
  memberLastName:  z.string().min(1, "Last name is required"),
  memberEmail:     z.string().optional().default(""),
  memberPhone:     z.string().optional().default(""),
  memberPhoneType: z.string().optional().default(""),
  streetAddress:   z.string().min(1, "Service address is required"),
  city:            z.string().optional().default(""),
  county:          z.string().optional().default(""),
  state:           z.string().optional().default(""),
  zip:             z.string().optional().default(""),
  serviceType:     z.string().min(1, "Service type is required"),
  callInNumber:    z.string().optional().default(""),
  customerInquiry: z.string().optional().default(""),
  specialInstructions: z.string().optional().default(""),
});

type FormValues = z.infer<typeof schema>;

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

// ─── Form ─────────────────────────────────────────────────────────────────────

export function ServiceIntakeForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: { serviceType: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    const now = new Date().toISOString();
    const result = await createServiceTicket({
      memberFirstName:    values.memberFirstName,
      memberLastName:     values.memberLastName,
      memberEmail:        values.memberEmail ?? "",
      memberAltEmail:     "",
      memberPhone:        values.memberPhone ?? "",
      memberPhoneType:    values.memberPhoneType ?? "",
      memberAltPhone:     "",
      memberAltPhoneType: "",
      streetAddress:      values.streetAddress,
      streetAddress2:     "",
      city:               values.city ?? "",
      county:             values.county ?? "",
      state:              values.state ?? "",
      zip:                values.zip ?? "",
      serviceType:        values.serviceType,
      status:             "open",
      callReceivedAt:     now,
      scheduledFor:       "",
      lastServiceDate:    "",
      vendorId:           "",
      serviceCompletedBy: "",
      callInNumber:       values.callInNumber ?? "",
      customerInquiry:    values.customerInquiry ?? "",
      customerFollowUp:   "",
      specialInstructions: values.specialInstructions ?? "",
      rightOfFirstRefusal: null,
      valvesOpen:         "",
      filterClogged:      "",
      circuitBreakerReset: "",
      lowPressureSwitch:  "",
      backwashCycle:      "",
      pressureGauge:      null,
      faultIdentified:    "",
      repairsPerformed:   "",
      technicianResponse: "",
      amperageReading:    null,
      yieldValue:         null,
      depthPerCustomer:   null,
      invoiceNumber:      "",
      invoiceAmount:      null,
      invoicePaymentType: "",
      invoiceAttachment:  "",
      servicePrice:       null,
      isComplete:         false,
      completedBy:        "",
      ghlContactId:       "",
    });
    setLoading(false);

    if ("error" in result) {
      toast.error(result.error);
      return;
    }

    setDone(true);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
        <CheckCircle2 className="w-12 h-12 text-green-500" />
        <div>
          <p className="text-lg font-semibold">Ticket submitted</p>
          <p className="text-sm text-muted-foreground mt-1">The service request has been logged and is now open.</p>
        </div>
        <div className="flex gap-3 mt-2">
          <Button variant="outline" onClick={() => { reset(); setDone(false); }}>
            Log another
          </Button>
          <Button onClick={() => router.push("/service-tickets")}>
            View tickets
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">

      {/* Member & Contact */}
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
          <Field label="Phone">
            <Input {...register("memberPhone")} />
          </Field>
          <Field label="Phone Type">
            <Input placeholder="Cell / Home / Work" {...register("memberPhoneType")} />
          </Field>
          <Field label="Call-In Number" hint="Number the member called into">
            <Input {...register("callInNumber")} />
          </Field>
        </CardContent>
      </Card>

      {/* Service Address */}
      <Card>
        <CardHeader><CardTitle className="text-base">Service Address</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Street Address">
              <Input {...register("streetAddress")} />
              {errors.streetAddress && <p className="text-xs text-destructive">{errors.streetAddress.message}</p>}
            </Field>
          </div>
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

      {/* Service Details */}
      <Card>
        <CardHeader><CardTitle className="text-base">Service Details</CardTitle></CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field label="Service Type">
            <Select value={watch("serviceType")} onValueChange={(v) => setValue("serviceType", v ?? "")}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select type…" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general_maintenance">General Maintenance</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            {errors.serviceType && <p className="text-xs text-destructive">{errors.serviceType.message}</p>}
          </Field>
          <Field label="Customer Inquiry" hint="Describe what the member reported">
            <Textarea rows={5} {...register("customerInquiry")} />
          </Field>
          <Field label="Special Instructions">
            <Textarea rows={2} {...register("specialInstructions")} />
          </Field>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Submit Service Request
        </Button>
      </div>
    </form>
  );
}
