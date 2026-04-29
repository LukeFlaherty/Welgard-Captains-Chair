import type { Metadata } from "next";
import Link from "next/link";
import { Wrench, AlertTriangle, Pencil, Link2Off } from "lucide-react";
import { format } from "date-fns";
import { buttonVariants } from "@/components/ui/button";
import { ServiceTicketTable } from "@/components/service-tickets/service-ticket-table";
import { listServiceTickets, getServiceTicketStats, listUnlinkedVendorTickets } from "@/actions/service-tickets";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Service Tickets" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type Props = {
  searchParams: Promise<{ q?: string; page?: string; status?: string; tab?: string }>;
};

export default async function ServiceTicketsPage({ searchParams }: Props) {
  const session = await auth();
  const role = session?.user?.role ?? "vendor";
  const isVendor = role === "vendor";
  const isAdmin = role === "admin" || role === "team_member";
  const vendorId = isVendor ? (session?.user?.vendorId ?? null) : null;
  const canCreate = role === "admin" || role === "team_member";

  // Unlinked vendor account — show nothing
  if (isVendor && !vendorId) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Service Tickets</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Your account is not linked to a service company. Contact an administrator.
        </p>
      </div>
    );
  }

  const { q, page: pageParam, status, tab } = await searchParams;
  const activeTab = isAdmin && tab === "unlinked" ? "unlinked" : "all";
  const search = q?.trim() || undefined;
  const statusFilter = status?.trim() || undefined;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [{ data: tickets, total }, stats, unlinked] = await Promise.all([
    activeTab === "all"
      ? listServiceTickets({ search, status: statusFilter, page, pageSize: PAGE_SIZE, vendorId })
      : Promise.resolve({ data: [], total: 0 }),
    getServiceTicketStats(vendorId),
    isAdmin ? listUnlinkedVendorTickets() : Promise.resolve([]),
  ]);

  const statCards = [
    { label: "Total",      value: stats.total,     color: "text-foreground" },
    { label: "Open",       value: stats.open,       color: "text-blue-600" },
    { label: "Scheduled",  value: stats.scheduled,  color: "text-yellow-600" },
    { label: "In Progress",value: stats.inProgress, color: "text-orange-600" },
    { label: "Completed",  value: stats.completed,  color: "text-green-600" },
    { label: "Emergency",  value: stats.emergency,  color: "text-red-600" },
  ];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold tracking-tight">Service Tickets</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {role === "vendor"
              ? "Service tickets assigned to your company."
              : "Manage incoming service calls, track repairs, and view member history."}
          </p>
        </div>
      </div>

      {stats.total > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="flex flex-col gap-1 p-4 border rounded-xl bg-card">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <span className={cn("text-2xl font-bold", s.color)}>{s.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Tab row — admin only */}
      {isAdmin && (
        <div className="flex items-center gap-1 border-b">
          <Link
            href="/service-tickets"
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "all"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            All Tickets
          </Link>
          <Link
            href="/service-tickets?tab=unlinked"
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5",
              activeTab === "unlinked"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Link2Off className="w-3.5 h-3.5" />
            Unlinked Vendors
            {unlinked.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                {unlinked.length > 99 ? "99+" : unlinked.length}
              </span>
            )}
          </Link>
        </div>
      )}

      {/* All Tickets tab */}
      {activeTab === "all" && (
        <ServiceTicketTable
          rows={tickets as Parameters<typeof ServiceTicketTable>[0]["rows"]}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
          search={search ?? ""}
          statusFilter={statusFilter ?? ""}
          canCreate={canCreate}
        />
      )}

      {/* Unlinked Vendors tab */}
      {activeTab === "unlinked" && (
        <section className="flex flex-col gap-3">
          {unlinked.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/30 gap-3">
              <Link2Off className="w-10 h-10 text-green-500" />
              <p className="text-lg font-medium">All vendors are linked</p>
              <p className="text-sm text-muted-foreground">Every service ticket has a linked vendor record.</p>
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/10 p-4 text-sm text-amber-800 dark:text-amber-300 flex flex-col gap-1">
                <strong>{unlinked.length} ticket{unlinked.length !== 1 ? "s" : ""} need a vendor linked.</strong>
                <span>
                  These tickets have no linked vendor record — either the company name didn&apos;t match an existing vendor, or no company was recorded at intake.
                  Since GHL is the source of truth for vendor data, use the <strong>Sync with GHL</strong> option on each ticket to find and link the correct vendor —
                  or edit the ticket manually to select a vendor from the list.
                </span>
              </div>

              <div className="border rounded-xl divide-y overflow-hidden">
                {unlinked.map((ticket) => (
                  <div key={ticket.id} className="flex items-center justify-between p-3 gap-3">
                    <div className="flex flex-col gap-0.5">
                      <Link
                        href={`/service-tickets/${ticket.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        #{ticket.ticketNumber} — {ticket.memberFirstName} {ticket.memberLastName}
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {ticket.streetAddress}{ticket.city ? `, ${ticket.city}` : ""}{ticket.state ? ` ${ticket.state}` : ""}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-500" />
                        {ticket.serviceCompletedBy ?? "No company recorded"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {ticket.serviceType === "emergency" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full border bg-red-50 text-red-700 border-red-300">
                          Emergency
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(ticket.callReceivedAt), "MMM d, yyyy")}
                      </span>
                      <Link
                        href={`/service-tickets/${ticket.id}/edit`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-1")}
                      >
                        <Pencil className="w-3 h-3" />
                        Link Vendor
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
