import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { InspectionForm } from "@/components/inspections/inspection-form";
import { listInspectorsForSelect } from "@/actions/inspectors";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "New Inspection" };
export const dynamic = "force-dynamic";

export default async function NewInspectionPage() {
  const inspectors = await listInspectorsForSelect();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link
          href="/inspections"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Inspection</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create a new well inspection record.
          </p>
        </div>
      </div>
      <InspectionForm mode="create" inspectors={inspectors} />
    </div>
  );
}
