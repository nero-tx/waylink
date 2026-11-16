"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { useUrl, type UseUrlOptions } from "@/hooks/useUrl";
import type { SupportCategory } from "@/lib/all-types";
import {
  buildSupportTicketsUrl,
  SupportTicketsResponse,
} from "@/app/account/support/support-filters";
import {
  DEFAULT_FILTERS,
  STATUS_FILTERS,
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  type SupportFiltersState,
} from "@/app/account/support/support-filters";
import { cn } from "@/lib/utils";
import { CreateTicketDialog } from "./CreateTicketDialog";
import {
  StatusTabs,
  SupportFilters,
  SupportTicketRow,
} from "./SupportElements";
import {
  SupportTicketsEmpty,
  SupportTicketsError,
  SupportTicketsSkeleton,
} from "./SupportElements";

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

const URL_OPTIONS: UseUrlOptions<SupportFiltersState> = {
  allowed: {
    status: STATUS_FILTERS,
    category: ["all", ...SUPPORT_CATEGORIES],
    priority: ["all", ...SUPPORT_PRIORITIES],
  },
};

export function SupportTicketsView({ role }: { role: SupportRole }) {
  const config = ROLE_CONFIG[role];
  const [dialogOpen, setDialogOpen] = useState(false);

  const { urlParams, setUrlParams, resetUrl, hasActiveParams, isPending } =
    useUrl<SupportFiltersState>(DEFAULT_FILTERS, URL_OPTIONS);

  const apiUrl = useMemo(() => buildSupportTicketsUrl(urlParams), [urlParams]);

  const { data, error, isLoading, isFetching, refetch } =
    useFetch<SupportTicketsResponse>(apiUrl);

  console.log(data)

  const tickets = data?.tickets ?? [];
  const isRefreshing = !isLoading && (isFetching || isPending);

  const body = error ? (
    <SupportTicketsError error={error} onRetry={refetch} />
  ) : isLoading ? (
    <SupportTicketsSkeleton />
  ) : tickets.length === 0 ? (
    <SupportTicketsEmpty
      filtered={hasActiveParams}
      onReset={() => resetUrl()}
      openDialog={() => setDialogOpen(true)}
    />
  ) : (
    <ul
      aria-busy={isRefreshing}
      className={cn(
        "divide-y transition-opacity duration-150",
        isRefreshing && "opacity-60",
      )}
    >
      {tickets.map((ticket) => (
        <SupportTicketRow key={ticket.id} ticket={ticket} />
      ))}
    </ul>
  );

  return (
    <div className="space-y-4">
      <SupportFilters
        filters={urlParams}
        onChange={setUrlParams}
        categories={config.categories}
        actions={
          <Button
            onClick={() => setDialogOpen(true)}
            className="group cursor-pointer gap-2 bg-green-700 text-white transition-all duration-200 hover:bg-green-800 hover:shadow-md hover:shadow-green-700/20 dark:bg-green-600 dark:hover:bg-green-500"
          >
            <Plus className="size-4 transition-transform duration-200 group-hover:rotate-90" />
            New ticket
          </Button>
        }
      />

      <div className="overflow-hidden rounded-md border text-card-foreground">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          <StatusTabs
            value={urlParams.status}
            onChange={(status) => setUrlParams({ status })}
            counts={data?.counts}
            isLoading={isLoading}
          />
        </div>

        {body}
      </div>

      <CreateTicketDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={(payload) => console.log(payload)}
      />
    </div>
  );
}
