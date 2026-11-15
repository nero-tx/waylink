"use client";

import { useState, useMemo, useCallback } from "react";
import {
  CheckCircle2,
  CircleDot,
  Clock,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SupportCategory, SupportTicket } from "@/lib/all-types";
import {
  filterTickets,
  getStatusCounts,
  parseFilters,
  SupportFiltersState,
  type StatusFilter,
} from "@/lib/support-filters";
import { SupportFilters, SupportTicketRow } from "./SupportElements";
import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CreateTicketDialog } from "./CreateTicketDialog";

export type SupportRole = "user" | "provider";

const ROLE_CONFIG: Record<
  SupportRole,
  { categories: readonly SupportCategory[] }
> = {
  user: {
    categories: ["account", "booking", "billing", "technical", "other"],
  },
  provider: {
    categories: [
      "account",
      "provider_status",
      "booking",
      "billing",
      "listing",
      "technical",
      "other",
    ],
  },
};

const STATUS_TABS: { value: StatusFilter; label: string; icon?: LucideIcon }[] =
  [
    { value: "open", label: "Open", icon: CircleDot },
    { value: "pending", label: "Pending", icon: Clock },
    { value: "closed", label: "Closed", icon: CheckCircle2 },
    { value: "all", label: "All" },
  ];

interface SupportTicketsViewProps {
  role: SupportRole;
  tickets: SupportTicket[];
}

const DEFAULT_FILTERS: SupportFiltersState = {
  status: "open",
  category: "all",
  priority: "all",
  q: "",
};

export function SupportTicketsView({ role, tickets }: SupportTicketsViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const config = ROLE_CONFIG[role];

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const resetFilters = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [router, pathname]);

  const setFilters = useCallback(
    (patch: Partial<SupportFiltersState>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(patch) as [
        keyof SupportFiltersState,
        string,
      ][]) {
        if (value === DEFAULT_FILTERS[key]) params.delete(key);
        else params.set(key, value);
      }

      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [router, pathname, searchParams],
  );

  // Client-side for now. When the API reads the URL params, pass `filters`
  // to the fetch and drop this line.
  const visibleTickets = useMemo(
    () => filterTickets(tickets, filters),
    [tickets, filters],
  );
  const counts = useMemo(() => getStatusCounts(tickets), [tickets]);

  return (
    <div className="space-y-4">
      <SupportFilters
        filters={filters}
        onChange={setFilters}
        categories={config.categories}
        actions={
          <Button
            onClick={() => setDialogOpen(true)}
            className="gap-2 bg-green-700 text-white transition-all duration-200 hover:bg-green-800 hover:shadow-md hover:shadow-green-700/20 dark:bg-green-600 dark:hover:bg-green-500 cursor-pointer"
          >
            <Plus className="size-4 transition-transform duration-200 group-hover:rotate-90" />
            New ticket
          </Button>
        }
      />

      <div className="overflow-hidden rounded-md border text-card-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          <div className="flex flex-wrap items-center gap-4">
            {STATUS_TABS.map(({ value, label, icon: Icon }) => {
              const isActive = filters.status === value;

              return (
                <span
                  key={value}
                  role="button"
                  tabIndex={0}
                  onClick={() => setFilters({ status: value as StatusFilter })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setFilters({ status: value as StatusFilter });
                    }
                  }}
                  className={cn(
                    "inline-flex cursor-pointer items-center gap-1.5 py-1.5 px-0.5 border-b-2 text-sm transition-colors duration-200",
                    isActive
                      ? "font-semibold text-foreground border-foreground"
                      : "text-muted-foreground hover:text-green-700 dark:hover:text-green-400 border-transparent",
                  )}
                >
                  {Icon && <Icon className="size-4" />}
                  <span>
                    {counts[value]} {label}
                  </span>
                </span>
              );
            })}
          </div>
        </div>

        {visibleTickets.length === 0 ? (
          <div className="px-4 py-14 text-center">
            <CircleDot className="mx-auto mb-3 size-8 text-muted-foreground" />
            {tickets.length === 0 ? (
              <>
                <h3 className="mb-1 text-base font-semibold">
                  No support tickets yet
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Open a ticket and our team will get back to you.
                </p>
                <Button size="sm" onClick={() => setDialogOpen(true)}>
                  New ticket
                </Button>
              </>
            ) : (
              <>
                <h3 className="mb-1 text-base font-semibold">
                  No matching support tickets
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Try adjusting your status, category or priority filters.
                </p>
                <Button size="sm" variant="outline" onClick={resetFilters}>
                  Reset filters
                </Button>
              </>
            )}
          </div>
        ) : (
          <ul className="divide-y">
            {visibleTickets.map((ticket) => (
              <SupportTicketRow key={ticket.id} ticket={ticket} />
            ))}
          </ul>
        )}
      </div>

      <CreateTicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(payload) => console.log(payload)}
        provider="ajsnc sa ic"
        ticket={undefined}
      />
    </div>
  );
}
