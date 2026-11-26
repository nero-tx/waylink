"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import {
  Pagination,
  SupportCategory,
  SupportPriority,
  SupportStatus,
} from "@/lib/all-types";
import { cn } from "@/lib/utils";
import {
  CircleDot,
  Clock,
  CheckCircle2,
  UserRound,
  CircleCheck,
  Search,
  LucideIcon,
  AlertCircle,
  RefreshCw,
  Plus,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebounce } from "@/hooks/useDebounce";
import {
  StatusFilter,
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SupportFiltersState,
} from "@/app/account/support/support-filters";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface SearchInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  "value" | "onChange"
> {
  value: string;
  onValueChange: (value: string) => void;
  delay?: number;
}
interface FilterSelectProps<T extends string> {
  label: string;
  value: T | "all";
  options: readonly T[];
  onValueChange: (value: T | "all") => void;
  className?: string;
}
interface SupportFiltersProps {
  filters: SupportFiltersState;
  onChange: (patch: Partial<SupportFiltersState>) => void;
  categories?: readonly SupportCategory[];
  actions?: ReactNode;
}

const CATEGORY_CONFIG: Record<
  SupportCategory,
  { label: string; style: string }
> = {
  billing: {
    label: "Billing",
    style: "bg-primary/10 text-primary border-primary/20",
  },
  account: {
    label: "Account",
    style: "bg-secondary text-secondary-foreground border-border",
  },
  provider_status: {
    label: "Provider Status",
    style: "bg-accent text-accent-foreground border-border",
  },
  booking: {
    label: "Booking",
    style: "bg-primary/10 text-primary border-primary/20",
  },
  listing: {
    label: "Listing",
    style: "bg-secondary text-secondary-foreground border-border",
  },
  technical: {
    label: "Technical",
    style: "bg-destructive/10 text-destructive border-destructive/20",
  },
  other: {
    label: "Other",
    style: "bg-muted text-muted-foreground border-border",
  },
};

const STATUS_CONFIG: Record<
  SupportStatus,
  {
    label: string;
    icon: typeof CircleDot;
    className: string;
  }
> = {
  open: {
    label: "Open",
    icon: CircleDot,
    className:
      "bg-green-100 text-green-800 border-green-200 hover:bg-green-100 " +
      "dark:bg-green-950/50 dark:text-green-400 dark:border-green-900 dark:hover:bg-green-950/50",
  },
  in_progress: {
    label: "In Progress",
    icon: Clock,
    className:
      "bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100 " +
      "dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900 dark:hover:bg-blue-950/50",
  },
  waiting_on_customer: {
    label: "Waiting on Customer",
    icon: UserRound,
    className:
      "bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 " +
      "dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900 dark:hover:bg-amber-950/50",
  },
  resolved: {
    label: "Resolved",
    icon: CheckCircle2,
    className:
      "bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100 " +
      "dark:bg-purple-950/50 dark:text-purple-400 dark:border-purple-900 dark:hover:bg-purple-950/50",
  },
  closed: {
    label: "Closed",
    icon: CircleCheck,
    className:
      "bg-muted text-muted-foreground border-border hover:bg-muted " +
      "dark:bg-muted/50 dark:text-muted-foreground dark:border-border dark:hover:bg-muted/50",
  },
};

const PRIORITY_CONFIG: Record<
  SupportPriority,
  {
    label: string;
    dot: string;
    text: string;
  }
> = {
  urgent: {
    label: "Urgent",
    dot: "bg-red-600 dark:bg-red-500",
    text: "text-red-700 dark:text-red-400",
  },
  high: {
    label: "High",
    dot: "bg-orange-600 dark:bg-orange-500",
    text: "text-orange-700 dark:text-orange-400",
  },
  normal: {
    label: "Normal",
    dot: "bg-blue-600 dark:bg-blue-500",
    text: "text-muted-foreground dark:text-muted-foreground",
  },
  low: {
    label: "Low",
    dot: "bg-muted-foreground dark:bg-muted-foreground",
    text: "text-muted-foreground dark:text-muted-foreground",
  },
};

