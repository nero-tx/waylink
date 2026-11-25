"use client";

import { SupportTicketConversation, SupportViewer } from "@/lib/all-types";
import { useSupportStore } from "@/stores/support.store";
import { useRef, useEffect, useState, useMemo } from "react";
import {
  MessageComposer,
  TicketDetailsPanel,
  TicketTopBar,
} from "./MessageElements";
import { SupportMessageItem } from "./SupportMessageItem";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Lock, LogIn, MessageSquare, UserPlus } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { AuthLink } from "@/app/(auth)/_components/AuthLink";
import {
  addMessageAction,
  deleteMessageAction,
  editMessageAction,
} from "@/actions/support.action";
import { toast } from "sonner";

const getViwer = (): SupportViewer | null => {
  const user = useAuthStore((s) => s.user);

  return useMemo(
    () =>
      user
        ? {
            id: user.id,
            image: user.image ?? null,
            isStaff: user.role === "admin",
            name: user.name,
          }
        : null,
    [user],
  );
};

export function SupportConversationView({
  initial,
}: {
  initial: SupportTicketConversation;
}) {
  const viewer = getViwer();
  const ticketId = initial.ticket.id;

  if (!viewer) return <NoViewer />;

  const conversation = useSupportStore((s) => s.conversations[ticketId]);
  const setConversation = useSupportStore((s) => s.setConversation);
  const addMessage = useSupportStore((s) => s.addMessage);
  const editMessage = useSupportStore((s) => s.editMessage);
  const deleteMessage = useSupportStore((s) => s.deleteMessage);
  const reopenTicket = useSupportStore((s) => s.reopenTicket);

  const [showDetails, setShowDetails] = useState(true);
  const [showDetailsMobile, setShowDetailsMobile] = useState(false);

  const endRef = useRef<HTMLDivElement>(null);

  // Hydrate once; later edits live in the store.
  useEffect(() => {
    if (!useSupportStore.getState().conversations[ticketId]) {
      setConversation(initial);
    }
  }, [ticketId, initial, setConversation]);

  const messageCount = conversation?.messages.length ?? 0;
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messageCount]);

  if (!conversation) return null;

  const { ticket, messages } = conversation;
  const isClosed = ticket.status === "closed";
  // Ticket owners never see internal notes.
  const visibleMessages = viewer.isStaff
    ? messages
    : messages.filter((m) => !m.isInternal);

  const createMessage = async (
    content: string,
    internal?: boolean,
  ): Promise<boolean> => {
    try {
      const res = await addMessageAction(ticketId, content, internal);
      if (!res.success || !res.data) {
        toast.error(res.message);
        return false;
      }

      addMessage(
        ticketId,
        {
          body: content,
          isInternal: internal ?? false,
          isStaff: viewer.isStaff,
          author: {
            id: viewer.id,
            name: viewer.name,
            image: viewer.image ?? undefined,
          },
        },
        res.data.id,
      );

      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message.",
      );

      return false;
    }
  };

  const delMessage = async (messageId: string) => {
    try {
      const res = await deleteMessageAction(messageId, ticketId);
      if (!res.success) {
        toast.error(res.message);
        return false;
      }

      deleteMessage(ticketId, messageId);
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message.",
      );

      return false;
    }
  };

  const editMess = async (messageId: string, body: string) => {
    try {
      const res = await editMessageAction(messageId, ticketId, body);
      if (!res.success) {
        toast.error(res.message);
        return false;
      }

      editMessage(ticketId, messageId, body);
      return true;
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send message.",
      );

      return false;
    }
  };

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-background relative">
      <TicketTopBar
        ticket={ticket}
        showDetails={showDetails}
        onToggleDetails={() => {
          setShowDetails((prev) => !prev);
          setShowDetailsMobile((prev) => !prev);
        }}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <section
          className="flex flex-1 w-full min-h-0 flex-col overflow-hidden relative bg-background min-w-0"
          aria-label="Conversation"
        >
          <ScrollArea className="flex-1 min-h-0 px-4 py-3 sm:px-6">
            <div className="flex w-full flex-col gap-0">
              {visibleMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="flex size-12 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground mb-3">
                    <MessageSquare className="size-6" />
                  </div>
                  <h3 className="font-semibold text-foreground text-sm">
                    No messages yet
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground max-w-xs">
                    Start the discussion by typing a message in the composer
                    below.
                  </p>
                </div>
              )}
              {visibleMessages.map((message) => (
                <SupportMessageItem
                  key={message.id}
                  message={message}
                  isOwn={message.authorId === viewer.id}
                  readOnly={isClosed}
                  onEdit={editMess}
                  onDelete={delMessage}
                />
              ))}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <div className="shrink-0 ">
            <MessageComposer
              disabled={isClosed}
              canWriteInternal={viewer.isStaff}
              onReopen={() => reopenTicket(ticketId)}
              onSend={createMessage}
            />
          </div>
        </section>

        {/* Desktop Fixed Details Sidebar */}
        <aside
          className="hidden w-80 shrink-0 border-s border-border/70 bg-card/30 lg:block overflow-hidden h-full flex-col"
          aria-label="Ticket details"
        >
          <TicketDetailsPanel ticket={ticket} />
        </aside>
      </div>

      {/* Mobile/Tablet Sheet Drawer */}
      <Sheet open={showDetailsMobile} onOpenChange={setShowDetailsMobile}>
        <SheetContent
          side="right"
          className="p-0 sm:max-w-md w-full flex flex-col h-full lg:hidden"
        >
          <TicketDetailsPanel ticket={ticket} />
        </SheetContent>
      </Sheet>
    </div>
  );
}

function NoViewer({
  title = "Sign In Required",
  description = "You need to be signed in to view this page.",
}: {
  title?: string;
  description?: string;
}) {
  const openModal = useAuthStore((s) => s.openModal);

  return (
    <div
      role="status"
      className="flex h-full w-full flex-1 items-center justify-center p-6"
    >
      <div className="relative w-full max-w-md">
        <div className="absolute -top-16 -left-16 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl dark:bg-blue-500/10" />
        <div className="absolute -right-16 -bottom-16 h-32 w-32 rounded-full bg-purple-500/20 blur-3xl dark:bg-purple-500/10" />

        <div className="relative flex flex-col items-center gap-5 rounded-3xl border-2 border-gray-200/50 bg-white/95 px-8 py-10 text-center shadow-2xl backdrop-blur-xl dark:border-gray-800/50 dark:bg-gray-950/95">
          <div className="flex h-14 w-14 rotate-3 items-center justify-center rounded-xl bg-linear-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/30">
            <Lock className="h-7 w-7 text-white" />
          </div>

          <div className="space-y-2">
            <h2 className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text font-mono text-xl font-bold tracking-tight text-transparent dark:from-blue-400 dark:to-purple-400">
              {title}
            </h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1 cursor-pointer"
              onClick={openModal}
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Button>
            <Button asChild variant="outline">
              <AuthLink page="/signup" className="flex-1 cursor-pointer">
                <UserPlus className="h-4 w-4" />
                Create account
              </AuthLink>
            </Button>
          </div>

          <p className="font-mono text-xs text-gray-400">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500 align-middle" />
            Status: Unauthenticated
          </p>
        </div>
      </div>
    </div>
  );
}
