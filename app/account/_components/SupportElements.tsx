"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import {
  SupportCategory,
  SupportPriority,
  SupportStatus,
  SupportTicket,
} from "@/lib/all-types";
import { cn, formatTicketDate } from "@/lib/utils";
import {
  CircleDot,
  Clock,
  CheckCircle2,
  UserRound,
  CircleCheck,
  Search,
  MessageSquare,
  UserCheck,
  LucideIcon,
  Hourglass,
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
import Link from "next/link";
import { useDebounce } from "@/hooks/useDebounce";
import {
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SupportFiltersState,
} from "@/lib/support-filters";

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

const STATUS_ICON: Record<
  SupportStatus,
  { icon: LucideIcon; className: string }
> = {
  open: {
    icon: CircleDot,
    className: "text-emerald-600 dark:text-emerald-400",
  },
  in_progress: { icon: Clock, className: "text-amber-600 dark:text-amber-400" },
  waiting_on_customer: {
    icon: Hourglass,
    className: "text-sky-600 dark:text-sky-400",
  },
  resolved: {
    icon: CheckCircle2,
    className: "text-violet-600 dark:text-violet-400",
  },
  closed: { icon: CheckCircle2, className: "text-muted-foreground" },
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

const Dot = () => <span aria-hidden>•</span>;

export function SupportTicketRow({ ticket }: { ticket: SupportTicket }) {
  const { icon: StatusIcon, className: iconClass } = STATUS_ICON[ticket.status];

  return (
    <li>
      <div className="group block px-4 py-3.5 transition-colors hover:bg-muted/50">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <StatusIcon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/support/${ticket.id}?$tknumber=${ticket.ticketNumber}`}
                  className="text-sm font-semibold leading-snug transition-colors duration-200 group-hover:text-green-700 dark:group-hover:text-green-400 group-hover:underline decoration-green-600/50 dark:decoration-green-400/50 underline-offset-4 sm:text-base"
                >
                  {ticket.subject}
                </Link>

                <RenderCategoryBadge category={ticket.category} />
                <RenderStatusPill status={ticket.status} />
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="font-mono">#{ticket.ticketNumber}</span>
                <Dot />
                <span>opened {formatTicketDate(ticket.createdAt)}</span>
                <Dot />
                <span>updated {formatTicketDate(ticket.lastMessageAt)}</span>
                <Dot />
                <RenderPriorityBadge priority={ticket.priority} />
                {ticket.hasStaffReply && (
                  <>
                    <Dot />
                    <span className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                      <UserCheck className="size-3" />
                      Staff replied
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {ticket.messageCount !== undefined && (
            <div className="hidden shrink-0 items-center gap-1.5 pt-0.5 text-xs text-muted-foreground sm:flex">
              <MessageSquare className="size-3.5" />
              <span>{ticket.messageCount}</span>
            </div>
          )}
        </div>
      </div>
    </li>
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
