import type {
  SupportCategory,
  SupportPriority,
  SupportStatus,
  SupportTicket,
} from "@/lib/all-types";
import { buildUrl } from "@/lib/utils";

/** UI groups of the 5 real statuses. */
export type StatusFilter = "open" | "pending" | "closed" | "all";
export type CategoryFilter = SupportCategory | "all";
export type PriorityFilter = SupportPriority | "all";

export interface SupportFiltersState {
  status: StatusFilter;
  category: CategoryFilter;
  priority: PriorityFilter;
  q: string;
}

export const DEFAULT_FILTERS: SupportFiltersState = {
  status: "open",
  category: "all",
  priority: "all",
  q: "",
};

export const SUPPORT_CATEGORIES: readonly SupportCategory[] = [
  "account",
  "provider_status",
  "booking",
  "billing",
  "listing",
  "technical",
  "other",
];

export const SUPPORT_PRIORITIES: readonly SupportPriority[] = [
  "low",
  "normal",
  "high",
  "urgent",
];

export const STATUS_FILTERS: readonly StatusFilter[] = [
  "open",
  "pending",
  "closed",
  "all",
];

export const STATUS_GROUPS: Record<
  Exclude<StatusFilter, "all">,
  readonly SupportStatus[]
> = {
  open: ["open"],
  pending: ["in_progress", "waiting_on_customer"],
  closed: ["resolved", "closed"],
};

export function getStatusCounts(tickets: readonly SupportTicket[]) {
  const countGroup = (group: Exclude<StatusFilter, "all">) =>
    tickets.filter((t) => STATUS_GROUPS[group].includes(t.status)).length;

  return {
    all: tickets.length,
    open: countGroup("open"),
    pending: countGroup("pending"),
    closed: countGroup("closed"),
  } satisfies Record<StatusFilter, number>;
}

export interface SupportTicketsResponse {
  tickets: SupportTicket[];
  counts?: Record<StatusFilter, number>;
}

export function buildSupportTicketsUrl(
  filters: SupportFiltersState,
) {
  return buildUrl(
    "/api/support",
    {
      status:
        filters.status === "all" ? [] : [...STATUS_GROUPS[filters.status]],
      category: filters.category,
      priority: filters.priority,
      q: filters.q.trim(),
    },
    { ignore: { category: "all", priority: "all" } },
  );
}
