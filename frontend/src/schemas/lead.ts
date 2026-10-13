import { z } from "zod";

import { LEAD_STATUSES } from "@/types/lead";

/**
 * Form validation schemas. Kept separate from the API layer so they can be
 * unit-tested in isolation and reused by React Hook Form via zodResolver.
 */

export const leadFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(200, "Name must be 200 characters or fewer."),
  company: z
    .string()
    .trim()
    .max(200, "Company must be 200 characters or fewer.")
    .optional()
    .or(z.literal("")),
  phone: z
    .string()
    .trim()
    .max(50, "Phone must be 50 characters or fewer.")
    .optional()
    .or(z.literal("")),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const discussionFormSchema = z.object({
  note: z
    .string()
    .trim()
    .min(1, "Add a note before saving.")
    .max(5000, "Note must be 5000 characters or fewer."),
  followUpDate: z.string().optional().or(z.literal("")),
  followUpTime: z.string().optional().or(z.literal("")),
});

export type DiscussionFormValues = z.infer<typeof discussionFormSchema>;

export const statusUpdateSchema = z.object({
  status: z.enum(LEAD_STATUSES),
});
