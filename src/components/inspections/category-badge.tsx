import { CheckCircle2, AlertCircle, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoryStatus } from "@/lib/inspection-calc";

type Props = {
  status: CategoryStatus;
  label?: string;
  size?: "sm" | "md";
};

export function CategoryBadge({ status, label, size = "md" }: Props) {
  if (status === "pass") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-medium rounded-full border",
          "bg-green-50 text-green-700 border-green-300 dark:bg-green-900/20 dark:text-green-400 dark:border-green-700",
          size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1"
        )}
      >
        <CheckCircle2 className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
        {label ?? "Pass"}
      </span>
    );
  }

  if (status === "needs_attention") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-medium rounded-full border",
          "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700",
          size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1"
        )}
      >
        <AlertCircle className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
        {label ?? "Needs Attention"}
      </span>
    );
  }

  // null = indeterminate
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-full border",
        "bg-muted text-muted-foreground border-border",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1"
      )}
    >
      <HelpCircle className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {label ?? "Incomplete"}
    </span>
  );
}
