import { Badge, type BadgeProps } from "@/components/ui/badge";
import { STATUS_META, type LeadStatus } from "@/types/lead";
import { cn } from "@/lib/utils";

export function StatusBadge({
  status,
  className,
}: {
  status: LeadStatus;
  className?: string;
}) {
  const meta = STATUS_META[status];
  return (
    <Badge
      variant={meta.badge as BadgeProps["variant"]}
      className={cn("capitalize", className)}
    >
      <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}
