"use client";

import { UseFormReturn } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { InspectionFormValues } from "@/types/inspection";

type Props = {
  form: UseFormReturn<InspectionFormValues>;
};

const TEST_NUMBERS = [1, 2, 3, 4, 5, 6] as const;

function parseMinutes(time: string): number {
  const parts = time.split(":");
  if (parts.length !== 2) return NaN;
  const h = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  if (isNaN(h) || isNaN(m)) return NaN;
  return h * 60 + m;
}

function calcIntervalGpm(
  prev: { startTime?: string | null; totalGallons?: number | null } | undefined,
  curr: { startTime?: string | null; totalGallons?: number | null }
): number | null {
  if (!prev) return null;
  if (!prev.startTime || !curr.startTime) return null;
  const prevGal = prev.totalGallons != null ? Number(prev.totalGallons) : null;
  const currGal = curr.totalGallons != null ? Number(curr.totalGallons) : null;
  if (prevGal == null || currGal == null) return null;
  const mins = parseMinutes(curr.startTime) - parseMinutes(prev.startTime);
  if (isNaN(mins) || mins <= 0) return null;
  return (currGal - prevGal) / mins;
}

function GpmPill({ gpm, isBaseline }: { gpm: number | null; isBaseline: boolean }) {
  if (isBaseline) {
    return <span className="text-xs text-muted-foreground italic">baseline</span>;
  }
  if (gpm === null) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }
  return (
    <span className={cn(
      "text-sm font-semibold tabular-nums",
      gpm >= 1.0 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
    )}>
      {gpm.toFixed(2)}
      <span className="text-xs font-normal text-muted-foreground ml-1">gpm</span>
    </span>
  );
}

export function YieldTestTable({ form }: Props) {
  const { register, watch } = form;
  const yieldTests = watch("yieldTests");
  const isStaticLevel = watch("yieldTestType") === "static_level_test";

  const gridCols = isStaticLevel
    ? "sm:grid-cols-[40px_1fr_1fr_1fr_1fr_88px]"
    : "sm:grid-cols-[40px_1fr_1fr_1fr_88px]";

  return (
    <div className="flex flex-col gap-3">
      <div className="text-xs text-muted-foreground">
        Record up to 6 sequential pump tests. Start time must be in{" "}
        <strong>HH:MM</strong> (24-hour) format. All tests assumed same day.
        Interval Yield updates live as you type — green ≥ 1.0 gpm, amber &lt; 1.0 gpm.
      </div>

      {/* Column headers */}
      <div className={`hidden sm:grid ${gridCols} sm:gap-x-3 items-end`}>
        <span />
        <Label className="text-xs text-muted-foreground font-medium">Start Time (HH:MM)</Label>
        <Label className="text-xs text-muted-foreground font-medium">Total Gallons (cumulative)</Label>
        <Label className="text-xs text-muted-foreground font-medium">Sec / 5-Gal Bucket</Label>
        {isStaticLevel && (
          <Label className="text-xs text-muted-foreground font-medium">Static Water Level (ft)</Label>
        )}
        <Label className="text-xs text-muted-foreground font-medium">Interval Yield</Label>
      </div>

      {TEST_NUMBERS.map((n) => {
        const idx = n - 1;
        const test  = yieldTests?.[idx];
        const prev  = idx > 0 ? yieldTests?.[idx - 1] : undefined;
        const hasData =
          test?.startTime ||
          test?.totalGallons != null ||
          test?.secondsToFillBucket != null ||
          test?.staticWaterLevelFt != null;

        const gpm = calcIntervalGpm(prev, test ?? {});

        return (
          <div key={n} className={`flex flex-col sm:grid ${gridCols} gap-2 sm:gap-x-3 items-start sm:items-center`}>
            {/* Row number */}
            <span className={cn(
              "text-sm font-semibold w-8 h-8 rounded-full flex items-center justify-center shrink-0",
              hasData ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            )}>
              {n}
            </span>

            {/* Start Time */}
            <div className="flex flex-col gap-1 sm:contents">
              <Label className="text-xs text-muted-foreground sm:hidden">Start Time (HH:MM)</Label>
              <Input
                {...register(`yieldTests.${idx}.startTime`)}
                placeholder="e.g. 10:30"
                className="h-8 text-sm"
              />
            </div>

            {/* Total Gallons */}
            <div className="flex flex-col gap-1 sm:contents">
              <Label className="text-xs text-muted-foreground sm:hidden">Total Gallons (cumulative)</Label>
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

            {/* Seconds to fill bucket */}
            <div className="flex flex-col gap-1 sm:contents">
              <Label className="text-xs text-muted-foreground sm:hidden">Sec / 5-Gal Bucket</Label>
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

            {/* Static water level (flow test only) */}
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

            {/* Live interval yield */}
            <div className="flex flex-col gap-1 sm:contents">
              <Label className="text-xs text-muted-foreground sm:hidden">Interval Yield</Label>
              <div className="h-8 flex items-center">
                <GpmPill gpm={gpm} isBaseline={n === 1} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