const humanize = (value: string) => value.replace(/_/g, " ");

export const RenderCategoryBadge = ({
  category,
}: {
  category: SupportCategory;
}) => {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.other;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        cfg.style,
      )}
    >
      {cfg.label}
    </span>
  );
};

export const RenderStatusPill = ({
  status,
  className,
}: {
  status: SupportStatus;
  className?: string;
}) => {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-2 rounded-full font-medium",
        cfg.className,
        className,
      )}
    >
      <Icon className="size-4" />
      {cfg.label}
    </Badge>
  );
};

export const RenderPriorityBadge = ({
  priority,
}: {
  priority: SupportPriority;
}) => {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.normal;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium",
        cfg.text,
      )}
    >
      <span className={cn("size-2 shrink-0 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
};

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onValueChange,
  className,
}: FilterSelectProps<T>) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as T | "all")}>
      <SelectTrigger
        aria-label={`Filter by ${label.toLowerCase()}`}
        className={cn("min-w-36", className)}
      >
        <SelectValue>
          {label}: {value === "all" ? "All" : humanize(value)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {humanize(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SearchInput({
  value,
  onValueChange,
  delay = 400,
  className,
  ...props
}: SearchInputProps) {
  const [text, setText] = useState(value);
  const debounced = useDebounce(text, delay);

  // Last value we know the parent has (emitted by us, or pushed down to us).
  const synced = useRef(value);
  const callback = useRef(onValueChange);
  useEffect(() => {
    callback.current = onValueChange;
  });

  // typing -> (debounced) -> parent
  useEffect(() => {
    if (debounced === synced.current) return;
    synced.current = debounced;
    callback.current(debounced);
  }, [debounced]);

  // parent changed it (e.g. "Reset filters" or back button) -> local text
  useEffect(() => {
    if (value === synced.current) return;
    synced.current = value;
    setText(value);
  }, [value]);

  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        {...props}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="pl-9"
      />
    </div>
  );
}

export function SupportFilters({
  filters,
  onChange,
  categories = SUPPORT_CATEGORIES,
  actions,
}: SupportFiltersProps) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        <SearchInput
          className="min-w-56 max-w-md flex-1"
          value={filters.q}
          onValueChange={(q) => onChange({ q })}
          placeholder="Search tickets by #number, subject, or category..."
          aria-label="Search tickets"
        />
        <FilterSelect
          label="Category"
          value={filters.category}
          options={categories}
          onValueChange={(category) => onChange({ category })}
        />
        <FilterSelect
          label="Priority"
          value={filters.priority}
          options={SUPPORT_PRIORITIES}
          onValueChange={(priority) => onChange({ priority })}
        />
      </div>
      {actions}
    </div>
  );
}

const TITLE_WIDTHS = ["w-56", "w-40", "w-64", "w-48", "w-60", "w-44"];

