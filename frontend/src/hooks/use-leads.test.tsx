import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useLeads, useCreateLead, useUpdateLead, useCreateDiscussion, useDiscussions } from "@/hooks/use-leads";
import { leadsApi } from "@/lib/api";
import type { Lead, Discussion, LeadListResponse, LeadCreateInput } from "@/types/lead";

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockLeads: Lead[] = [
  {
    id: 1,
    name: "Test Lead",
    company: "Test Co",
    phone: "+1 555 0000",
    status: "new",
    next_follow_up_at: null,
    follow_up_state: "none",
    is_overdue: false,
    is_today: false,
    latest_note: "Initial contact",
    latest_discussion_at: "2026-01-15T10:00:00Z",
    discussion_count: 1,
    created_at: "2026-01-10T10:00:00Z",
    updated_at: "2026-01-15T10:00:00Z",
  },
];

const mockListResponse: LeadListResponse = {
  items: mockLeads,
  total: 1,
  today: "2026-01-15",
  timezone: "UTC",
};

const mockDiscussions: Discussion[] = [
  {
    id: 1,
    lead_id: 1,
    note: "First discussion",
    follow_up_at: null,
    created_at: "2026-01-15T10:00:00Z",
  },
];

function jsonResponse<T>(data: T, status = 200) {
  return new Response(JSON.stringify(data), { status });
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("useLeads", () => {
  it("fetches leads with default filters", async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce(jsonResponse(mockListResponse));

    const { result } = renderHook(() => useLeads({}), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toEqual(mockLeads);
  });

  it("includes status and search in query", async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce(jsonResponse(mockListResponse));

    renderHook(
      () => useLeads({ statuses: ["qualified"], search: "Acme" }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const callUrl = (global.fetch as vi.Mock).mock.calls[0][0];
    expect(callUrl).toContain("status=qualified");
    expect(callUrl).toContain("search=Acme");
  });
});

describe("useCreateLead", () => {
  it("creates a lead", async () => {
    const newLead: Lead = { ...mockLeads[0], id: 2, name: "New Lead" };

    (global.fetch as vi.Mock).mockResolvedValueOnce(jsonResponse(newLead));

    const { result } = renderHook(() => useCreateLead(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync({ name: "New Lead" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 2000 });
    await promise;
  });
});

describe("useUpdateLead", () => {
  it("updates lead status", async () => {
    const updatedLead: Lead = { ...mockLeads[0], status: "won" };

    (global.fetch as vi.Mock).mockResolvedValueOnce(jsonResponse(updatedLead));

    const { result } = renderHook(() => useUpdateLead(), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync({ id: 1, input: { status: "won" } });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 2000 });
    await promise;
  });
});

describe("useCreateDiscussion", () => {
  it("creates a discussion", async () => {
    const newDiscussion: Discussion = { ...mockDiscussions[0], id: 2, note: "Follow-up note" };

    (global.fetch as vi.Mock).mockResolvedValueOnce(jsonResponse(newDiscussion));

    const { result } = renderHook(() => useCreateDiscussion(1), { wrapper: createWrapper() });

    const promise = result.current.mutateAsync({ note: "Follow-up note", follow_up_at: null });
    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 2000 });
    await promise;
  });
});

describe("useDiscussions", () => {
  it("fetches discussions for a lead", async () => {
    (global.fetch as vi.Mock).mockResolvedValueOnce(jsonResponse(mockDiscussions));

    const { result } = renderHook(() => useDiscussions(1), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true), { timeout: 2000 });
    expect(result.current.data).toEqual(mockDiscussions);
  });

  it("does not fetch when leadId is null", () => {
    const { result } = renderHook(() => useDiscussions(null), { wrapper: createWrapper() });
    // When disabled, query has no data
    expect(result.current.data).toBeUndefined();
  });
});