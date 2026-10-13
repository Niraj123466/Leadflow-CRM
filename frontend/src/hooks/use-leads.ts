"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { leadsApi } from "@/lib/api";
import type {
  DiscussionCreateInput,
  Lead,
  LeadCreateInput,
  LeadFilters,
  LeadUpdateInput,
} from "@/types/lead";

export const leadKeys = {
  all: ["leads"] as const,
  list: (filters: Partial<LeadFilters>) => ["leads", "list", filters] as const,
  detail: (id: number) => ["leads", "detail", id] as const,
  discussions: (id: number) => ["leads", "discussions", id] as const,
};

/** Lead list for the dashboard, with filters as part of the cache key. */
export function useLeads(filters: Partial<LeadFilters>) {
  return useQuery({
    queryKey: leadKeys.list(filters),
    queryFn: ({ signal }) => leadsApi.list(filters, signal),
    placeholderData: keepPreviousData,
  });
}

export function useLead(id: number | null) {
  return useQuery({
    queryKey: leadKeys.detail(id ?? 0),
    queryFn: () => leadsApi.get(id as number),
    enabled: id !== null,
  });
}

export function useDiscussions(id: number | null) {
  return useQuery({
    queryKey: leadKeys.discussions(id ?? 0),
    queryFn: () => leadsApi.listDiscussions(id as number),
    enabled: id !== null,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: LeadCreateInput) => leadsApi.create(input),
    onSuccess: (lead: Lead) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      toast.success(`Added ${lead.name} to your pipeline.`);
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: LeadUpdateInput }) =>
      leadsApi.update(id, input),
    onSuccess: (lead: Lead) => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(lead.id) });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}

export function useCreateDiscussion(leadId: number | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: DiscussionCreateInput) =>
      leadsApi.createDiscussion(leadId as number, input),
    onSuccess: () => {
      // Refresh the timeline, this lead's detail and the list (latest note,
      // relative time and follow-up all change).
      queryClient.invalidateQueries({ queryKey: leadKeys.discussions(leadId ?? 0) });
      queryClient.invalidateQueries({ queryKey: leadKeys.detail(leadId ?? 0) });
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
    },
    onError: (error: Error) => toast.error(error.message),
  });
}
