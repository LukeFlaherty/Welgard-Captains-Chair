"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InspectionFormValues } from "@/types/inspection";

type Props = {
  form: UseFormReturn<InspectionFormValues>;
};

const TEST_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

export function YieldTestTable({ form }: Props) {
  const { register, watch } = form;
  const yieldTests = watch("yieldTests");

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground">
        Record up to 6 sequential pump tests. Start time must be in{" "}
        <strong>HH:MM</strong> (24-hour) format. All tests assumed same day.
      </div>

      {/* Mobile-friendly stacked layout */}
      <div className="hidden sm:grid sm:grid-cols-[40px_1fr_1fr_1fr] sm:gap-x-3 sm:gap-y-1 items-end">
        <span />
        <Label className="text-xs text-muted-foreground font-medium">Start Time (HH:MM)</Label>
        <Label className="text-xs text-muted-foreground font-medium">Total Gallons</Label>
        <Label className="text-xs text-muted-foreground font-medium">Sec to Fill 5-Gal Bucket</Label>
      </div>

      {TEST_NUMBERS.map((n) => {
        const idx = n - 1;
        const hasData =
          yieldTests?.[idx]?.startTime ||
          yieldTests?.[idx]?.totalGallons != null ||
          yieldTests?.[idx]?.secondsToFillBucket != null;

        return (
          <div key={n} className="flex flex-col sm:grid sm:grid-cols-[40px_1fr_1fr_1fr] gap-2 sm:gap-x-3 items-start sm:items-center">
            <span
              className={`text-sm font-semibold w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                hasData
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {n}
            </span>

            {/* Mobile labels only */}
            <div className="flex flex-col gap-1 sm:contents">
              <Label className="text-xs text-muted-foreground sm:hidden">Start Time (HH:MM)</Label>
              <Input
                {...register(`yieldTests.${idx}.startTime`)}
                placeholder="e.g. 10:30"
                className="h-8 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1 sm:contents">
              <Label className="text-xs text-muted-foreground sm:hidden">Total Gallons</Label>
              <Input
                type="number"
                min={0}
                step="0.1"
                {...register(`yieldTests.${idx}.totalGallons`, {
                  setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                })}
                placeholder="e.g. 250"
                className="h-8 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1 sm:contents">
              <Label className="text-xs text-muted-foreground sm:hidden">Sec to Fill 5-Gal Bucket</Label>
              <Input
                type="number"
                min={0}
                step="0.1"
                {...register(`yieldTests.${idx}.secondsToFillBucket`, {
                  setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                })}
                placeholder="e.g. 45"
                className="h-8 text-sm"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
