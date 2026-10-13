"use client";

import { LeadCard } from "@/components/dashboard/lead-card";
import { LeadRow } from "@/components/dashboard/lead-row";
import { EmptyState } from "@/components/dashboard/lead-states";
import type { Lead } from "@/types/lead";

interface LeadListProps {
  leads: Lead[];
  onSelect: (lead: Lead) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

/** Responsive lead list: a grid-row table on desktop, cards on small screens. */
export function LeadList({
  leads,
  onSelect,
  emptyTitle = "No leads match",
  emptyDescription = "Try a different search term or clear the status filters.",
}: LeadListProps) {
  if (leads.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <>
      {/* Mobile: card stack */}
      <ul className="flex flex-col gap-3 p-3 lg:hidden" aria-label="Leads">
        {leads.map((lead) => (
          <li key={lead.id}>
            <LeadCard lead={lead} onSelect={onSelect} />
          </li>
        ))}
      </ul>

      {/* Desktop: table-like grid */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-[minmax(0,1.4fr)_7.5rem_minmax(0,1.6fr)_12rem] gap-3 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Lead</span>
          <span>Status</span>
          <span>Latest discussion</span>
          <span className="text-right">Next follow-up</span>
        </div>
        <div>
          {leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} onSelect={onSelect} />
          ))}
        </div>
      </div>
    </>
  );
}
