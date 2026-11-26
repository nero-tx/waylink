import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { SupportConversationView } from "../../_components/SupportConversationView";
import { SupportTicketConversation } from "@/lib/all-types";
import { SupportConversationSkeleton } from "../../_components/MessageElements";
import { TicketStateCard } from "../../_components/TicketStateCard";
import { listTicketIssue } from "@/actions/support.action";

type Params = {
  params: Promise<{ id: string }>;
};

const reviveDates = (
  c: SupportTicketConversation,
): SupportTicketConversation => ({
  ticket: {
    ...c.ticket,
    lastMessageAt: new Date(c.ticket.lastMessageAt),
    closedAt: c.ticket.closedAt ? new Date(c.ticket.closedAt) : null,
    createdAt: new Date(c.ticket.createdAt),
    updatedAt: new Date(c.ticket.updatedAt),
  },
  messages: c.messages.map((m) => ({
    ...m,
    createdAt: new Date(m.createdAt),
    updatedAt: new Date(m.updatedAt),
  })),
});

const getConversation = cache(async (id: string) => {
  const res = await listTicketIssue(id);

  if (!res.ok || !res.data) {
    return {
      ok: false as const,
      data: null,
      error: res.error,
    };
  }

  return {
    ok: true as const,
    data: reviveDates(res.data),
    error: null,
  };
});

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const robots = { index: false, follow: false } as const;

  const result = await getConversation(id);

  if (!result.ok || !result.data) {
    return { title: "Support ticket", robots };
  }

  const { ticketNumber, subject, status } = result.data.ticket;

  return {
    title: `#${ticketNumber} · ${subject}`,
    description: `Support ticket #${ticketNumber} (${status.replaceAll("_", " ")})`,
    robots,
  };
}

async function ConversationLoader({ id }: { id: string }) {
  const result = await getConversation(id);

  if (!result.ok || !result.data) {
    const isNotFound = result.error?.toLowerCase().includes("not found");
    return (
      <TicketStateCard
        variant={isNotFound ? "not-found" : "error"}
        error={result.error ?? undefined}
      />
    );
  }

  return <SupportConversationView initial={result.data} />;
}

const page = async ({ params }: Params) => {
  const { id } = await params;

  return (
    <div className="flex h-full w-full flex-1 min-h-0 flex-col">
      <Suspense fallback={<SupportConversationSkeleton />}>
        <ConversationLoader id={id} />
      </Suspense>
    </div>
  );
};

export default page;
