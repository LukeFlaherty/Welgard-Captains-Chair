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
  const isStaticLevel = watch("yieldTestType") === "static_level_test";

  const gridCols = isStaticLevel
    ? "sm:grid-cols-[40px_1fr_1fr_1fr_1fr]"
    : "sm:grid-cols-[40px_1fr_1fr_1fr]";

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground">
        Record up to 6 sequential pump tests. Start time must be in{" "}
        <strong>HH:MM</strong> (24-hour) format. All tests assumed same day.
      </div>

      {/* Column headers */}
      <div className={`hidden sm:grid ${gridCols} sm:gap-x-3 sm:gap-y-1 items-end`}>
        <span />
        <Label className="text-xs text-muted-foreground font-medium">Start Time (HH:MM)</Label>
        <Label className="text-xs text-muted-foreground font-medium">Total Gallons</Label>
        <Label className="text-xs text-muted-foreground font-medium">Sec to Fill 5-Gal Bucket</Label>
        {isStaticLevel && (
          <Label className="text-xs text-muted-foreground font-medium">Static Water Level (ft)</Label>
        )}
      </div>

      {TEST_NUMBERS.map((n) => {
        const idx = n - 1;
        const hasData =
          yieldTests?.[idx]?.startTime ||
          yieldTests?.[idx]?.totalGallons != null ||
          yieldTests?.[idx]?.secondsToFillBucket != null ||
          yieldTests?.[idx]?.staticWaterLevelFt != null;

        return (
          <div key={n} className={`flex flex-col sm:grid ${gridCols} gap-2 sm:gap-x-3 items-start sm:items-center`}>
            <span
              className={`text-sm font-semibold w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                hasData
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {n}
            </span>

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

            {isStaticLevel && (
              <div className="flex flex-col gap-1 sm:contents">
                <Label className="text-xs text-muted-foreground sm:hidden">Static Water Level (ft)</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.1"
                  {...register(`yieldTests.${idx}.staticWaterLevelFt`, {
                    setValueAs: (v) => (v === "" || v == null ? null : parseFloat(v)),
                  })}
                  placeholder="e.g. 12"
                  className="h-8 text-sm"
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
