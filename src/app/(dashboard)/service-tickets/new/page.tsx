import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { ServiceTicketForm } from "@/components/service-tickets/service-ticket-form";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "New Service Ticket" };
export const dynamic = "force-dynamic";

export default async function NewServiceTicketPage() {
  const session = await auth();
  const role = session?.user?.role ?? "vendor";
  if (role !== "admin" && role !== "team_member") redirect("/service-tickets");

  const vendors = await db.vendor.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link
          href="/service-tickets"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Service Ticket</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Log an incoming service call</p>
        </div>
      </div>
      <ServiceTicketForm
        mode="create"
        vendors={vendors}
        isAdmin={role === "admin" || role === "team_member"}
      />
    </div>
  );
}
