import type { Metadata } from "next";
import { ClipboardList, UserX } from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { IntakeForm } from "@/components/inspections/intake-form";

export const metadata: Metadata = { title: "Inspection Intake" };
export const dynamic = "force-dynamic";

export default async function IntakePage() {
  const session = await auth();
  const inspectorId = session?.user?.inspectorId ?? null;

  // Fetch inspector details if linked
  const inspector = inspectorId
    ? await db.inspector.findUnique({
        where: { id: inspectorId },
        select: { name: true, company: true },
      })
    : null;

  // Not linked to an inspector account
  if (!inspector) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <UserX className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">No Inspector Profile Linked</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Your account isn&apos;t linked to an inspector profile yet. Contact your Welgard administrator to get set up.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-3xl mx-auto w-full">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <ClipboardList className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold tracking-tight">Inspection Intake</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Fill out the form below to submit an inspection. It will be saved as a draft for Welgard to review.
        </p>
      </div>

      <IntakeForm
        inspectorName={inspector.name}
        inspectionCompany={inspector.company}
      />
    </div>
  );
}
