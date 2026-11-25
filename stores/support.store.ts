import { create } from "zustand";
import type {
  SupportMessage,
  SupportStatus,
  SupportTicket,
  SupportTicketConversation,
} from "@/lib/all-types";

type Conversation = SupportTicketConversation;
export type StatusFilter = "open" | "pending" | "closed" | "all";

export type TicketPatch = Partial<
  Pick<SupportTicket, "subject" | "priority" | "category" | "status">
>;

export type NewMessageInput = {
  body: string;
  isStaff: boolean;
  isInternal?: boolean;
  author: { id: string; name: string; image?: string };
};

type TicketCounts = Record<StatusFilter, number>;

interface SupportState {
  /** Conversations keyed by ticket id. One entry = ticket + its messages. */
  tickets: SupportTicket[];
  setTicket: (data: SupportTicket | SupportTicket[]) => void;
  removeTicket: (id: string) => void;

  counts: TicketCounts;
  setCounts: (counts?: TicketCounts) => void;
  updateCounts: (status: SupportStatus, action: "add" | "remove") => void;

  conversations: Record<string, Conversation>;
  setConversation: (conversation: Conversation) => void;
  addMessage: (
    ticketId: string,
    input: NewMessageInput,
    messageId: string,
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

const getCountKey = (
  status: SupportTicket["status"],
): Exclude<StatusFilter, "all"> => {
  switch (status) {
    case "open":
      return "open";

    case "in_progress":
    case "waiting_on_customer":
      return "pending";

    case "resolved":
    case "closed":
      return "closed";
  }
};

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
    tickets: [],

    counts: {
      open: 0,
      pending: 0,
      closed: 0,
      all: 0,
    },

    setCounts(counts) {
      if (!counts) return;
      set({ counts });
    },

    updateCounts(status, action) {
      set((state) => {
        const key = getCountKey(status);
        const delta = action === "add" ? 1 : -1;

        return {
          counts: {
            ...state.counts,
            [key]: Math.max(0, state.counts[key] + delta),
            all: Math.max(0, state.counts.all + delta),
          },
        };
      });
    },

    setTicket(data) {
      set((state) => ({
        tickets: Array.isArray(data)
          ? data
          : state.tickets.some((ticket) => ticket.id === data.id)
            ? state.tickets.map((ticket) =>
                ticket.id === data.id ? data : ticket,
              )
            : [data, ...state.tickets],
      }));
    },

    removeTicket(id) {
      set((state) => ({
        tickets: state.tickets.filter((t) => t.id !== id),
      }));
    },

    setConversation: (conversation) =>
      set((state) => ({
        conversations: {
          ...state.conversations,
          [conversation.ticket.id]: conversation,
        },
      })),

    addMessage: (ticketId, input, messageId) => {
      if (!get().conversations[ticketId]) return null;
      const now = new Date();
      const message: SupportMessage = {
        id: messageId,
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
