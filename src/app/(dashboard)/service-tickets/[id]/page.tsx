import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft, Pencil, AlertTriangle, CheckCircle2, Clock,
  MapPin, Mail, Building2, FileText, History,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { getServiceTicket, getAddressHistory, getEmailHistory } from "@/actions/service-tickets";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";
import { GhlButtons } from "@/components/service-tickets/ghl-buttons";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const t = await getServiceTicket(id);
  return { title: t ? `Ticket #${t.ticketNumber}` : "Service Ticket" };
}

// ─── Small display helpers ────────────────────────────────────────────────────

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{title}</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 pl-6">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  if (value == null || value === "" || value === false) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm">{value}</span>
    </div>
  );
}

function FullRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-1 col-span-full">
      <span className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <p className="text-sm whitespace-pre-wrap leading-relaxed">{value}</p>
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  open:        "bg-blue-50 text-blue-700 border-blue-200",
  scheduled:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  in_progress: "bg-orange-50 text-orange-700 border-orange-200",
  completed:   "bg-green-50 text-green-700 border-green-200",
};
const STATUS_LABELS: Record<string, string> = {
  open: "Open", scheduled: "Scheduled", in_progress: "In Progress", completed: "Completed",
};

const TRI_LABEL: Record<string, string> = {
  yes: "Yes", no: "No", dont_know: "Don't Know",
};

function fmtDt(d: Date | null | undefined) {
  if (!d) return null;
  return format(new Date(d), "MM/dd/yyyy h:mm a");
}
function fmtDate(d: Date | null | undefined) {
  if (!d) return null;
  return format(new Date(d), "MM/dd/yyyy");
}

type HistoryEntry = Awaited<ReturnType<typeof getAddressHistory>>[number];

