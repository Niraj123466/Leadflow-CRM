"use client";

import * as React from "react";
import { X, Calendar, Clock, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { STATUS_META, LEAD_STATUSES, type Lead, type LeadStatus } from "@/types/lead";
import { cn } from "@/lib/utils";
import { combineDateAndTime, formatDateTime, relativeTime } from "@/lib/format";
import { useDiscussions } from "@/hooks/use-leads";
import type { Discussion } from "@/types/lead";

interface TimelineDialogProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange: (leadId: number, status: LeadStatus) => void;
  onCreateDiscussion: (note: string, followUpAt: string | null) => Promise<void>;
}

export function TimelineDialog({
  lead,
  open,
  onOpenChange,
  onStatusChange,
  onCreateDiscussion,
}: TimelineDialogProps) {
  const [status, setStatus] = React.useState<LeadStatus | null>(lead?.status ?? null);
  const [note, setNote] = React.useState("");
  const [followUpDate, setFollowUpDate] = React.useState("");
  const [followUpTime, setFollowUpTime] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  // Load discussions when lead changes
  const { data: discussions = [], isLoading } = useDiscussions(lead?.id ?? null);

  // Reset form when lead changes
  React.useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setNote("");
      setFollowUpDate("");
      setFollowUpTime("");
    }
  }, [lead]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    if (!lead) return;

    setSubmitting(true);
    try {
      const followUpAt = combineDateAndTime(followUpDate || undefined, followUpTime || undefined);
      await onCreateDiscussion(note.trim(), followUpAt);
      setNote("");
      setFollowUpDate("");
      setFollowUpTime("");
    } finally {
      setSubmitting(false);
    }
  };

  if (!lead) return null;

  const meta = STATUS_META[lead.status];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="truncate">{lead.name}</DialogTitle>
              <DialogDescription className="mt-1 flex items-center gap-2">
                {lead.company ? (
                  <span className="text-sm text-muted-foreground">{lead.company}</span>
                ) : null}
                <StatusBadge status={lead.status} className="ml-auto" />
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-[280px_1fr]">
          {/* Sidebar: lead details + status */}
          <Card className="p-4 space-y-4">
            <div className="space-y-3">
              {lead.phone && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Phone:</span>
                  {lead.phone}
                </p>
              )}
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Created:</span>
                {formatDateTime(lead.created_at)}
              </p>
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Updated:</span>
                {formatDateTime(lead.updated_at)}
              </p>
            </div>

            <div className="space-y-2 pt-3 border-t border-border">
              <Label htmlFor="status-select" className="text-xs font-medium uppercase tracking-wide">
                Status
              </Label>
              <Select
                value={status ?? lead.status}
                onValueChange={(value) => setStatus(value as LeadStatus)}
                disabled={status === lead.status}
>
                <SelectTrigger id="status-select" className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      <div className="flex items-center gap-2">
                        <span className={cn("size-2 rounded-full", STATUS_META[s].dot)} />
                        {STATUS_META[s].label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {status !== lead.status && (
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onStatusChange(lead.id, status as LeadStatus)}
                  disabled={submitting}
                >
                  Save status
                </Button>
              )}
            </div>
          </Card>

          {/* Main: discussion history + new note form */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 max-h-[45vh] overflow-y-auto">
              {isLoading ? (
                <p className="text-center py-8 text-sm text-muted-foreground">Loading discussions…</p>
              ) : discussions.length === 0 ? (
                <p className="text-center py-8 text-sm text-muted-foreground">
                  No discussions yet. Add the first note below.
                </p>
              ) : (
                discussions.map((discussion) => (
                  <Card key={discussion.id} className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground whitespace-pre-wrap">{discussion.note}</p>
                        {discussion.follow_up_at && (
                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="size-3" aria-hidden />
                              <Clock className="size-3" aria-hidden />
                              {formatDateTime(discussion.follow_up_at)}
                            </span>
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <span>{relativeTime(discussion.created_at)}</span>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>

            {/* New discussion form - fixed at bottom */}
            <Card className="p-4 sticky bottom-0">
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="note" className="sr-only">
                    Discussion note
                  </Label>
                  <Textarea
                    id="note"
                    placeholder="Add a note…"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    className="resize-none"
                    disabled={submitting}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="followUpDate" className="sr-only">
                      Follow-up date
                    </Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <Label htmlFor="followUpTime" className="sr-only">
                      Follow-up time
                    </Label>
                    <Input
                      id="followUpTime"
                      type="time"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      className="w-full"
                      disabled={submitting}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto"
                    disabled={submitting || !note.trim()}
                  >
                    {submitting ? "Saving…" : "Save note"}
                  </Button>
                </DialogFooter>
              </form>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}