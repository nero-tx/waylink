"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFetch } from "@/hooks/useFetch";
import { useUrl, type UseUrlOptions } from "@/hooks/useUrl";
import type { Pagination, SupportCategory } from "@/lib/all-types";
import {
  buildSupportTicketsUrl,
  DEFAULT_FILTERS,
  STATUS_FILTERS,
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  type SupportFiltersState,
  type SupportTicketsResponse,
} from "@/app/account/support/support-filters";
import { cn } from "@/lib/utils";
import {
  StatusTabs,
  SupportFilters,
  SupportTicketsEmpty,
  SupportTicketsError,
  SupportTicketsSkeleton,
  TicketsPagination,
  TicketsPaginationSkeleton,
} from "./SupportElements";
import type { SupportTicketFormValues } from "@/validations/support";
import { createSupportTicket } from "@/actions/support.action";
import { useSupportStore } from "@/stores/support.store";
import { SupportTicketRow } from "./SupportTicketRow";

const CreateTicketDialog = dynamic(
  () => import("./CreateTicketDialog").then((m) => m.CreateTicketDialog),
  { ssr: false },
);

export type SupportRole = "user" | "provider";
const LIMIT = 30;

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

const EMPTY_PAGINATION: Pagination = {
  limit: LIMIT,
  offset: 0,
  hasNextPage: false,
  hasPrevPage: false,
  page: 1,
  total: 0,
  totalPages: 0,
};

export function SupportTicketsView({ role }: { role: SupportRole }) {
  const config = ROLE_CONFIG[role];
  const cardRef = useRef<HTMLDivElement>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMounted, setDialogMounted] = useState(false);
  const { tickets, setTicket, counts, setCounts, updateCounts } =
    useSupportStore();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const { urlParams, setUrlParams, resetUrl, hasActiveParams, isPending } =
    useUrl<SupportFiltersState>(DEFAULT_FILTERS, URL_OPTIONS);

  const filterKey = useMemo(() => JSON.stringify(urlParams), [urlParams]);
  const [pageState, setPageState] = useState({ key: filterKey, page: 1 });
  if (pageState.key !== filterKey) {
    setPageState({ key: filterKey, page: 1 });
  }
  const page = pageState.key === filterKey ? pageState.page : 1;

  const apiUrl = useMemo(
    () =>
      buildSupportTicketsUrl(urlParams, { offset: page, limit: LIMIT }, role),
    [urlParams, page, role],
  );

  const { data, error, isLoading, isFetching, refetch } =
    useFetch<SupportTicketsResponse>(apiUrl);

  useEffect(() => {
    if (!data?.data) return;

    setTicket(data.data.tickets);
    setCounts(data.data.counts);
  }, [data?.data.tickets, setTicket]);

  const pagination = data?.data.pagination ?? EMPTY_PAGINATION;

  //  const counts = data?.data.counts;
  const isRefreshing = !isLoading && (isFetching || isPending);
  const isBusy = isLoading || isRefreshing;

  const goToPage = useCallback(
    (p: number) => {
      setPageState({ key: filterKey, page: p });
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    },
    [filterKey],
  );

  useEffect(() => {
    if (isFetching || !data) return;
    const lastPage = Math.max(1, pagination.totalPages);
    if (page > lastPage) setPageState({ key: filterKey, page: lastPage });
  }, [data, isFetching, page, pagination.totalPages, filterKey]);

  const openDialog = useCallback(() => {
    setDialogMounted(true);
    setDialogOpen(true);
  }, []);

  const handleStatusChange = useCallback(
    (status: SupportFiltersState["status"]) => setUrlParams({ status }),
    [setUrlParams],
  );

  const handleReset = useCallback(() => resetUrl(), [resetUrl]);

  const handleCreate = useCallback(
    async (values: SupportTicketFormValues) => {
      const result = await createSupportTicket(role, values);
      if (!result.success || !result.data) throw new Error(result.message);

      const ticket = result.data;
      setTicket(ticket);
      updateCounts(ticket.status, "add");
    },
    [role, page, filterKey, refetch],
  );

  const showLoader = useDelayedBusy(isRefreshing);
  const listKey = `${pagination.page}:${tickets[0]?.id ?? "empty"}`;

  const body = error ? (
    <SupportTicketsError error={error} onRetry={refetch} />
  ) : isLoading ? (
    <>
      <SupportTicketsSkeleton />
      <TicketsPaginationSkeleton />
    </>
  ) : tickets.length === 0 ? (
    <SupportTicketsEmpty
      filtered={hasActiveParams}
      onReset={handleReset}
      openDialog={openDialog}
    />
  ) : (
    <ul
      aria-busy={isRefreshing}
      className={cn(
        "divide-y transition-opacity duration-150",
        isRefreshing && "pointer-events-none opacity-60",
      )}
      key={listKey}
    >
      {tickets.map((ticket) => (
        <SupportTicketRow
          key={ticket.id}
          ticket={ticket}
          onSelect={setSelectedTicketId}
          selected={selectedTicketId === ticket.id}
          role={role}
        />
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
            onClick={openDialog}
            className="group cursor-pointer gap-2 bg-green-700 text-white transition-all duration-200 hover:bg-green-800 hover:shadow-md hover:shadow-green-700/20 dark:bg-green-600 dark:hover:bg-green-500"
          >
            <Plus className="size-4 transition-transform duration-200 group-hover:rotate-90" />
            New ticket
          </Button>
        }
      />

      <div
        ref={cardRef}
        className="scroll-mt-4 overflow-hidden rounded-md border text-card-foreground relative"
      >
        <TopLoader active={showLoader} />
        <p role="status" className="sr-only">
          {isRefreshing ? "Loading tickets" : ""}
        </p>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b bg-muted/40 px-4 py-3">
          <StatusTabs
            value={urlParams.status}
            onChange={handleStatusChange}
            counts={counts}
            isLoading={isLoading}
          />
        </div>

        {body}

        {pagination.total > 0 && (
          <div className="border-t bg-muted/20 px-4 py-3">
            <TicketsPagination
              pagination={pagination}
              onPageChange={goToPage}
              disabled={isBusy}
            />
          </div>
        )}
      </div>

      {dialogMounted && (
        <CreateTicketDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}

function useDelayedBusy(busy: boolean, delay = 150, minShow = 400) {
  const [show, setShow] = useState(false);
  const shownAt = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;

    if (busy && !show) {
      timer = setTimeout(() => {
        shownAt.current = Date.now();
        setShow(true);
      }, delay);
    } else if (!busy && show) {
      const remaining = Math.max(0, minShow - (Date.now() - shownAt.current));
      timer = setTimeout(() => setShow(false), remaining);
    }

    return () => clearTimeout(timer);
  }, [busy, show, delay, minShow]);

  return show;
}

function TopLoader({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-green-700/10 transition-opacity duration-200",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="loader-bar h-full w-1/4 rounded-full bg-green-600 animate-[loader-slide_1.1s_ease-in-out_infinite]" />
    </div>
  );
}
