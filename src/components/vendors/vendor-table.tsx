"use client";

import Link from "next/link";
import { Building2, Users, ClipboardCheck, UserCheck, Pencil, MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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

const RATING_COLORS: Record<string, string> = {
  "1": "bg-green-100 text-green-700 border-green-300",
  "2": "bg-yellow-100 text-yellow-700 border-yellow-300",
  "3": "bg-red-100 text-red-700 border-red-300",
  "Prospect": "bg-blue-100 text-blue-700 border-blue-300",
};

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
            <TableHead>Location</TableHead>
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
                <div className="flex flex-col gap-1">
                  <Link
                    href={`/vendors/${vendor.id}`}
                    className="font-medium text-sm hover:underline"
                  >
                    {vendor.companyName}
                  </Link>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {vendor.vendorType && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                        {vendor.vendorType}
                      </Badge>
                    )}
                    {vendor.rating && (
                      <span className={`text-[10px] px-1.5 py-0 rounded-full border ${RATING_COLORS[vendor.rating] ?? "bg-muted text-muted-foreground border-border"}`}>
                        {vendor.rating === "Prospect" ? "Prospect" : `★ ${vendor.rating}`}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-0.5 text-sm">
                  {vendor.primaryContact && (
                    <span className="font-medium">{vendor.primaryContact}</span>
                  )}
                  {vendor.email && (
                    <span className="text-xs text-muted-foreground">{vendor.email}</span>
                  )}
                  {vendor.phone && (
                    <span className="text-xs text-muted-foreground">{vendor.phone}</span>
                  )}
                  {!vendor.primaryContact && !vendor.email && !vendor.phone && (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {(vendor.city || vendor.state) ? (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[vendor.city, vendor.state].filter(Boolean).join(", ")}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
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
