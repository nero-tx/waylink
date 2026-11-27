"use client";

import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useFetch } from "@/hooks/useFetch";
import { useSupportStore } from "@/stores/support.store";
import {
  MessageSquare,
  ChevronRight,
  MessagesSquare,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { SupportTicket } from "@/lib/all-types";
import { SupportTicketsResponse } from "../support/support-filters";
import { useRouter } from "next/navigation";
import {
  RenderCategoryBadge,
  RenderPriorityBadge,
  RenderStatusPill,
} from "./SupportElements";

interface SupportTicketsSheetProps {
  selectedTicketId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

function formatRelativeDate(date: Date) {
  const diff = Math.max(0, Date.now() - new Date(date).getTime());

  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

interface TicketItemProps {
  ticket: SupportTicket;
  selected: boolean;
  onSelect: (ticket: SupportTicket) => void;
}

const TicketItem = memo(function TicketItem({
  ticket,
  selected,
  onSelect,
}: TicketItemProps) {
  const handleClick = useCallback(() => onSelect(ticket), [onSelect, ticket]);

  const relativeDate = useMemo(
    () => formatRelativeDate(ticket.lastMessageAt),
    [ticket.lastMessageAt],
  );

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-current={selected ? "true" : undefined}
      className={cn(
        "group relative flex w-full flex-col gap-3 rounded-xl border p-3 text-left transition-all duration-200",
        "hover:border-border hover:bg-muted/30",
        selected
          ? "border-primary/30 bg-primary/4 dark:bg-primary/6"
          : "border-transparent bg-transparent",
      )}
    >
      {selected && (
        <span className="absolute inset-y-3 left-0 w-0.5 rounded-full bg-primary" />
      )}

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          #{ticket.ticketNumber}
        </span>

        <RenderPriorityBadge priority={ticket.priority} />
      </div>

      <div className="space-y-1.5">
        <h3
          className={cn(
            "line-clamp-2 text-sm font-medium leading-relaxed",
            selected ? "text-foreground" : "text-foreground/85",
          )}
        >
          {ticket.subject}
        </h3>
        <RenderCategoryBadge category={ticket.category} />
      </div>

      <div className="flex items-center justify-between gap-2">
        <RenderStatusPill status={ticket.status} />

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="size-3" />
            {ticket.messageCount ?? 0}
          </span>
          <span>{relativeDate}</span>
        </div>
      </div>

      {ticket.hasStaffReply && (
        <div className="flex items-center gap-1.5 border-t border-border/40 pt-2">
          <span className="size-1.5 rounded-full bg-blue-500" />
          <span className="text-xs text-muted-foreground">Staff replied</span>
        </div>
      )}

      <ChevronRight
        className={cn(
          "absolute right-2 top-1/2 size-4 -translate-y-1/2 transition-all",
          selected
            ? "translate-x-0 text-primary opacity-100"
            : "translate-x-1 text-muted-foreground opacity-0 group-hover:translate-x-0 group-hover:opacity-100",
        )}
      />
    </button>
  );
});

const TicketSkeleton = memo(function TicketSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-transparent p-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-5 w-14 rounded-md" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  );
});

const TicketListSkeleton = memo(function TicketListSkeleton({
  count = 6,
}: {
  count?: number;
}) {
  return (
    <div
      className="flex flex-col gap-1.5 p-2"
      role="status"
      aria-label="Loading tickets"
    >
      {Array.from({ length: count }, (_, i) => (
        <TicketSkeleton key={i} />
      ))}
    </div>
  );
});

const ErrorState = memo(function ErrorState({
  message,
  onRetry,
  retrying,
}: {
  message: string;
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/5">
        <TriangleAlert className="size-5 text-destructive" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">Couldn&apos;t load tickets</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
      <Button size="sm" variant="outline" onClick={onRetry} disabled={retrying}>
        <RefreshCw className={cn("size-3.5", retrying && "animate-spin")} />
        Try again
      </Button>
    </div>
  );
});

const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-xl border bg-muted/40">
        <MessagesSquare className="size-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium">No conversations</p>
        <p className="text-xs leading-relaxed text-muted-foreground">
          There are no support tickets to display right now.
        </p>
      </div>
    </div>
  );
});

interface SheetBodyProps {
  selectedTicketId?: string;
  onSelect: (ticket: SupportTicket) => void;
}

const SupportTicketsSheetBody = memo(function SupportTicketsSheetBody({
  selectedTicketId,
  onSelect,
}: SheetBodyProps) {
  const { data, error, isLoading, isFetching, refetch } =
    useFetch<SupportTicketsResponse>("/api/support");

  const { tickets, setTicket } = useSupportStore();

  useEffect(() => {
    if (data?.data.tickets) setTicket(data.data.tickets);
  }, [data, setTicket]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const hasTickets = tickets.length > 0;
  const showSkeleton = isLoading && !hasTickets;
  const showBlockingError = !!error && !hasTickets && !isLoading;
  const showInlineError = !!error && hasTickets;
  const showEmpty = !isLoading && !error && !hasTickets;

  const errorMessage = useMemo(
    () => (error instanceof Error ? error.message : "Something went wrong."),
    [error],
  );

  const items = useMemo(
    () =>
      tickets.map((ticket) => (
        <TicketItem
          key={ticket.id}
          ticket={ticket}
          selected={ticket.id === selectedTicketId}
          onSelect={onSelect}
        />
      )),
    [tickets, selectedTicketId, onSelect],
  );

  return (
    <>
      <SheetHeader className="shrink-0 space-y-3 border-b border-border/60 px-4 py-4 text-left">
        <div className="flex items-center justify-between gap-2 pr-8">
          <div className="space-y-0.5">
            <SheetTitle className="text-sm font-semibold tracking-tight">
              Conversations
            </SheetTitle>
            <SheetDescription className="text-xs">
              Your support ticket inbox
            </SheetDescription>
          </div>

            <Button
              type="button"
              size="icon-sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isFetching}
              aria-label="Refresh tickets"
            >
              <RefreshCw
                className={cn("size-4", isFetching && "animate-spin")}
              />
            </Button>
        </div>

        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <MessagesSquare className="size-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
          </span>
        </div>
      </SheetHeader>

      {showInlineError && (
        <div className="mx-2 mt-2 flex items-center justify-between gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2">
          <span className="text-xs text-destructive">
            Failed to refresh. Showing cached tickets.
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 px-2 text-xs"
            onClick={handleRetry}
            disabled={isFetching}
          >
            Retry
          </Button>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        {showSkeleton ? (
          <TicketListSkeleton />
        ) : showBlockingError ? (
          <ErrorState
            message={errorMessage}
            onRetry={handleRetry}
            retrying={isFetching}
          />
        ) : showEmpty ? (
          <EmptyState />
        ) : (
          <div className="flex flex-col gap-1.5 p-2">{items}</div>
        )}
      </ScrollArea>
    </>
  );
});

export const SupportTicketsSheet = memo(function SupportTicketsSheet({
  selectedTicketId,
  open: controlledOpen,
  onOpenChange,
}: SupportTicketsSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const router = useRouter();

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  const handleSelect = useCallback(
    (ticket: SupportTicket) => {
      router.push(`/account/support/${ticket.id}`);
      handleOpenChange(false);
    },
    [handleOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
      >
        <SupportTicketsSheetBody
          selectedTicketId={selectedTicketId}
          onSelect={handleSelect}
        />
      </SheetContent>
    </Sheet>
  );
});
