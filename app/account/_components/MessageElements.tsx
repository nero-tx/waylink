"use client";

import { useLayoutEffect, useRef, useState } from "react";
import {
  CircleCheck,
  RotateCcw,
  CalendarDays,
  Clock3,
  Hash,
  MessageSquare,
  Building2,
  Lock,
  ArrowUp,
  PanelRight,
  Copy,
  Check,
  UserCheck,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useSupportStore } from "@/stores/support.store";
import type { SupportTicketConversation } from "@/lib/all-types";
import { Button } from "@/components/ui/button";
import {
  RenderCategoryBadge,
  RenderPriorityBadge,
  RenderStatusPill,
} from "./SupportElements";
import { cn, formatTicketDate } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/helpers";
import { Skeleton } from "@/components/ui/skeleton";

type Ticket = SupportTicketConversation["ticket"];
const MAX_LENGTH = 4000;
const COUNTER_FROM = 3200;

type TicketTopBarProps = {
  ticket: Ticket;
  showDetails?: boolean;
  onToggleDetails?: () => void;
};

export function TicketTopBar({
  ticket,
  showDetails,
  onToggleDetails,
}: TicketTopBarProps) {
  const closeTicket = useSupportStore((s) => s.closeTicket);
  const reopenTicket = useSupportStore((s) => s.reopenTicket);
  const isClosed = ticket.status === "closed";

  return (
    <header className="shrink-0 border-b border-border/70 bg-card/40 backdrop-blur-md px-3 sm:px-5 py-2.5 sm:py-3 transition-colors">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted/80 text-foreground/80 border border-border/60 shrink-0">
                #{ticket.ticketNumber}
              </span>
              <RenderStatusPill
                status={ticket.status}
                className="hidden sm:inline-flex text-xs py-0 h-5"
              />
              <RenderPriorityBadge priority={ticket.priority} />
            </div>
            <h1
              className="truncate text-sm sm:text-base font-semibold text-foreground tracking-tight mt-0.5"
              title={ticket.subject}
            >
              {ticket.subject}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isClosed ? (
            <Button
              variant="outline"
              className="gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 text-xs h-8 cursor-pointer"
              onClick={() => reopenTicket(ticket.id)}
            >
              <RotateCcw className="size-3.5" />
              <span className="hidden sm:inline">Reopen ticket</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs h-8 cursor-pointer"
              onClick={() => closeTicket(ticket.id)}
            >
              <CircleCheck className="size-3.5" />
              <span className="hidden sm:inline">Close ticket</span>
            </Button>
          )}

          {onToggleDetails && (
            <Button
              variant={showDetails ? "secondary" : "outline"}
              onClick={onToggleDetails}
              className={cn(
                "gap-1.5 text-xs h-8 cursor-pointer transition-all lg:hidden",
                showDetails && "bg-accent text-accent-foreground shadow-2xs",
              )}
              title="Toggle ticket details panel"
            >
              <PanelRight className="size-3.5" />
              <span className="hidden md:inline">Details</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export function TicketDetailsPanel({ ticket }: { ticket: Ticket }) {
  const [copied, setCopied] = useState(false);

  const copyTicketNumber = () => {
    navigator.clipboard.writeText(`#${ticket.ticketNumber}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const alert =
    ticket.status === "resolved" ||
    ticket.status === "closed" ||
    ticket.status === "waiting_on_customer";

  return (
    <div className="h-full flex flex-col min-h-0 overflow-y-auto p-4 sm:p-5 space-y-3 bg-card/20">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Hash className="size-4 text-primary" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            Ticket Details
          </h2>
        </div>
      </div>

      {alert && (
        <div
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3",
            ticket.status === "resolved"
              ? "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:border-amber-500/15 dark:bg-amber-500/10 dark:text-amber-400"
              : ticket.status === "waiting_on_customer"
                ? "border-sky-500/20 bg-sky-500/5 text-sky-700 dark:border-sky-500/15 dark:bg-sky-500/10 dark:text-sky-400"
                : "border-border bg-muted/50 text-muted-foreground",
          )}
        >
          {ticket.status === "resolved" ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
          ) : ticket.status === "waiting_on_customer" ? (
            <Clock className="mt-0.5 size-4 shrink-0" />
          ) : (
            <Lock className="mt-0.5 size-4 shrink-0" />
          )}

          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              {ticket.status === "resolved"
                ? "Ticket resolved"
                : ticket.status === "waiting_on_customer"
                  ? "Waiting for your response"
                  : "Ticket closed"}
            </p>

            <p
              className={cn(
                "text-xs leading-relaxed",
                ticket.status === "resolved"
                  ? "text-amber-700/80 dark:text-amber-400/80"
                  : ticket.status === "waiting_on_customer"
                    ? "text-sky-700/80 dark:text-sky-400/80"
                    : "text-muted-foreground",
              )}
            >
              {ticket.status === "resolved"
                ? "This ticket will automatically close in 72 hours if no further action is taken."
                : ticket.status === "waiting_on_customer"
                  ? "We need additional information from you to continue working on this ticket. Reply to this message when you're ready."
                  : "No further actions can be added to this ticket. If you need further assistance or want to take another action, reopen the ticket."}
            </p>
          </div>
        </div>
      )}

      {/* Ticket Identity & Status Card */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">
            Ticket ID
          </span>
          <button
            type="button"
            onClick={copyTicketNumber}
            className="inline-flex items-center gap-1.5 font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-muted/80 text-foreground border border-border/60 hover:bg-muted transition-colors cursor-pointer"
            title="Click to copy ticket number"
          >
            #{ticket.ticketNumber}
            {copied ? (
              <Check className="size-3 text-emerald-500" />
            ) : (
              <Copy className="size-3 text-muted-foreground" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <span className="text-xs font-medium text-muted-foreground">
            Status
          </span>
          <RenderStatusPill
            status={ticket.status}
            className="text-xs py-0 h-5"
          />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <span className="text-xs font-medium text-muted-foreground">
            Priority
          </span>
          <RenderPriorityBadge priority={ticket.priority} />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/40">
          <span className="text-xs font-medium text-muted-foreground">
            Category
          </span>
          <RenderCategoryBadge category={ticket.category} />
        </div>
      </div>

      {/* Assignment & Provider Card */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 space-y-3 shadow-2xs">
        <span className="text-xs font-medium text-muted-foreground block">
          Support Contact
        </span>

        <div className="flex items-center gap-2.5">
          <Avatar className="size-8 shrink-0">
            {ticket.assignee?.image && (
              <AvatarImage
                src={ticket.assignee.image}
                alt={ticket.assignee.name}
              />
            )}
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {ticket.assignee ? initials(ticket.assignee.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">
              {ticket.assignee?.name ?? "Support Agent"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {ticket.assignee ? "Assigned Specialist" : "Awaiting assignment"}
            </p>
          </div>
        </div>

        {ticket.provider && (
          <div className="flex items-center gap-2.5 pt-2 border-t border-border/40">
            <div className="size-8 rounded-full bg-secondary/80 flex items-center justify-center shrink-0 text-muted-foreground">
              <Building2 className="size-4 text-indigo-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-foreground truncate">
                {ticket.provider.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Service Provider
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Activity Timeline Card */}
      <div className="rounded-xl border border-border/70 bg-card/60 p-3.5 space-y-2.5 shadow-2xs">
        <span className="text-xs font-medium text-muted-foreground block">
          Activity
        </span>

        <div className="flex items-center justify-between text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <CalendarDays className="size-3.5" /> Opened
          </span>
          <span className="font-medium text-foreground">
            {formatTicketDate(ticket.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/40">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <Clock3 className="size-3.5 text-amber-500" /> Last message
          </span>
          <span className="font-medium text-foreground">
            {formatTicketDate(ticket.lastMessageAt)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/40">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <MessageSquare className="size-3.5 text-blue-500" /> Messages
          </span>
          <span className="font-medium text-foreground">
            {ticket.messageCount ?? 0}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/40">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <UserCheck className="size-3.5 text-emerald-500" /> Staff replied
          </span>
          <span
            className={cn(
              "font-medium",
              ticket.hasStaffReply
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
            )}
          >
            {ticket.hasStaffReply ? "Yes" : "Not yet"}
          </span>
        </div>

        {ticket.closedAt && (
          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-border/40">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <CircleCheck className="size-3.5 text-rose-500" /> Closed
            </span>
            <span className="font-medium text-foreground">
              {formatTicketDate(ticket.closedAt)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

type ComposerProps = {
  disabled?: boolean;
  canWriteInternal?: boolean;
  onReopen?: () => void;
  onSend: (body: string, isInternal: boolean) => void;
};

export function MessageComposer({
  disabled,
  canWriteInternal,
  onReopen,
  onSend,
}: ComposerProps) {
  const [body, setBody] = useState("");
  const [internal, setInternal] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [body]);

  if (disabled) {
    return (
      <div className="shrink-0 border-t border-border/70 bg-card/60 backdrop-blur-md p-3 sm:p-4">
        <div className="mx-auto max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/40 p-3.5 px-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-muted text-muted-foreground shrink-0">
              <Lock className="size-4" />
            </div>
            <div>
              <p className="font-medium text-foreground text-xs sm:text-sm">
                This ticket is closed
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground">
                Reopen this ticket to continue the conversation with support.
              </p>
            </div>
          </div>
          {onReopen && (
            <Button
              size="sm"
              variant="outline"
              onClick={onReopen}
              className="shrink-0 gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400 text-xs h-8 cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              Reopen ticket
            </Button>
          )}
        </div>
      </div>
    );
  }

  const canSend = body.trim().length > 0 && body.length <= MAX_LENGTH;

  const send = () => {
    if (!canSend) return;
    onSend(body.trim(), canWriteInternal ? internal : false);
    setBody("");
    ref.current?.focus();
  };

  return (
    <div className="shrink-0 bg-background/95 backdrop-blur-md px-3 pb-3 sm:px-4">
      <div className="w-full">
        <div
          className={cn(
            "w-full mx-auto rounded-2xl border transition-all duration-150 overflow-hidden",
            "focus-within:ring-2 focus-within:ring-primary/10",
            internal
              ? "border-amber-500/40 bg-amber-500/5 focus-within:border-amber-500/60"
              : "border-border/80 bg-card/70 focus-within:border-primary/50",
          )}
        >
          <Textarea
            ref={ref}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            aria-label={internal ? "Internal note" : "Message"}
            placeholder={
              internal
                ? "Add an internal staff note (hidden from customer)..."
                : "Write your message..."
            }
            className="min-h-11 max-h-44 resize-none border-0 bg-transparent px-4 py-3 text-sm shadow-none placeholder:text-muted-foreground/60 focus-visible:ring-0 rounded-none leading-relaxed"
          />

          <div className="flex items-center justify-between gap-3 border-t border-border/50 px-3 py-2.5">
            <div className="flex min-w-0 flex-row flex-wrap gap-2">
              {canWriteInternal && (
                <div
                  role="group"
                  aria-label="Message type"
                  className="inline-flex w-fit items-center gap-1 rounded-lg border border-border/60 bg-muted/40 p-1"
                >
                  <ModeButton
                    active={!internal}
                    onClick={() => setInternal(false)}
                  >
                    <MessageSquare className="size-3.5" />
                    Public
                  </ModeButton>

                  <ModeButton
                    active={internal}
                    onClick={() => setInternal(true)}
                  >
                    <Lock className="size-3.5" />
                    Internal
                  </ModeButton>
                </div>
              )}

              <p className="hidden items-center gap-1.5 text-[11px] text-muted-foreground/80 sm:flex">
                <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-2xs">
                  Enter
                </kbd>
                to send
                <span className="text-muted-foreground/50">·</span>
                <kbd className="rounded-md border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] shadow-2xs">
                  Shift + Enter
                </kbd>
                for new line
              </p>
            </div>

            <div className="ms-auto flex shrink-0 items-center gap-3">
              {body.length >= COUNTER_FROM && (
                <span
                  aria-live="polite"
                  className={cn(
                    "text-xs tabular-nums transition-colors",
                    body.length > MAX_LENGTH
                      ? "font-medium text-destructive"
                      : body.length >= MAX_LENGTH * 0.9
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground",
                  )}
                >
                  {body.length}/{MAX_LENGTH}
                </span>
              )}

              <Button
                type="button"
                size="icon"
                onClick={send}
                disabled={!canSend}
                aria-label={internal ? "Add internal note" : "Send message"}
                className={cn(
                  "size-9 rounded-full shadow-sm transition-all duration-150",
                  "active:scale-95",
                  internal
                    ? [
                        "bg-amber-600 text-white hover:bg-amber-700",
                        "dark:bg-amber-500 dark:text-black dark:hover:bg-amber-400",
                      ]
                    : "bg-primary text-primary-foreground hover:bg-primary/90",
                  !canSend && "cursor-not-allowed opacity-40",
                )}
              >
                <ArrowUp className="size-4" strokeWidth={2.5} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition-colors cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        active
          ? "bg-foreground text-background font-medium"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

const Bubble = ({ mine }: { mine?: boolean }) => (
  <div
    className={`flex items-end gap-3 ${mine ? "justify-end" : "justify-start"}`}
  >
    {!mine && <Skeleton className="size-8 shrink-0 rounded-full" />}

    <div
      className={`flex max-w-[75%] flex-col gap-2 rounded-2xl p-4 ${
        mine ? "rounded-br-md bg-primary/5" : "rounded-bl-md bg-muted/50"
      }`}
    >
      <Skeleton className={`h-3 ${mine ? "w-40" : "w-56"}`} />
      <Skeleton className={`h-3 ${mine ? "w-28" : "w-44"}`} />
      {!mine && <Skeleton className="h-3 w-20" />}
    </div>

    {mine && <Skeleton className="size-8 shrink-0 rounded-full" />}
  </div>
);

export function SupportConversationSkeleton() {
  return (
    <div
      className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden"
      role="status"
      aria-busy="true"
      aria-label="Loading conversation"
    >
      <div className="flex items-center justify-between border-b px-5 py-4">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>

        <Skeleton className="h-7 w-20 rounded-full" />
      </div>

      <div className="flex flex-1 flex-col justify-end gap-6 overflow-hidden p-5">
        <Bubble />
        <Bubble mine />
        <Bubble />
        <Bubble mine />
        <Bubble />
      </div>

      <div className="border-t p-4">
        <div className="flex items-end gap-3 rounded-xl border bg-muted/20 p-3">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="size-10 shrink-0 rounded-lg" />
        </div>
      </div>

      <span className="sr-only">Loading conversation...</span>
    </div>
  );
}
