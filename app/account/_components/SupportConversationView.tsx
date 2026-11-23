"use client";

import { SupportTicketConversation, SupportViewer } from "@/lib/all-types";
import { useSupportStore } from "@/stores/support.store";
import { useRef, useEffect, useState } from "react";
import {
  MessageComposer,
  TicketDetailsPanel,
  TicketTopBar,
} from "./MessageElements";
import { SupportMessageItem } from "./SupportMessageItem";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { MessageSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type Props = {
  initial: SupportTicketConversation;
  viewer: SupportViewer;
};

export function SupportConversationView({ initial, viewer }: Props) {
  const ticketId = initial.ticket.id;

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

  return (
    <div className="flex h-full w-full flex-col min-h-0 overflow-hidden bg-background">
      <TicketTopBar
        ticket={ticket}
        showDetails={showDetails}
        onToggleDetails={() => {
          setShowDetails((prev) => !prev);
          setShowDetailsMobile((prev) => !prev);
        }}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <section
          className="flex flex-1 min-h-0 flex-col overflow-hidden relative bg-background"
          aria-label="Conversation"
        >
          <ScrollArea className="flex-1 min-h-0 px-4 py-6 sm:px-6">
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
                  onEdit={(id, body) => editMessage(ticketId, id, body)}
                  onDelete={(id) => deleteMessage(ticketId, id)}
                />
              ))}
              <div ref={endRef} />
            </div>
          </ScrollArea>

          <MessageComposer
            disabled={isClosed}
            canWriteInternal={viewer.isStaff}
            onReopen={() => reopenTicket(ticketId)}
            onSend={(body, isInternal) =>
              addMessage(ticketId, {
                body,
                isInternal,
                isStaff: viewer.isStaff,
                author: {
                  id: viewer.id,
                  name: viewer.name,
                  image: viewer.image ?? undefined,
                },
              })
            }
          />
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
