"use client";

import { SupportTicketConversation, SupportViewer } from "@/lib/all-types";
import { useSupportStore } from "@/stores/support.store";
import { useRef, useEffect } from "react";
import { TicketTopBar } from "./MessageElements";

type Props = {
  /** Data from your API/server component. Hydrates the store once. */
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
    <div className="flex h-full flex-col">
      <TicketTopBar ticket={ticket} />

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(0,1fr)_20rem]">

      </div>
    </div>
  );
}
