"use client";

import { useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Building2, Users, ClipboardCheck, UserCheck, Pencil, MapPin, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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

function SearchBar({ value }: { value: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleChange = (q: string) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const sp = new URLSearchParams(params.toString());
      if (q) { sp.set("q", q); } else { sp.delete("q"); }
      sp.delete("page");
      router.push(`${pathname}?${sp.toString()}`);
    }, 300);
  };

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        defaultValue={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search vendors…"
        className="pl-8 w-56"
      />
    </div>
  );
}

function PaginationRow({ page, pageSize, total }: { page: number; pageSize: number; total: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const navigate = (p: number) => {
    const sp = new URLSearchParams(params.toString());
    sp.set("page", String(p));
    router.push(`${pathname}?${sp.toString()}`);
  };

  const start = Math.min((page - 1) * pageSize + 1, total);
  const end = Math.min(page * pageSize, total);
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex items-center justify-between gap-4 px-1 py-2">
      <span className="text-xs text-muted-foreground">
        Showing {start}–{end} of {total}
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => navigate(page - 1)}
          className="gap-1"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => navigate(page + 1)}
          className="gap-1"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

type Props = {
  rows: VendorRow[];
  total: number;
  page: number;
  pageSize: number;
  search: string;
};

export function VendorTable({ rows, total, page, pageSize, search }: Props) {
  const empty = total === 0 && !search;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <SearchBar value={search} />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/30">
          <Building2 className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-lg font-medium">{empty ? "No vendor companies yet" : "No results"}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {empty ? "Add your first vendor company to get started." : "Try a different search term."}
          </p>
        </div>
      ) : (
        <>
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

          {total > pageSize && (
            <PaginationRow page={page} pageSize={pageSize} total={total} />
          )}
        </>
      )}
    </div>
  );
}
