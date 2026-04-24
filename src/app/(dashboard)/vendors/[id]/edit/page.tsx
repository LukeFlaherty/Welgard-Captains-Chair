import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { VendorForm } from "@/components/vendors/vendor-form";
import { getVendor } from "@/actions/vendors";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Edit Vendor" };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditVendorPage({ params }: Props) {
  const { id } = await params;
  const vendor = await getVendor(id);
  if (!vendor) notFound();

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-3xl mx-auto w-full">
      <div className="flex items-center gap-4">
        <Link
          href={`/vendors/${id}`}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1.5")}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Vendor</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{vendor.companyName}</p>
        </div>
      </div>
      <VendorForm mode="edit" vendor={vendor} />
    </div>
  );
}
