import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ServiceTicketForm } from "@/components/service-tickets/service-ticket-form";
import { getServiceTicket } from "@/actions/service-tickets";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit Service Ticket" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditServiceTicketPage({ params }: Props) {
  const session = await auth();
  const role = session?.user?.role ?? "vendor";
  if (role !== "admin" && role !== "team_member") redirect("/service-tickets");

  const { id } = await params;
  const ticket = await getServiceTicket(id);
  if (!ticket) notFound();

  const vendors = await db.vendor.findMany({
    orderBy: { companyName: "asc" },
    select: { id: true, companyName: true },
  });

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link
          href={`/service-tickets/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Ticket #{ticket.ticketNumber}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {ticket.memberFirstName} {ticket.memberLastName}
          </p>
        </div>
      </div>
      <ServiceTicketForm
        mode="edit"
        ticket={ticket}
        vendors={vendors}
        isAdmin={role === "admin" || role === "team_member"}
      />
    </div>
  );
}
