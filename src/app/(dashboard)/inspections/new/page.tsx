import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { InspectionForm } from "@/components/inspections/inspection-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "New Inspection" };

export default function NewInspectionPage() {
  return (
    <div className="flex flex-col gap-6 p-8 max-w-5xl mx-auto w-full">
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
      <InspectionForm mode="create" />
    </div>
  );
}
