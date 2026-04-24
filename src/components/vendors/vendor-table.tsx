"use client";

import Link from "next/link";
import { Building2, Users, ClipboardCheck, UserCheck, Pencil } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { VendorRow } from "@/actions/vendors";

type Props = {
  rows: VendorRow[];
};

export function VendorTable({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/30">
        <Building2 className="w-10 h-10 text-muted-foreground mb-3" />
        <p className="text-lg font-medium">No vendor companies yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add your first vendor company to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Company</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead className="text-center">Inspectors</TableHead>
            <TableHead className="text-center">Inspections</TableHead>
            <TableHead className="text-center">Users</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((vendor) => (
            <TableRow key={vendor.id}>
              <TableCell>
                <div className="flex flex-col gap-0.5">
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {vendor.companyName}
                  </Link>
                  {vendor.licenseNumber && (
                    <span className="text-xs text-muted-foreground">
                      License: {vendor.licenseNumber}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5 text-sm">
                  {vendor.inspectorName && (
                    <span className="font-medium">{vendor.inspectorName}</span>
                  )}
                  {vendor.email && (
                    <span className="text-xs text-muted-foreground">{vendor.email}</span>
                  )}
                  {vendor.phone && (
                    <span className="text-xs text-muted-foreground">{vendor.phone}</span>
                  )}
                  {!vendor.inspectorName && !vendor.email && !vendor.phone && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center gap-1 text-sm">
                  <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
                  {vendor._count.inspectors}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center gap-1 text-sm">
                  <ClipboardCheck className="w-3.5 h-3.5 text-muted-foreground" />
                  {vendor._count.inspections}
                </span>
              </TableCell>
              <TableCell className="text-center">
                <span className="inline-flex items-center gap-1 text-sm">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  {vendor._count.users}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Link
                    href={`/vendors/${vendor.id}/edit`}
                    className={cn(buttonVariants({ variant: "ghost", size: "icon-sm" }))}
                    title="Edit vendor"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
