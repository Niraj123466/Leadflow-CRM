/**
 * Domain types shared across the frontend.
 * These mirror the FastAPI response schemas in `backend/app/schemas/lead.py`.
 */

export const LEAD_STATUSES = [
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "won",
  "lost",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type FollowUpState = "none" | "overdue" | "today" | "upcoming";

export interface Lead {
  id: number;
  name: string;
  company: string | null;
  phone: string | null;
  status: LeadStatus;
  next_follow_up_at: string | null;
  follow_up_state: FollowUpState;
  is_overdue: boolean;
  is_today: boolean;
  latest_note: string | null;
  latest_discussion_at: string | null;
  discussion_count: number;
  created_at: string;
  updated_at: string;
}

export interface Discussion {
  id: number;
  lead_id: number;
  note: string;
  follow_up_at: string | null;
  created_at: string;
}

export interface LeadListResponse {
  items: Lead[];
  total: number;
  today: string;
  timezone: string;
}

export interface LeadCreateInput {
  name: string;
  company?: string | null;
  phone?: string | null;
  status?: LeadStatus;
}

export interface LeadUpdateInput {
  name?: string;
  company?: string | null;
  phone?: string | null;
  status?: LeadStatus;
  next_follow_up_at?: string | null;
}

export interface DiscussionCreateInput {
  note: string;
  follow_up_at?: string | null;
}

export interface LeadFilters {
  statuses: LeadStatus[];
  search: string;
}

/** Presentation metadata for each status (label + badge variant). */
export const STATUS_META: Record<
  LeadStatus,
  { label: string; badge: string; dot: string }
> = {
  new: { label: "New", badge: "slate", dot: "bg-slate-400" },
  contacted: { label: "Contacted", badge: "cyan", dot: "bg-cyan-400" },
  qualified: { label: "Qualified", badge: "violet", dot: "bg-violet-400" },
  proposal_sent: { label: "Proposal Sent", badge: "amber", dot: "bg-amber-400" },
  won: { label: "Won", badge: "emerald", dot: "bg-emerald-400" },
  lost: { label: "Lost", badge: "rose", dot: "bg-rose-400" },
};

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}
