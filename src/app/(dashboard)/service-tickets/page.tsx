import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import { ServiceTicketTable } from "@/components/service-tickets/service-ticket-table";
import { listServiceTickets, getServiceTicketStats } from "@/actions/service-tickets";
import { auth } from "@/auth";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Service Tickets" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

type Props = {
  searchParams: Promise<{ q?: string; page?: string; status?: string }>;
};

export default async function ServiceTicketsPage({ searchParams }: Props) {
  const session = await auth();
  const role = session?.user?.role ?? "vendor";
  const isVendor = role === "vendor";
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

  const { q, page: pageParam, status } = await searchParams;
  const search = q?.trim() || undefined;
  const statusFilter = status?.trim() || undefined;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const [{ data: tickets, total }, stats] = await Promise.all([
    listServiceTickets({ search, status: statusFilter, page, pageSize: PAGE_SIZE, vendorId }),
    getServiceTicketStats(vendorId),
  ]);

  const statCards = [
    { label: "Total", value: stats.total, color: "text-foreground" },
    { label: "Open", value: stats.open, color: "text-blue-600" },
    { label: "Scheduled", value: stats.scheduled, color: "text-yellow-600" },
    { label: "In Progress", value: stats.inProgress, color: "text-orange-600" },
    { label: "Completed", value: stats.completed, color: "text-green-600" },
    { label: "Emergency", value: stats.emergency, color: "text-red-600" },
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

      <ServiceTicketTable
        rows={tickets as Parameters<typeof ServiceTicketTable>[0]["rows"]}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        search={search ?? ""}
        statusFilter={statusFilter ?? ""}
        canCreate={canCreate}
      />
    </div>
  );
}
