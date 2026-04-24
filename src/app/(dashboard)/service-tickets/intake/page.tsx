import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PhoneCall } from "lucide-react";
import { auth } from "@/auth";
import { ServiceIntakeForm } from "@/components/service-tickets/service-intake-form";

export const metadata: Metadata = { title: "Service Ticket Intake" };
export const dynamic = "force-dynamic";

export default async function ServiceTicketIntakePage() {
  const session = await auth();
  const role = session?.user?.role ?? "vendor";

  if (role !== "admin" && role !== "team_member") {
    redirect("/service-tickets");
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-3xl mx-auto w-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <PhoneCall className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Service Ticket Intake</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Log a new service call. Fill in the member&apos;s details and what they reported. The ticket will be created as <strong>Open</strong> for the team to action.
        </p>
      </div>
      <ServiceIntakeForm />
    </div>
  );
}
