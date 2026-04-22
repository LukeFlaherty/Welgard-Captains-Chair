import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { InspectionForm } from "@/components/inspections/inspection-form";
import { getInspection } from "@/actions/inspections";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit Inspection" };

export default async function EditInspectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inspection = await getInspection(id);
  if (!inspection) notFound();

  return (
    <div className="flex flex-col gap-6 p-8 max-w-5xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link
          href={`/inspections/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Inspection</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {inspection.homeownerName} — {inspection.propertyAddress}
          </p>
        </div>
      </div>
      <InspectionForm mode="edit" inspection={inspection} />
    </div>
  );
}
