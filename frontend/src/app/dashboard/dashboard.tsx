"use client";

import * as React from "react";
import { Search, Plus, RefreshCw, Funnel } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { StatusFilter } from "@/components/dashboard/status-filter";
import { LeadList } from "@/components/dashboard/lead-list";
import { LeadListSkeleton, EmptyState, ErrorState, NoLeadsYet } from "@/components/dashboard/lead-states";
import { AddLeadDialog } from "@/components/dashboard/add-lead-dialog";
import { TimelineDialog } from "@/components/dashboard/timeline-dialog";
import { useLeads, useCreateDiscussion, useUpdateLead } from "@/hooks/use-leads";
import type { Lead, LeadStatus } from "@/types/lead";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [statuses, setStatuses] = React.useState<LeadStatus[]>([]);
  const [selectedLeadId, setSelectedLeadId] = React.useState<number | null>(null);
  const [addLeadOpen, setAddLeadOpen] = React.useState(false);

  // Debounce search input (300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: leadsData, isLoading, error, refetch } = useLeads({
    statuses: statuses.length > 0 ? statuses : undefined,
    search: debouncedSearch || undefined,
  });

  const leads = leadsData?.items ?? [];
  const createDiscussion = useCreateDiscussion(selectedLeadId);
  const updateLead = useUpdateLead();

  // Split leads into today's follow-ups and the rest
  const todayLeads = leads.filter((lead) => lead.is_today);
  const otherLeads = leads.filter((lead) => !lead.is_today);

  const handleStatusChange = React.useCallback(
    (leadId: number, newStatus: LeadStatus) => {
      updateLead.mutate({ id: leadId, input: { status: newStatus } });
    },
    [updateLead],
  );

  const handleCreateDiscussion = React.useCallback(
    async (note: string, followUpAt: string | null) => {
      if (selectedLeadId === null) return;
      await createDiscussion.mutateAsync({ note, follow_up_at: followUpAt });
    },
    [selectedLeadId, createDiscussion],
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/80 sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-primary/10 p-2 text-primary">
                <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </span>
              <div>
                <h1 className="text-xl font-semibold tracking-tight">LeadFlow</h1>
                <p className="text-xs text-muted-foreground">Lightweight lead management</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                disabled={isLoading}
                aria-label="Refresh leads"
              >
                <RefreshCw className={cn("size-4", isLoading && "animate-spin")} aria-hidden />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <AddLeadDialog open={addLeadOpen} onOpenChange={setAddLeadOpen} />
              <Button onClick={() => setAddLeadOpen(true)} className="gap-2">
                <Plus className="size-4" aria-hidden />
                Add lead
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Search + filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Label htmlFor="search" className="sr-only">
              Search leads
            </Label>
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="search"
              type="search"
              placeholder="Search by name or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <StatusFilter selected={statuses} onChange={setStatuses} />
        </div>

        {/* Metrics */}
        <div className="mt-6" data-testid="metric-cards">
          <MetricCards leads={leads} />
        </div>

        {/* Today's follow-ups (pinned) */}
        {todayLeads.length > 0 && (
          <section aria-labelledby="today-heading" className="mt-6">
            <div className="flex items-center justify-between gap-4 mb-3">
              <h2
                id="today-heading"
                className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-warning"
              >
                <Funnel className="size-4" aria-hidden />
                Today's follow-ups ({todayLeads.length})
              </h2>
            </div>
            <LeadList
              leads={todayLeads}
              onSelect={(lead) => setSelectedLeadId(lead.id)}
              emptyTitle="No follow-ups due today"
              emptyDescription="All caught up!"
            />
          </section>
        )}

        {/* All other leads */}
        <section aria-labelledby="leads-heading" className="mt-6">
          <h2 id="leads-heading" className="sr-only">
            Leads
          </h2>

          {isLoading ? (
            <LeadListSkeleton rows={6} />
          ) : error ? (
            <ErrorState
              message={error instanceof Error ? error.message : "Unknown error"}
              onRetry={() => refetch()}
            />
          ) : leads.length === 0 ? (
            <NoLeadsYet onAdd={() => setAddLeadOpen(true)} />
          ) : (
            <LeadList
              leads={otherLeads}
              onSelect={(lead) => setSelectedLeadId(lead.id)}
              emptyTitle="No other leads"
              emptyDescription="All leads are shown in the Today's follow-ups section above."
            />
          )}
        </section>
      </main>

      {/* Timeline dialog */}
      <TimelineDialog
        lead={selectedLeadId ? leads.find((l) => l.id === selectedLeadId) ?? null : null}
        open={selectedLeadId !== null}
        onOpenChange={(open) => !open && setSelectedLeadId(null)}
        onStatusChange={handleStatusChange}
        onCreateDiscussion={handleCreateDiscussion}
      />
    </div>
  );
}