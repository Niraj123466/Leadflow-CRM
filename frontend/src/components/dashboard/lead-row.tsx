"use client";

import { AlertTriangle } from "lucide-react";

import { StatusBadge } from "@/components/dashboard/status-badge";
import { cn } from "@/lib/utils";
import { describeFollowUp, relativeTime } from "@/lib/format";
import type { Lead } from "@/types/lead";

/**
 * Desktop table row. The whole row is a button so it is keyboard operable and
 * announces its purpose; the dialog is opened from the parent on select.
 */
export function LeadRow({ lead, onSelect }: { lead: Lead; onSelect: (lead: Lead) => void }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(lead)}
      aria-label={`Open timeline for ${lead.name}`}
      className={cn(
        "grid w-full grid-cols-[minmax(0,1.4fr)_7.5rem_12rem] items-center gap-3 border-b border-border/70 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-accent/50 focus-visible:bg-accent/50 lg:grid-cols-[minmax(0,1.4fr)_7.5rem_minmax(0,1.6fr)_12rem]",
        lead.is_overdue && "bg-destructive/[0.06]",
      )}
    >
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">{lead.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {lead.company ?? "No company"}
        </p>
      </div>

      <div>
        <StatusBadge status={lead.status} />
      </div>

      <div className="hidden min-w-0 lg:block">
        {lead.latest_note ? (
          <>
            <p className="truncate text-sm text-foreground/90">{lead.latest_note}</p>
            <p className="text-xs text-muted-foreground">
              {relativeTime(lead.latest_discussion_at)}
              {lead.discussion_count > 1 ? ` · ${lead.discussion_count} notes` : ""}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No discussions yet</p>
        )}
      </div>

      <div className="text-right">
        <p
          className={cn(
            "flex items-center justify-end gap-1.5 text-sm",
            lead.is_overdue ? "font-medium text-destructive" : "text-muted-foreground",
          )}
        >
          {lead.is_overdue ? <AlertTriangle className="size-3.5 shrink-0" aria-hidden /> : null}
          <span className="truncate">{describeFollowUp(lead)}</span>
        </p>
      </div>
    </button>
  );
}
