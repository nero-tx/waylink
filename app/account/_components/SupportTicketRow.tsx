"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
  MessageSquare,
  UserCheck,
  LucideIcon,
  CircleDot,
  Clock,
  Hourglass,
  CheckCircle2,
  AlertTriangle,
  MessagesSquare,
  Ticket,
  CircleArrowOutUpRight,
} from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSupportStore } from "@/stores/support.store";
import { SupportStatus, SupportTicket } from "@/lib/all-types";
import {
  RenderCategoryBadge,
  RenderPriorityBadge,
  RenderStatusPill,
} from "./SupportElements";
import { cn, formatTicketDate } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import dynamic from "next/dynamic";
import { SupportRole } from "./SupportTicketsView";
import { deleteSupportTicket } from "@/actions/support.action";
const CreateTicketDialog = dynamic(
  () => import("./CreateTicketDialog").then((m) => m.CreateTicketDialog),
  { ssr: false },
);

interface SupportTicketRowProps {
  ticket: SupportTicket;
  selected: boolean;
  onSelect: (id: string | null) => void;
  role: SupportRole;
}

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

const Dot = () => <span aria-hidden>•</span>;

export function SupportTicketRow({
  ticket,
  selected,
  onSelect,
  role,
}: SupportTicketRowProps) {
  const [isPending, startTransition] = useTransition();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editdialogOpen, setEditDialogOpen] = useState(false);

  const { icon: StatusIcon, className: iconClass } = STATUS_ICON[ticket.status];

  const setTicket = useSupportStore((s) => s.setTicket);
  const removeTicket = useSupportStore((s) => s.removeTicket);
  const updateCounts = useSupportStore((s) => s.updateCounts);
  const updateTicketCounts = useSupportStore((s) => s.updateCounts);

  const isClosed = ticket.status === "closed";

  const handleClose = () => {
    if (isPending || isClosed) return;

    startTransition(async () => {
      //   try {
      //     const result = await updateSupportTicketStatus(
      //       role,
      //       ticket.id,
      //       "closed",
      //     );
      //     if (!result.success || !result.data) {
      //       throw new Error(result.message);
      //     }
      //     startTransition(() => {
      //       setTicket(result.data);
      //       updateTicketCounts(ticket, result.data);
      //     });
      //     toast.success("Ticket closed successfully.");
      //   } catch (error) {
      //     toast.error(
      //       error instanceof Error ? error.message : "Couldn't close the ticket.",
      //     );
      //   }
    });
  };

  const handleDelete = () => {
    if (isPending) return;

    startTransition(async () => {
      try {
        const result = await deleteSupportTicket(role, ticket.id);
        if (!result.success) {
          throw new Error(result.message);
        }

        removeTicket(ticket.id);
        updateCounts(ticket.status, "remove");
        toast.success("Ticket deleted successfully.");
      } catch (error) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Couldn't delete the ticket.",
        );
      }
    });
  };

  return (
    <li
      className={`group relative list-none transition-opacity ${
        isPending ? "pointer-events-none opacity-50" : ""
      }`}
      aria-busy={isPending}
    >
      <div
        className={cn(
          "flex items-start gap-3 px-4 py-3.5 transition-colors",
          selected ? "bg-green-500/10" : "hover:bg-muted/50",
        )}
      >
        {/* Single selection */}
        <Checkbox
          checked={selected}
          disabled={isPending}
          onCheckedChange={(checked) =>
            onSelect(checked === true ? ticket.id : null)
          }
          aria-label={`Select ticket #${ticket.ticketNumber}`}
          className="mt-0.5 hover:border-emerald-500/70 data-[state=checked]:border-emerald-600 data-[state=checked]:bg-emerald-600 dark:data-[state=checked]:border-emerald-500 dark:data-[state=checked]:bg-emerald-500"
        />

        {/* Ticket details */}
        <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            {isPending ? (
              <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" />
            ) : (
              <StatusIcon className={`mt-0.5 size-4 shrink-0 ${iconClass}`} />
            )}

            <div className="min-w-0">
              {/* Subject and badges */}
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/account/support/${ticket.id}?tknumber=${ticket.ticketNumber}`}
                  aria-disabled={isPending}
                  className={`text-sm font-semibold leading-snug transition-colors duration-200 sm:text-base ${
                    isPending
                      ? "pointer-events-none"
                      : "group-hover:text-green-700 dark:group-hover:text-green-400 group-hover:underline decoration-green-600/50 dark:decoration-green-400/50 underline-offset-4"
                  }`}
                >
                  {ticket.subject}
                </Link>

                <RenderCategoryBadge category={ticket.category} />
                <RenderStatusPill status={ticket.status} />
              </div>

              {/* Metadata */}
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

          {/* Right side */}
          <div className="flex shrink-0 items-center gap-2">
            {ticket.messageCount !== undefined && (
              <div className="flex items-center gap-1.5 pt-0.5 text-xs text-muted-foreground">
                <MessageSquare className="size-3.5" />
                <span>{ticket.messageCount}</span>
              </div>
            )}

            {/* Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={isPending}
                  aria-label={`Actions for ticket #${ticket.ticketNumber}`}
                  className={cn(
                    "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-50",
                    selected ? "opacity-100" : "pointer-events-none opacity-0",
                  )}
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <MoreHorizontal className="size-4" />
                  )}
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-40">
                {/* Edit */}
                <DropdownMenuItem asChild disabled={isPending}>
                  <Link
                    href={`/account/support/${ticket.id}?tknumber=${ticket.ticketNumber}`}
                  >
                    <CircleArrowOutUpRight className="size-4" />
                    View
                  </Link>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onSelect={() => setEditDialogOpen(true)}
                  disabled={isPending}
                >
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>

                {/* Close */}
                {!isClosed && (
                  <DropdownMenuItem disabled={isPending} onSelect={handleClose}>
                    <XCircle className="size-4" />
                    Close ticket
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {/* Delete */}
                <DropdownMenuItem
                  disabled={isPending}
                  onSelect={() => setDeleteDialogOpen(true)}
                  variant="destructive"
                >
                  <Trash2 className="size-4" />
                  Delete ticket
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          if (!isPending) setDeleteDialogOpen(open);
        }}
      >
        <AlertDialogContent className="gap-5 sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex size-12 items-center justify-center rounded-xl border border-destructive/20 bg-destructive/10 text-destructive">
              <AlertTriangle className="size-6" />
            </div>

            <AlertDialogTitle className="text-lg">
              Delete support ticket?
            </AlertDialogTitle>

            <AlertDialogDescription className="text-sm leading-relaxed">
              You're about to permanently delete this support issue and its
              entire conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* Deletion impact */}
          <div className="space-y-3 rounded-lg border bg-muted/30 p-3.5">
            <div className="flex items-start gap-3">
              <Ticket className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

              <div className="min-w-0 space-y-1">
                <p className="text-sm font-medium">Support issue</p>

                <p className="wrap-break-word text-xs leading-relaxed text-muted-foreground">
                  #{ticket.ticketNumber} · {ticket.subject}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MessagesSquare className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

              <div className="space-y-1">
                <p className="text-sm font-medium">Entire message history</p>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  All messages, replies, and conversation history associated
                  with this ticket will be permanently removed.
                </p>
              </div>
            </div>
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>

            <AlertDialogAction
              disabled={isPending}
              onClick={(event) => {
                event.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="size-4" />
                  Delete permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateTicketDialog
        open={editdialogOpen}
        onOpenChange={setEditDialogOpen}
        onSubmit={(p) => console.log(p)}
        ticket={{
          id: ticket.id,
          category: ticket.category,
          priority: ticket.priority,
          subject: ticket.subject,
          body: "",
        }}
      />
    </li>
  );
}
