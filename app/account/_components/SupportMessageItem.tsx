"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Copy,
  Loader2,
  Lock,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { cn, formatTicketDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SupportMessage } from "@/lib/all-types";
import { initials } from "@/lib/helpers";
import { toast } from "sonner";

type Props = {
  message: SupportMessage;
  isOwn: boolean;
  readOnly?: boolean;
  onEdit: (messageId: string, body: string) => Promise<boolean>;
  onDelete: (messageId: string) => Promise<boolean>;
};

export function SupportMessageItem({
  message,
  isOwn,
  readOnly = false,
  onEdit,
  onDelete,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const canAct = isOwn && !readOnly;
  const wasEdited =
    message.updatedAt.getTime() - message.createdAt.getTime() > 1000;

  useEffect(() => {
    if (isEditing) {
      const el = editRef.current;
      el?.focus();
      el?.setSelectionRange(el.value.length, el.value.length);
    }
  }, [isEditing]);

  const startEdit = () => {
    setDraft(message.body);
    setIsEditing(true);
  };

  const saveEdit = () => {
    const next = draft.trim();

    if (!next || next === message.body || isPending) {
      setIsEditing(false);
      return;
    }

    startTransition(async () => {
      const updated = await onEdit(message.id, next);

      if (updated) {
        setIsEditing(false);
      }
    });
  };

  const cancelEdit = () => {
    setDraft(message.body);
    setIsEditing(false);
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.body);
      toast.success("Message text copied to your clipboard.");
    } catch {
      toast.info("Couldn't copy message", {
        description: "Your browser doesn't allow clipboard access.",
      });
    }
  };

  const deleteMessageHandler = () => {
    if (isPending) return;

    startTransition(async () => {
      const deleted = await onDelete(message.id);

      if (deleted) {
        setConfirmDelete(false);
      }
    });
  };

  return (
    <article
      className={cn(
        "group flex items-end gap-2.5 py-2",
        isOwn && "flex-row-reverse",
      )}
      aria-label={`Message from ${message.author.name}`}
    >
      <Avatar className="size-8 shrink-0">
        {message.author.image && (
          <AvatarImage src={message.author.image} alt="" />
        )}
        <AvatarFallback className="text-xs">
          {initials(message.author.name)}
        </AvatarFallback>
      </Avatar>

      <div
        className={cn(
          "flex max-w-[min(34rem,80%)] flex-col gap-1",
          isOwn && "items-end",
        )}
      >
        <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
          <span
            className={cn(
              "font-medium text-sky-500",
              isOwn ? "text-sky-500" : "text-emerald-500",
            )}
          >
            {isOwn ? "You" : message.author.name}
          </span>
          <span className="text-amber-500">
            {message.isStaff && !isOwn && <span>Support</span>}
          </span>
          {message.isInternal && (
            <span className="inline-flex items-center gap-1 text-chat-note-fg">
              <Lock className="size-3" /> Internal note
            </span>
          )}
          <time dateTime={message.createdAt.toISOString()}>
            {formatTicketDate(message.createdAt)}
          </time>
          {wasEdited && <span>(edited)</span>}
        </div>

        <div
          className={cn("flex items-end gap-1", isOwn && "flex-row-reverse")}
        >
          {isEditing ? (
            <div className="flex w-full min-w-64 flex-col gap-2 rounded-2xl border bg-background p-2 sm:min-w-96">
              <Textarea
                ref={editRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") cancelEdit();
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) saveEdit();
                }}
                rows={3}
                className="resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveEdit}
                  disabled={
                    !draft.trim() || draft.trim() === message.body || isPending
                  }
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div
              className={cn(
                "whitespace-pre-wrap wrap-break-word px-4 py-2.5 text-sm leading-relaxed",
                "rounded-2xl shadow-xs",
                message.isInternal
                  ? "border border-dashed border-chat-note-border bg-chat-note text-chat-note-fg shadow-none"
                  : isOwn
                    ? "rounded-ee-sm bg-blue-700 text-white dark:bg-blue-800"
                    : "rounded-es-sm bg-chat-theirs text-chat-theirs-fg",
              )}
            >
              {message.body}
            </div>
          )}

          {canAct && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Message actions"
                  className="size-7 shrink-0 opacity-100 transition-opacity data-[state=open]:opacity-100 md:opacity-0 md:focus-visible:opacity-100 md:group-hover:opacity-100"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isOwn ? "end" : "start"}>
                <DropdownMenuItem onSelect={startEdit}>
                  <Pencil className="size-4" /> Edit message
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={copyMessage}>
                  <Copy className="size-4" />
                  Copy
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() => setConfirmDelete(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="size-4 text-destructive" /> Delete message
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this message?</AlertDialogTitle>
            <AlertDialogDescription>
              It will be removed from the conversation for everyone. This can’t
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteMessageHandler}
              disabled={isPending}
              variant="destructive"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Message"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
