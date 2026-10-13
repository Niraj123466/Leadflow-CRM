/** Date/time formatting helpers. All inputs are ISO strings (UTC). */

import {
  differenceInCalendarDays,
  format,
  formatDistanceToNowStrict,
  isPast,
  isToday,
  isTomorrow,
} from "date-fns";

import type { Lead } from "@/types/lead";

/** "just now" / "3h ago" / "5d ago" for a UTC ISO timestamp. */
export function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  const diffSeconds = Math.abs(Date.now() - date.getTime()) / 1000;
  if (diffSeconds < 45) return "just now";
  return `${formatDistanceToNowStrict(date)} ago`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return format(new Date(iso), "MMM d, yyyy · h:mm a");
}

export function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  return format(new Date(iso), "MMM d");
}

/** Human-readable description of the next follow-up relative to now. */
export function describeFollowUp(lead: Pick<Lead, "next_follow_up_at" | "follow_up_state">): string {
  const { next_follow_up_at, follow_up_state } = lead;
  if (!next_follow_up_at) return "No follow-up scheduled";

  const date = new Date(next_follow_up_at);
  const time = format(date, "h:mm a");

  if (follow_up_state === "overdue") {
    const days = Math.abs(differenceInCalendarDays(date, new Date()));
    if (days === 0) return `Due earlier today · ${time}`;
    if (days === 1) return `Overdue by 1 day · ${time}`;
    return `Overdue by ${days} days · ${time}`;
  }
  if (follow_up_state === "today" || isToday(date)) return `Today · ${time}`;
  if (isTomorrow(date)) return `Tomorrow · ${time}`;
  return `${format(date, "MMM d")} · ${time}`;
}

/** Combine separate `date` (YYYY-MM-DD) and `time` (HH:mm) inputs into ISO. */
export function combineDateAndTime(
  date: string | undefined,
  time: string | undefined,
): string | null {
  if (!date) return null;
  const normalizedTime = time && time.length > 0 ? time : "09:00";
  const local = new Date(`${date}T${normalizedTime}`);
  if (Number.isNaN(local.getTime())) return null;
  return local.toISOString();
}

/** Today's date as `YYYY-MM-DD` in the browser's local timezone. */
export function todayInputValue(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function isOverdueFollowUp(iso: string | null): boolean {
  if (!iso) return false;
  return isPast(new Date(iso));
}
