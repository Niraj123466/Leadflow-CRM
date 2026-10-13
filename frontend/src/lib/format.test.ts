import { describe, it, expect, vi } from "vitest";
import { relativeTime, formatDateTime, combineDateAndTime, describeFollowUp, todayInputValue } from "@/lib/format";

describe("format utilities", () => {
  describe("relativeTime", () => {
    it("returns '—' for null", () => {
      expect(relativeTime(null)).toBe("—");
    });

    it("returns 'just now' for very recent timestamps", () => {
      const now = new Date().toISOString();
      expect(relativeTime(now)).toBe("just now");
    });

    it("returns formatted distance for older timestamps", () => {
      const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      expect(relativeTime(hourAgo)).toMatch(/1 hour ago|an hour ago/);
    });
  });

  describe("formatDateTime", () => {
    it("returns '—' for null", () => {
      expect(formatDateTime(null)).toBe("—");
    });

    it("formats ISO string to MMM d, yyyy · h:mm a", () => {
      expect(formatDateTime("2026-01-15T14:30:00Z")).toMatch(/Jan 15, 2026/);
    });
  });

  describe("combineDateAndTime", () => {
    it("returns null when date is missing", () => {
      expect(combineDateAndTime(undefined, "10:00")).toBeNull();
      expect(combineDateAndTime("", "10:00")).toBeNull();
    });

    it("combines date and time into a valid ISO string", () => {
      const iso = combineDateAndTime("2026-01-15", "14:30");
      expect(iso).toMatch(/^2026-01-15T/);
      expect(iso).toMatch(/Z$/);
    });

    it("defaults time to 09:00 when omitted", () => {
      const iso = combineDateAndTime("2026-01-15", "");
      expect(iso).toMatch(/^2026-01-15T/);
      expect(iso).toMatch(/Z$/);
    });

    it("returns null for invalid date", () => {
      expect(combineDateAndTime("not-a-date", "10:00")).toBeNull();
    });
  });

  describe("describeFollowUp", () => {
    it("returns 'No follow-up scheduled' when none", () => {
      expect(describeFollowUp({ next_follow_up_at: null, follow_up_state: "none" })).toBe(
        "No follow-up scheduled",
      );
    });

    it("shows overdue message for past dates", () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      expect(describeFollowUp({ next_follow_up_at: yesterday, follow_up_state: "overdue" })).toMatch(
        /Overdue/,
      );
    });

    it("shows 'Today' for today state", () => {
      const laterToday = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      expect(describeFollowUp({ next_follow_up_at: laterToday, follow_up_state: "today" })).toMatch(
        /Today/,
      );
    });

    it("shows 'Tomorrow' for tomorrow", () => {
      const tomorrow = new Date(Date.now() + 25 * 60 * 60 * 1000).toISOString();
      expect(describeFollowUp({ next_follow_up_at: tomorrow, follow_up_state: "upcoming" })).toMatch(
        /Tomorrow/,
      );
    });
  });

  describe("todayInputValue", () => {
    it("returns YYYY-MM-DD format", () => {
      const result = todayInputValue();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});