import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { InspectorForm } from "@/components/inspectors/inspector-form";
import { getInspector } from "@/actions/inspectors";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit Inspector" };

export default async function EditInspectorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inspector = await getInspector(id);
  if (!inspector) notFound();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link
          href={`/inspectors/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Inspector</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {inspector.name}
            {inspector.company ? ` — ${inspector.company}` : ""}
          </p>
        </div>
      </div>
      <InspectorForm mode="edit" inspector={inspector} />
    </div>
  );
}
