"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  getActor, logActivity, diffObjects, fieldLabel,
  SERVICE_TICKET_SKIP_FIELDS,
} from "@/lib/activity";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ServiceTicketFormValues = {
  // Member
  memberFirstName: string;
  memberLastName: string;
  memberEmail: string;
  memberAltEmail: string;
  memberPhone: string;
  memberPhoneType: string;
  memberAltPhone: string;
  memberAltPhoneType: string;

  // Address
  streetAddress: string;
  streetAddress2: string;
  city: string;
  county: string;
  state: string;
  zip: string;

  // Core
  serviceType: string;
  status: string;
  callReceivedAt: string;    // ISO string
  scheduledFor: string;
  lastServiceDate: string;

  // Vendor
  vendorId: string;
  serviceCompletedBy: string;

  // Inquiry
  callInNumber: string;
  customerInquiry: string;
  customerFollowUp: string;
  specialInstructions: string;

  // Checklist
  rightOfFirstRefusal: boolean | null;
  valvesOpen: string;
  filterClogged: string;
  circuitBreakerReset: string;
  lowPressureSwitch: string;
  backwashCycle: string;
  pressureGauge: boolean | null;

  // Tech response
  faultIdentified: string;
  repairsPerformed: string;
  technicianResponse: string;
  amperageReading: number | null;
  yieldValue: number | null;
  depthPerCustomer: number | null;

  // Invoice
  invoiceNumber: string;
  invoiceAmount: number | null;
  invoicePaymentType: string;
  invoiceAttachment: string;
  servicePrice: number | null;

  // Completion
  isComplete: boolean;
  completedBy: string;

  // GHL
  ghlContactId: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(val: string): Date | null {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function buildData(values: ServiceTicketFormValues) {
  return {
    memberFirstName:    values.memberFirstName,
    memberLastName:     values.memberLastName,
    memberEmail:        values.memberEmail || null,
    memberAltEmail:     values.memberAltEmail || null,
    memberPhone:        values.memberPhone || null,
    memberPhoneType:    values.memberPhoneType || null,
    memberAltPhone:     values.memberAltPhone || null,
    memberAltPhoneType: values.memberAltPhoneType || null,
    streetAddress:      values.streetAddress,
    streetAddress2:     values.streetAddress2 || null,
    city:               values.city || null,
    county:             values.county || null,
    state:              values.state || null,
    zip:                values.zip || null,
    serviceType:        values.serviceType,
    status:             values.status || "open",
    callReceivedAt:     toDate(values.callReceivedAt) ?? new Date(),
    scheduledFor:       toDate(values.scheduledFor),
    lastServiceDate:    toDate(values.lastServiceDate),
    vendorId:           values.vendorId || null,
    serviceCompletedBy: values.serviceCompletedBy || null,
    callInNumber:       values.callInNumber || null,
    customerInquiry:    values.customerInquiry || null,
    customerFollowUp:   values.customerFollowUp || null,
    specialInstructions: values.specialInstructions || null,
    rightOfFirstRefusal: values.rightOfFirstRefusal ?? null,
    valvesOpen:         values.valvesOpen || null,
    filterClogged:      values.filterClogged || null,
    circuitBreakerReset: values.circuitBreakerReset || null,
    lowPressureSwitch:  values.lowPressureSwitch || null,
    backwashCycle:      values.backwashCycle || null,
    pressureGauge:      values.pressureGauge ?? null,
    faultIdentified:    values.faultIdentified || null,
    repairsPerformed:   values.repairsPerformed || null,
    technicianResponse: values.technicianResponse || null,
    amperageReading:    values.amperageReading,
    yieldValue:         values.yieldValue,
    depthPerCustomer:   values.depthPerCustomer,
    invoiceNumber:      values.invoiceNumber || null,
    invoiceAmount:      values.invoiceAmount,
    invoicePaymentType: values.invoicePaymentType || null,
    invoiceAttachment:  values.invoiceAttachment || null,
    servicePrice:       values.servicePrice,
    isComplete:         values.isComplete,
    completedBy:        values.completedBy || null,
    ghlContactId:       values.ghlContactId || null,
  };
}

async function nextTicketNumber(): Promise<number> {
  const last = await db.serviceTicket.findFirst({
    orderBy: { ticketNumber: "desc" },
    select: { ticketNumber: true },
  });
  return (last?.ticketNumber ?? 100635) + 1;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function createServiceTicket(
  values: ServiceTicketFormValues
): Promise<{ id: string } | { error: string }> {
  try {
    const ticketNumber = await nextTicketNumber();
    const ticket = await db.serviceTicket.create({
      data: { ticketNumber, ...buildData(values) },
    });
    revalidatePath("/service-tickets");

    const actor = await getActor();
    const memberName = `${values.memberFirstName} ${values.memberLastName}`.trim();
    const label = `Ticket #${ticketNumber} – ${memberName}`;
    await logActivity({
      actor,
      entityType: "service_ticket",
      entityId: ticket.id,
      entityLabel: label,
      action: "created",
      description: `Created ${label} at ${values.streetAddress}${values.city ? `, ${values.city}` : ""}`,
    });

    return { id: ticket.id };
  } catch (err) {
    console.error("[createServiceTicket]", err);
    return { error: "Failed to create service ticket." };
  }
}

export async function updateServiceTicket(
  id: string,
  values: ServiceTicketFormValues
): Promise<{ id: string } | { error: string }> {
  try {
    const existing = await db.serviceTicket.findUnique({ where: { id } });
    const data = buildData(values);
    await db.serviceTicket.update({ where: { id }, data });
    revalidatePath("/service-tickets");
    revalidatePath(`/service-tickets/${id}`);

    if (existing) {
      const actor = await getActor();
      const memberName = `${existing.memberFirstName} ${existing.memberLastName}`.trim();
      const label = `Ticket #${existing.ticketNumber} – ${memberName}`;
      const changes = diffObjects(
        existing as Record<string, unknown>,
        data as Record<string, unknown>,
        SERVICE_TICKET_SKIP_FIELDS
      );

      // Resolve vendor name change separately (vendorId is in skip list)
      const vendorLogs: Promise<void>[] = [];
      if ((existing.vendorId ?? null) !== (data.vendorId ?? null)) {
        const [oldVendor, newVendor] = await Promise.all([
          existing.vendorId
            ? db.vendor.findUnique({ where: { id: existing.vendorId }, select: { companyName: true } })
            : null,
          data.vendorId
            ? db.vendor.findUnique({ where: { id: data.vendorId }, select: { companyName: true } })
            : null,
        ]);
        vendorLogs.push(
          logActivity({
            actor,
            entityType: "service_ticket",
            entityId: id,
            entityLabel: label,
            action: "updated",
            field: "vendorId",
            oldValue: oldVendor?.companyName ?? existing.vendorId ?? "",
            newValue: newVendor?.companyName ?? data.vendorId ?? "",
            description: `Updated Vendor on ${label}`,
          })
        );
      }

      await Promise.all([
        ...changes.map((c) =>
          logActivity({
            actor,
            entityType: "service_ticket",
            entityId: id,
            entityLabel: label,
            action: "updated",
            field: c.field,
            oldValue: c.oldValue || null,
            newValue: c.newValue || null,
            description: `Updated ${fieldLabel(c.field)} on ${label}`,
          })
        ),
        ...vendorLogs,
      ]);
    }

    return { id };
  } catch (err) {
    console.error("[updateServiceTicket]", err);
    return { error: "Failed to update service ticket." };
  }
}

export async function deleteServiceTicket(id: string): Promise<{ error?: string }> {
  try {
    const existing = await db.serviceTicket.findUnique({
      where: { id },
      select: { ticketNumber: true, memberFirstName: true, memberLastName: true },
    });
    await db.serviceTicket.delete({ where: { id } });
    revalidatePath("/service-tickets");

    const actor = await getActor();
    const label = existing
      ? `Ticket #${existing.ticketNumber} – ${existing.memberFirstName} ${existing.memberLastName}`.trim()
      : id;
    await logActivity({
      actor,
      entityType: "service_ticket",
      entityId: id,
      entityLabel: label,
      action: "deleted",
      description: `Deleted ${label}`,
    });

    return {};
  } catch (err) {
    console.error("[deleteServiceTicket]", err);
    return { error: "Failed to delete service ticket." };
  }
}

export async function getServiceTicket(id: string) {
  return db.serviceTicket.findUnique({
    where: { id },
    include: { vendor: { select: { id: true, companyName: true, email: true, phone: true } } },
  });
}

// ─── List (paginated + searchable) ───────────────────────────────────────────

export async function listServiceTickets(opts: {
  search?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  vendorId?: string | null;
} = {}) {
  const { search, status, page = 1, pageSize = 25, vendorId } = opts;
  const skip = (page - 1) * pageSize;

  const vendorWhere = vendorId ? { vendorId } : {};
  const statusWhere = status ? { status } : {};
  const searchWhere = search
    ? {
        OR: [
          { memberFirstName:  { contains: search, mode: "insensitive" as const } },
          { memberLastName:   { contains: search, mode: "insensitive" as const } },
          { memberEmail:      { contains: search, mode: "insensitive" as const } },
          { streetAddress:    { contains: search, mode: "insensitive" as const } },
          { city:             { contains: search, mode: "insensitive" as const } },
          { serviceCompletedBy: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const where = { ...vendorWhere, ...statusWhere, ...searchWhere };

  const [data, total] = await Promise.all([
    db.serviceTicket.findMany({
      where,
      orderBy: { ticketNumber: "desc" },
      skip,
      take: pageSize,
      include: {
        vendor: { select: { id: true, companyName: true } },
      },
    }),
    db.serviceTicket.count({ where }),
  ]);

  return { data, total };
}

// ─── Address history ──────────────────────────────────────────────────────────

export async function getAddressHistory(
  streetAddress: string,
  excludeId: string
) {
  return db.serviceTicket.findMany({
    where: {
      streetAddress: { equals: streetAddress, mode: "insensitive" },
      id: { not: excludeId },
    },
    orderBy: { callReceivedAt: "desc" },
    include: {
      vendor: { select: { companyName: true } },
    },
  });
}

// ─── Email history ────────────────────────────────────────────────────────────

export async function getEmailHistory(
  memberEmail: string,
  excludeId: string
) {
  if (!memberEmail) return [];
  return db.serviceTicket.findMany({
    where: {
      memberEmail: { equals: memberEmail, mode: "insensitive" },
      id: { not: excludeId },
    },
    orderBy: { callReceivedAt: "desc" },
    include: {
      vendor: { select: { companyName: true } },
    },
  });
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getServiceTicketStats(vendorId?: string | null) {
  const where = vendorId ? { vendorId } : {};
  const [total, open, scheduled, inProgress, completed, emergency] = await Promise.all([
    db.serviceTicket.count({ where }),
    db.serviceTicket.count({ where: { ...where, status: "open" } }),
    db.serviceTicket.count({ where: { ...where, status: "scheduled" } }),
    db.serviceTicket.count({ where: { ...where, status: "in_progress" } }),
    db.serviceTicket.count({ where: { ...where, status: "completed" } }),
    db.serviceTicket.count({ where: { ...where, serviceType: "emergency" } }),
  ]);
  return { total, open, scheduled, inProgress, completed, emergency };
}

// ─── GHL webhook ─────────────────────────────────────────────────────────────

export async function triggerGhlWebhook(
  ticketId: string,
  eventType: "notify_member" | "notify_partner"
): Promise<{ error?: string }> {
  const webhookUrl = process.env.GHL_SERVICE_WEBHOOK_URL;
  if (!webhookUrl) return { error: "GHL_SERVICE_WEBHOOK_URL is not configured." };

  const ticket = await getServiceTicket(ticketId);
  if (!ticket) return { error: "Ticket not found." };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventType, ticket }),
    });
    if (!res.ok) throw new Error(`Webhook responded ${res.status}`);
    return {};
  } catch (err) {
    console.error("[triggerGhlWebhook]", err);
    return { error: err instanceof Error ? err.message : "Webhook failed." };
  }
}
