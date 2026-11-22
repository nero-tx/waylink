import { create } from "zustand";
import type {
  SupportMessage,
  SupportTicket,
  SupportTicketConversation,
} from "@/lib/all-types";

type Conversation = SupportTicketConversation;

export type TicketPatch = Partial<
  Pick<SupportTicket, "subject" | "priority" | "category" | "status">
>;

export type NewMessageInput = {
  body: string;
  isStaff: boolean;
  isInternal?: boolean;
  author: { id: string; name: string; image?: string };
};

interface SupportState {
  /** Conversations keyed by ticket id. One entry = ticket + its messages. */
  conversations: Record<string, Conversation>;

  setConversation: (conversation: Conversation) => void;
  addMessage: (
    ticketId: string,
    input: NewMessageInput,
  ) => SupportMessage | null;
  editMessage: (ticketId: string, messageId: string, body: string) => void;
  deleteMessage: (ticketId: string, messageId: string) => void;
  updateTicket: (ticketId: string, patch: TicketPatch) => void;
  closeTicket: (ticketId: string) => void;
  reopenTicket: (ticketId: string) => void;
}

/** Re-derives the ticket fields that depend on the message list. */
function withDerivedFields(conv: Conversation): Conversation {
  const { messages, ticket } = conv;
  const last = messages[messages.length - 1];
  return {
    messages,
    ticket: {
      ...ticket,
      messageCount: messages.length,
      hasStaffReply: messages.some((m) => m.isStaff && !m.isInternal),
      lastMessageAt: last ? last.createdAt : ticket.createdAt,
      updatedAt: new Date(),
    },
  };
}

export const useSupportStore = create<SupportState>()((set, get) => {
  /** Applies `fn` to one conversation; no-op if it isn't loaded. */
  const mutate = (ticketId: string, fn: (c: Conversation) => Conversation) =>
    set((state) => {
      const current = state.conversations[ticketId];
      if (!current) return state;
      return {
        conversations: { ...state.conversations, [ticketId]: fn(current) },
      };
    });

  return {
    conversations: {},

    setConversation: (conversation) =>
      set((state) => ({
        conversations: {
          ...state.conversations,
          [conversation.ticket.id]: conversation,
        },
      })),

    addMessage: (ticketId, input) => {
      if (!get().conversations[ticketId]) return null;
      const now = new Date();
      const message: SupportMessage = {
        id: crypto.randomUUID(), // temp id until the backend returns the real one
        createdAt: now,
        updatedAt: now,
        ticketId,
        authorId: input.author.id,
        isStaff: input.isStaff,
        isInternal: input.isInternal ?? false,
        body: input.body.trim(),
        author: input.author,
      };
      mutate(ticketId, (c) =>
        withDerivedFields({ ...c, messages: [...c.messages, message] }),
      );
      return message;
    },

    editMessage: (ticketId, messageId, body) =>
      mutate(ticketId, (c) =>
        withDerivedFields({
          ...c,
          messages: c.messages.map((m) =>
            m.id === messageId
              ? { ...m, body: body.trim(), updatedAt: new Date() }
              : m,
          ),
        }),
      ),

    deleteMessage: (ticketId, messageId) =>
      mutate(ticketId, (c) =>
        withDerivedFields({
          ...c,
          messages: c.messages.filter((m) => m.id !== messageId),
        }),
      ),

    updateTicket: (ticketId, patch) =>
      mutate(ticketId, (c) => {
        const status = patch.status ?? c.ticket.status;
        return {
          ...c,
          ticket: {
            ...c.ticket,
            ...patch,
            closedAt:
              status === "closed" ? (c.ticket.closedAt ?? new Date()) : null,
            updatedAt: new Date(),
          },
        };
      }),

    closeTicket: (ticketId) =>
      get().updateTicket(ticketId, { status: "closed" }),
    reopenTicket: (ticketId) =>
      get().updateTicket(ticketId, { status: "open" }),
  };
});

/** Selector hook: re-renders only when this ticket's conversation changes. */
export const useConversation = (ticketId: string) =>
  useSupportStore((s) => s.conversations[ticketId]);
