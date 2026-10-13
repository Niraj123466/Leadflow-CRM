/**
 * Thin, typed API client for the LeadFlow backend.
 *
 * All network access goes through `request()` so error handling and base-URL
 * resolution live in one place.
 */

import type {
  Discussion,
  DiscussionCreateInput,
  Lead,
  LeadCreateInput,
  LeadFilters,
  LeadListResponse,
  LeadUpdateInput,
} from "@/types/lead";

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export interface ApiErrorDetail {
  field: string;
  message: string;
  type?: string;
}

/** Error thrown for any non-2xx response, carrying the structured envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[] | null;

  constructor(
    status: number,
    message: string,
    code = "error",
    details: ApiErrorDetail[] | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ErrorEnvelope {
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[] | null;
  };
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      ...init,
    });
  } catch {
    throw new ApiError(0, "Could not reach the server. Check your connection.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    const envelope = (payload ?? {}) as ErrorEnvelope;
    throw new ApiError(
      response.status,
      envelope.error?.message ?? `Request failed with status ${response.status}.`,
      envelope.error?.code ?? "error",
      envelope.error?.details ?? null,
    );
  }

  return payload as T;
}

function buildQuery(filters: Partial<LeadFilters>): string {
  const params = new URLSearchParams();
  for (const status of filters.statuses ?? []) {
    params.append("status", status);
  }
  if (filters.search?.trim()) {
    params.set("search", filters.search.trim());
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export const leadsApi = {
  list(filters: Partial<LeadFilters> = {}, signal?: AbortSignal): Promise<LeadListResponse> {
    return request<LeadListResponse>(`/api/leads${buildQuery(filters)}`, { signal });
  },

  get(id: number): Promise<Lead> {
    return request<Lead>(`/api/leads/${id}`);
  },

  create(input: LeadCreateInput): Promise<Lead> {
    return request<Lead>("/api/leads", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  update(id: number, input: LeadUpdateInput): Promise<Lead> {
    return request<Lead>(`/api/leads/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  listDiscussions(id: number): Promise<Discussion[]> {
    return request<Discussion[]>(`/api/leads/${id}/discussions`);
  },

  createDiscussion(id: number, input: DiscussionCreateInput): Promise<Discussion> {
    return request<Discussion>(`/api/leads/${id}/discussions`, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
