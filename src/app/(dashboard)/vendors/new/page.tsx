import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { VendorForm } from "@/components/vendors/vendor-form";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "New Vendor" };

export default function NewVendorPage() {
  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link
          href="/vendors"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New Vendor Company</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Add an inspection company to the system.
          </p>
        </div>
      </div>
      <VendorForm mode="create" />
    </div>
  );
}
