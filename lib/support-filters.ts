import type {
  SupportCategory,
  SupportPriority,
  SupportStatus,
  SupportTicket,
} from "@/lib/all-types";

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

const STATUS_FILTERS: readonly StatusFilter[] = [
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

function pick<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Reads + validates filters from search params. Unknown values fall back to defaults. */
export function parseFilters(params: {
  get(name: string): string | null;
}): SupportFiltersState {
  return {
    status: pick(params.get("status"), STATUS_FILTERS, DEFAULT_FILTERS.status),
    category: pick<CategoryFilter>(
      params.get("category"),
      ["all", ...SUPPORT_CATEGORIES],
      "all",
    ),
    priority: pick<PriorityFilter>(
      params.get("priority"),
      ["all", ...SUPPORT_PRIORITIES],
      "all",
    ),
    q: params.get("q") ?? "",
  };
}

/** Client-side filtering (remove once the API reads the URL) */
export function filterTickets<T extends SupportTicket>(
  tickets: readonly T[],
  filters: SupportFiltersState,
): T[] {
  const q = filters.q.trim().toLowerCase().replace(/^#/, "");

  return tickets
    .filter((t) => {
      if (
        filters.status !== "all" &&
        !STATUS_GROUPS[filters.status].includes(t.status)
      )
        return false;
      if (filters.category !== "all" && t.category !== filters.category)
        return false;
      if (filters.priority !== "all" && t.priority !== filters.priority)
        return false;
      if (q) {
        return (
          String(t.ticketNumber).includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.lastMessageAt).getTime() -
        new Date(a.lastMessageAt).getTime(),
    );
}

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
