import { z } from "zod";
import { SupportCategory, SupportPriority } from "@/lib/all-types";

const SUPPORT_CATEGORIES = [
  "account",
  "provider_status",
  "booking",
  "billing",
  "listing",
  "technical",
  "other",
] as const satisfies readonly SupportCategory[];

const SUPPORT_PRIORITIES = [
  "low",
  "normal",
  "high",
  "urgent",
] as const satisfies readonly SupportPriority[];

export const supportTicketSchema = z.object({
  id: z.uuid().optional(),
  subject: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .min(5, "Title must be at least 5 characters.")
    .max(120, "Title must be 120 characters or less."),
  body: z
    .string()
    .trim()
    .min(1, "Description is required.")
    .min(10, "Please describe the issue in at least 10 characters.")
    .max(5000, "Description must be 5000 characters or less."),
  category: z.enum(SUPPORT_CATEGORIES, { message: "Select a category." }),
  priority: z.enum(SUPPORT_PRIORITIES, { message: "Select a priority." }),
  providerId: z.uuid().optional(),
});

export type SupportTicketFormValues = z.infer<typeof supportTicketSchema>;
