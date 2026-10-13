"use client";

import { AlertTriangle, Building2, MessageSquareText } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { cn } from "@/lib/utils";
import { describeFollowUp, relativeTime } from "@/lib/format";
import type { Lead } from "@/types/lead";

/** Compact lead card used on small screens where a wide table would overflow. */
export function LeadCard({ lead, onSelect }: { lead: Lead; onSelect: (lead: Lead) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(lead)}
      aria-label={`Open timeline for ${lead.name}`}
      className={cn(
        "w-full rounded-lg border border-border bg-card p-4 text-left transition-colors hover:bg-accent/50 focus-visible:bg-accent/50",
        lead.is_overdue && "border-destructive/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-foreground">{lead.name}</p>
          {lead.company ? (
            <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
              <Building2 className="size-3 shrink-0" aria-hidden />
              {lead.company}
            </p>
          ) : null}
        </div>
        <StatusBadge status={lead.status} />
      </div>

      {lead.latest_note ? (
        <p className="mt-3 flex items-start gap-1.5 text-sm text-foreground/90">
          <MessageSquareText className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="line-clamp-2">{lead.latest_note}</span>
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No discussions yet</p>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 text-xs">
        <span className="text-muted-foreground">
          {lead.latest_discussion_at
            ? `Updated ${relativeTime(lead.latest_discussion_at)}`
            : "Never contacted"}
        </span>
        <span
          className={cn(
            "flex items-center gap-1 text-right",
            lead.is_overdue ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          {lead.is_overdue ? <AlertTriangle className="size-3 shrink-0" aria-hidden /> : null}
          {describeFollowUp(lead)}
        </span>
      </div>
    </button>
  );
}
