import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/lib/rules-engine";

type StatusBadgeProps = {
  status: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
};

const statusStyles: Record<string, string> = {
  green:
    "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700",
  yellow:
    "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700",
  red: "bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700",
};

const dotStyles: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
};

const sizeStyles = {
  sm: "text-xs px-2 py-0.5 gap-1.5",
  md: "text-sm px-2.5 py-1 gap-2",
  lg: "text-base px-4 py-1.5 gap-2.5",
};

const dotSizes = {
  sm: "w-1.5 h-1.5",
  md: "w-2 h-2",
  lg: "w-2.5 h-2.5",
};

export function StatusBadge({ status, size = "md", showLabel = true }: StatusBadgeProps) {
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        statusStyles[status] ?? "bg-muted text-muted-foreground border-border",
        sizeStyles[size]
      )}
    >
      <span
        className={cn(
          "rounded-full shrink-0",
          dotStyles[status] ?? "bg-muted-foreground",
          dotSizes[size]
        )}
      />
      {showLabel && label}
    </span>
  );
}
