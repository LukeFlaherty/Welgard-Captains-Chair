import type { Metadata } from "next";
import { LayoutDashboard } from "lucide-react";
import { listActivityLogs } from "@/actions/activity-log";
import { ActivityTimeline } from "@/components/dashboard/activity-timeline";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role;
  if (role !== "admin" && role !== "team_member") {
    redirect("/inspections");
  }

  const { data, total } = await listActivityLogs({ page: 1, pageSize: PAGE_SIZE });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-4xl mx-auto w-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <LayoutDashboard className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Activity Feed</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Every action across the platform — inspections, service tickets, vendors, users, and PDFs.
        </p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{total.toLocaleString()}</span>
        <span>events recorded</span>
      </div>

      <ActivityTimeline
        initialData={data}
        initialTotal={total}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
