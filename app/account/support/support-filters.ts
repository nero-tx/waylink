import type {
  Pagination,
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
  data: {
    tickets: SupportTicket[];
    counts?: Record<StatusFilter, number>;
    pagination: Pagination;
  };
}

export function buildSupportTicketsUrl(
  filters: SupportFiltersState,
  pagination: Pick<Pagination, "limit" | "offset">,
  role: "user" | "provider" = "user",
) {
  return buildUrl(
    `/api/support?role=${role}`,
    {
      status:
        filters.status === "all"
          ? undefined
          : [...STATUS_GROUPS[filters.status]],
      category: filters.category,
      priority: filters.priority,
      search: filters.q.trim(),
      limit: pagination.limit,
      offset: pagination.offset,
    },
    { ignore: { category: "all", priority: "all" } },
  );
}

export const STATUS_LABEL: Record<SupportStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_on_customer: "Waiting on customer",
  resolved: "Resolved",
  closed: "Closed",
};

export const PRIORITY_LABEL: Record<SupportPriority, string> = {
  low: "Low",
  normal: "Normal",
  high: "High",
  urgent: "Urgent",
};

export const CATEGORY_LABEL: Record<SupportCategory, string> = {
  account: "Account",
  provider_status: "Provider status",
  booking: "Booking",
  billing: "Billing",
  listing: "Listing",
  technical: "Technical",
  other: "Other",
};

export const STATUS_DOT: Record<SupportStatus, string> = {
  open: "bg-emerald-500",
  in_progress: "bg-sky-500",
  waiting_on_customer: "bg-amber-500",
  resolved: "bg-teal-700",
  closed: "bg-zinc-400",
};

export const PRIORITY_STYLE: Record<SupportPriority, string> = {
  low: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400",
  normal: "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  high: "bg-orange-500/10 text-orange-700 dark:text-orange-400",
  urgent: "bg-red-500/10 text-red-700 dark:text-red-400",
};