export function SupportTicketsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="divide-y" aria-busy="true" aria-label="Loading tickets">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex items-start gap-3 px-4 py-3.5">
          <Skeleton className="mt-0.5 size-4 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton
                className={`h-4 max-w-full ${TITLE_WIDTHS[i % TITLE_WIDTHS.length]}`}
              />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-3 w-64 max-w-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SupportTicketsError({
  error,
  onRetry,
}: {
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertCircle className="size-4" />
        <AlertTitle>Couldn&rsquo;t load tickets</AlertTitle>
        <AlertDescription>
          <p>{error.message}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="mt-3 gap-2"
          >
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function SupportTicketsEmpty({
  filtered,
  onReset,
  openDialog,
}: {
  filtered: boolean;
  onReset: () => void;
  openDialog: () => void;
}) {
  return (
    <div className="px-4 py-14 text-center">
      <CircleDot className="mx-auto mb-3 size-8 text-muted-foreground" />
      {filtered ? (
        <>
          <h3 className="mb-1 text-base font-semibold text-emerald-500">
            No matching support tickets
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Try adjusting your status, category or priority filters.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={onReset}
            className="border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/5 hover:text-emerald-400"
          >
            Reset filters
          </Button>
        </>
      ) : (
        <>
          <h3 className="mb-1 text-base font-semibold text-emerald-500">
            No open support tickets
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Open a ticket and our team will get back to you.
          </p>
          <Button
            size="sm"
            variant="ghost"
            onClick={openDialog}
            className="text-emerald-500 hover:bg-emerald-500/5 hover:text-emerald-400"
          >
            <Plus className="size-4" />
            New ticket
          </Button>
        </>
      )}
    </div>
  );
}

const STATUS_TABS: { value: StatusFilter; label: string; icon?: LucideIcon }[] =
  [
    { value: "open", label: "Open", icon: CircleDot },
    { value: "pending", label: "Pending", icon: Clock },
    { value: "closed", label: "Closed", icon: CheckCircle2 },
    { value: "all", label: "All" },
  ];

export function StatusTabs({
  value,
  onChange,
  counts,
  isLoading,
}: {
  value: StatusFilter;
  onChange: (value: StatusFilter) => void;
  counts?: Record<StatusFilter, number>;
  isLoading?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {STATUS_TABS.map(({ value: tab, label, icon: Icon }) => {
        const isActive = value === tab;

        return (
          <button
            key={tab}
            type="button"
            aria-pressed={isActive}
            onClick={() => onChange(tab)}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 border-b-2 px-0.5 py-1.5 text-sm transition-colors duration-200",
              isActive
                ? "border-foreground font-semibold text-foreground"
                : "border-transparent text-muted-foreground hover:text-green-700 dark:hover:text-green-400",
            )}
          >
            {Icon && <Icon className="size-4" />}
            {counts ? (
              <span>{counts[tab]}</span>
            ) : isLoading ? (
              <Skeleton className="h-4 w-4" />
            ) : null}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function getPageItems(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const items: (number | "…")[] = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);
  if (start > 2) items.push("…");
  for (let p = start; p <= end; p++) items.push(p);
  if (end < totalPages - 1) items.push("…");
  items.push(totalPages);
  return items;
}

export function TicketsPagination({
  pagination,
  onPageChange,
  disabled,
}: {
  pagination: Pagination;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { page, totalPages, total, limit, offset, hasNextPage, hasPrevPage } =
    pagination;

  if (total === 0) return null;

  const from = offset + 1;
  const to = Math.min(offset + limit, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted-foreground">
        Showing {from}–{to} of {total}
      </p>

      {totalPages > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <Button
            variant="outline"
            size="icon"
            disabled={disabled || !hasPrevPage}
            onClick={() => onPageChange(page - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {getPageItems(page, totalPages).map((item, i) =>
            item === "…" ? (
              <span key={`gap-${i}`} className="px-2 text-muted-foreground">
                …
              </span>
            ) : (
              <Button
                key={item}
                variant={item === page ? "default" : "outline"}
                size="icon"
                disabled={disabled}
                aria-current={item === page ? "page" : undefined}
                onClick={() => onPageChange(item)}
              >
                {item}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="icon"
            disabled={disabled || !hasNextPage}
            onClick={() => onPageChange(page + 1)}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </nav>
      )}
    </div>
  );
}

export function TicketsPaginationSkeleton() {
  return (
    <div
      className="flex flex-col items-center justify-between gap-3 sm:flex-row px-4 py-3.5"
      aria-hidden="true"
    >
      <Skeleton className="h-5 w-32" />

      <div className="flex items-center gap-1">
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
        <Skeleton className="size-9 rounded-md" />
      </div>
    </div>
  );
}
