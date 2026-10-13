"use client";

import { Button } from "@/components/ui/button";
import { STATUS_META, LEAD_STATUSES, type LeadStatus } from "@/types/lead";
import { cn } from "@/lib/utils";

interface StatusFilterProps {
  selected: LeadStatus[];
  onChange: (statuses: LeadStatus[]) => void;
}

/** Toggleable status chips. "All" clears the selection. */
export function StatusFilter({ selected, onChange }: StatusFilterProps) {
  const toggle = (status: LeadStatus) => {
    onChange(
      selected.includes(status)
        ? selected.filter((value) => value !== status)
        : [...selected, status],
    );
  };

  return (
    <div
      role="group"
      aria-label="Filter leads by status"
      className="flex flex-wrap items-center gap-1.5"
    >
      <Button
        type="button"
        size="sm"
        variant={selected.length === 0 ? "secondary" : "ghost"}
        aria-pressed={selected.length === 0}
        onClick={() => onChange([])}
      >
        All
      </Button>
      {LEAD_STATUSES.map((status) => {
        const active = selected.includes(status);
        return (
          <Button
            key={status}
            type="button"
            size="sm"
            variant={active ? "secondary" : "ghost"}
            aria-pressed={active}
            onClick={() => toggle(status)}
            className={cn("gap-1.5", !active && "text-muted-foreground")}
          >
            <span
              className={cn("size-1.5 rounded-full", STATUS_META[status].dot)}
              aria-hidden
            />
            {STATUS_META[status].label}
          </Button>
        );
      })}
    </div>
  );
}