function HistoryCard({ h }: { h: HistoryEntry }) {
  return (
    <Link
      href={`/service-tickets/${h.id}`}
      className="rounded-xl border bg-card p-4 hover:bg-muted/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-xs text-muted-foreground">#{h.ticketNumber}</span>
            <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-full border", STATUS_STYLES[h.status])}>
              {STATUS_LABELS[h.status] ?? h.status}
            </span>
            {h.serviceType === "emergency" && (
              <span className="text-xs text-red-600 font-medium">Emergency</span>
            )}
          </div>
          <span className="text-sm font-medium">{h.memberFirstName} {h.memberLastName}</span>
          {h.vendor?.companyName && (
            <span className="text-xs text-muted-foreground">Partner: {h.vendor.companyName}</span>
          )}
          {h.streetAddress && (
            <span className="text-xs text-muted-foreground">{h.streetAddress}{h.city ? `, ${h.city}` : ""}</span>
          )}
          {h.customerInquiry && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{h.customerInquiry}</p>
          )}
          {h.technicianResponse && (
            <p className="text-xs text-muted-foreground line-clamp-2">{h.technicianResponse}</p>
          )}
        </div>
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">{fmtDate(h.callReceivedAt)}</p>
          {h.isComplete && (
            <span className="text-xs text-green-600 flex items-center gap-0.5 justify-end mt-0.5">
              <CheckCircle2 className="w-3 h-3" />
              Complete
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ServiceTicketDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const role = session?.user?.role ?? "vendor";
  const isTeam = role === "admin" || role === "team_member";

  const ticket = await getServiceTicket(id);
  if (!ticket) notFound();

  // Vendor ownership check — vendors may only view their own tickets
  if (role === "vendor") {
    const vendorId = session?.user?.vendorId ?? null;
    if (!vendorId || ticket.vendorId !== vendorId) notFound();
  }

  const [addressHistory, emailHistory] = await Promise.all([
    getAddressHistory(ticket.streetAddress, ticket.id),
    getEmailHistory(ticket.memberEmail ?? "", ticket.id),
  ]);

  const partnerName = ticket.vendor?.companyName ?? ticket.serviceCompletedBy;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-4xl mx-auto w-full">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            href="/service-tickets"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold tracking-tight">Ticket #{ticket.ticketNumber}</h1>
              <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border", STATUS_STYLES[ticket.status])}>
                {STATUS_LABELS[ticket.status] ?? ticket.status}
              </span>
              {ticket.serviceType === "emergency" && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-medium px-2.5 py-1 rounded-full border border-red-200 bg-red-50">
                  <AlertTriangle className="w-3 h-3" />
                  Emergency
                </span>
              )}
              {ticket.isComplete && (
                <span className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Complete
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              {ticket.memberFirstName} {ticket.memberLastName} · {ticket.streetAddress}
              {ticket.city ? `, ${ticket.city}` : ""}
            </p>
          </div>
        </div>
        {isTeam && (
          <Link
            href={`/service-tickets/${ticket.id}/edit`}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1.5")}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </Link>
        )}
      </div>

      {/* GHL buttons (team/admin only) */}
      {isTeam && (
        <GhlButtons ticketId={ticket.id} />
      )}

      <div className="rounded-xl border bg-card divide-y">

        {/* Member & Contact */}
        <div className="p-5">
          <Section title="Member & Contact" icon={Mail}>
            <Row label="Name" value={`${ticket.memberFirstName} ${ticket.memberLastName}`} />
            <Row label="Email" value={ticket.memberEmail} />
            <Row label="Alt Email" value={ticket.memberAltEmail} />
            <Row label="Phone" value={ticket.memberPhone ? `${ticket.memberPhone}${ticket.memberPhoneType ? ` (${ticket.memberPhoneType})` : ""}` : null} />
            <Row label="Alt Phone" value={ticket.memberAltPhone ? `${ticket.memberAltPhone}${ticket.memberAltPhoneType ? ` (${ticket.memberAltPhoneType})` : ""}` : null} />
          </Section>
        </div>

        {/* Address */}
        <div className="p-5">
          <Section title="Service Address" icon={MapPin}>
            <Row label="Street" value={[ticket.streetAddress, ticket.streetAddress2].filter(Boolean).join(", ")} />
            <Row label="City" value={ticket.city} />
            <Row label="County" value={ticket.county} />
            <Row label="State" value={ticket.state} />
            <Row label="ZIP" value={ticket.zip} />
          </Section>
        </div>

        {/* Ticket Details */}
        <div className="p-5">
          <Section title="Ticket Details" icon={Clock}>
            <Row label="Call Received" value={fmtDt(ticket.callReceivedAt)} />
            <Row label="Scheduled For" value={fmtDt(ticket.scheduledFor)} />
            <Row label="Last Service Date" value={fmtDate(ticket.lastServiceDate)} />
            <Row label="Service Partner" value={partnerName} />
            {ticket.ghlContactId && <Row label="GHL Contact ID" value={ticket.ghlContactId} />}
          </Section>
        </div>

        {/* Initial Inquiry */}
        <div className="p-5">
          <Section title="Initial Inquiry" icon={Mail}>
            {ticket.callInNumber && <Row label="Call-In Number" value={ticket.callInNumber} />}
            <FullRow label="Customer Inquiry" value={ticket.customerInquiry} />
            <FullRow label="Special Instructions" value={ticket.specialInstructions} />
            <FullRow label="Customer Follow Up" value={ticket.customerFollowUp} />
          </Section>
        </div>

        {/* Diagnostic Checklist */}
        <div className="p-5">
          <Section title="Diagnostic Checklist" icon={FileText}>
            {ticket.rightOfFirstRefusal != null && (
              <Row label="Right of First Refusal" value={ticket.rightOfFirstRefusal ? "Yes" : "No"} />
            )}
            {ticket.valvesOpen && <Row label="Valves Open" value={TRI_LABEL[ticket.valvesOpen] ?? ticket.valvesOpen} />}
            {ticket.filterClogged && <Row label="Filter Clogged" value={TRI_LABEL[ticket.filterClogged] ?? ticket.filterClogged} />}
            {ticket.circuitBreakerReset && <Row label="Circuit Breaker Reset" value={TRI_LABEL[ticket.circuitBreakerReset] ?? ticket.circuitBreakerReset} />}
            {ticket.lowPressureSwitch && <Row label="Low Pressure Switch" value={TRI_LABEL[ticket.lowPressureSwitch] ?? ticket.lowPressureSwitch} />}
            {ticket.backwashCycle && <Row label="Backwash Cycle" value={TRI_LABEL[ticket.backwashCycle] ?? ticket.backwashCycle} />}
            {ticket.pressureGauge != null && <Row label="Pressure Gauge" value={ticket.pressureGauge ? "Yes" : "No"} />}
          </Section>
        </div>

        {/* Technician Response */}
        {(ticket.technicianResponse || ticket.amperageReading != null) && (
          <div className="p-5">
            <Section title="Technician Response" icon={Building2}>
              <FullRow label="Response Notes" value={ticket.technicianResponse} />
              {ticket.amperageReading != null && <Row label="Amperage Reading" value={`${ticket.amperageReading} amps`} />}
              {ticket.yieldValue != null && <Row label="Yield" value={String(ticket.yieldValue)} />}
              {ticket.depthPerCustomer != null && <Row label="Depth Per Customer" value={`${ticket.depthPerCustomer} ft`} />}
            </Section>
          </div>
        )}

        {/* Invoice (team/admin only) */}
        {isTeam && (ticket.invoiceNumber || ticket.invoiceAmount != null || ticket.invoiceAttachment) && (
          <div className="p-5">
            <Section title="Invoice & Pricing" icon={FileText}>
              {ticket.invoiceNumber && <Row label="Invoice #" value={ticket.invoiceNumber} />}
              {ticket.invoiceAmount != null && <Row label="Invoice Amount" value={`$${ticket.invoiceAmount.toLocaleString()}`} />}
              {ticket.servicePrice != null && <Row label="Service Price" value={`$${ticket.servicePrice.toLocaleString()}`} />}
              {ticket.invoicePaymentType && <Row label="Payment Type" value={ticket.invoicePaymentType} />}
              {ticket.invoiceAttachment && (
                <div className="flex flex-col gap-0.5 col-span-full">
                  <span className="text-[11px] text-muted-foreground uppercase tracking-wide">Invoice Attachment</span>
                  <a
                    href={ticket.invoiceAttachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {ticket.invoiceAttachment.split("/").pop()}
                  </a>
                </div>
              )}
            </Section>
          </div>
        )}

        {/* Completion */}
        {ticket.isComplete && (
          <div className="p-5">
            <Section title="Completion" icon={CheckCircle2}>
              <Row label="Completed" value="Yes" />
              {ticket.completedBy && <Row label="Completed By" value={ticket.completedBy} />}
              {ticket.ticketCompletedBy && <Row label="Ticket Completed By" value={ticket.ticketCompletedBy} />}
            </Section>
          </div>
        )}
      </div>

      {/* Address History */}
      {addressHistory.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Address History — {ticket.streetAddress}
            </h2>
            <Badge variant="secondary" className="text-xs">{addressHistory.length}</Badge>
          </div>
          <div className="flex flex-col gap-2">
            {addressHistory.map((h) => (
              <HistoryCard key={h.id} h={h} />
            ))}
          </div>
        </div>
      )}

      {/* Email History */}
      {emailHistory.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Member History — {ticket.memberEmail}
            </h2>
            <Badge variant="secondary" className="text-xs">{emailHistory.length}</Badge>
          </div>
          <div className="flex flex-col gap-2">
            {emailHistory.map((h) => (
              <HistoryCard key={h.id} h={h} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
