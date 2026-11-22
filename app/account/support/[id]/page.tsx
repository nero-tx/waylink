import React from "react";
import { SupportConversationView } from "../../_components/SupportConversationView";
import { SupportTicketConversation, SupportViewer } from "@/lib/all-types";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);

const mock: SupportTicketConversation = {
  ticket: {
    id: "t-1",
    ticketNumber: "1042",
    userId: "u-1",
    status: "in_progress",
    providerId: "p-1",
    assigneeId: "s-1",
    category: "technical",
    subject: "My order arrived with a broken seal",
    priority: "high",
    lastMessageAt: minutesAgo(5),
    closedAt: null,
    createdAt: minutesAgo(180),
    updatedAt: minutesAgo(5),
    messageCount: 4,
    hasStaffReply: true,  
    provider: { id: "p-1", name: "Siwa Apothecary" },
    assignee: { id: "s-1", name: "Mona Adel", image: undefined },
  },
  messages: [
    {
      id: "m-1",
      ticketId: "t-1",
      authorId: "u-1",
      isStaff: false,
      isInternal: false,
      body: "Hi, the jar in my order arrived with the seal already broken. Can you help?",
      createdAt: minutesAgo(180),
      updatedAt: minutesAgo(180),
      author: { id: "u-1", name: "Tarek Fawzy" },
    },
    {
      id: "m-2",
      ticketId: "t-1",
      authorId: "s-1",
      isStaff: true,
      isInternal: false,
      body: "Sorry about that. Could you send a photo of the jar and the packaging?",
      createdAt: minutesAgo(120),
      updatedAt: minutesAgo(120),
      author: { id: "s-1", name: "Mona Adel" },
    },
    {
      id: "m-3",
      ticketId: "t-1",
      authorId: "s-1",
      isStaff: true,
      isInternal: true,
      body: "Check the courier log: this batch had two other seal complaints.",
      createdAt: minutesAgo(60),
      updatedAt: minutesAgo(60),
      author: { id: "s-1", name: "Mona Adel" },
    },
    {
      id: "m-4",
      ticketId: "t-1",
      authorId: "u-1",
      isStaff: false,
      isInternal: false,
      body: "Photos attached in the order page. Thanks for the quick reply!",
      createdAt: minutesAgo(5),
      updatedAt: minutesAgo(5),
      author: { id: "u-1", name: "Tarek Fawzy" },
    },
  ],
};

const viewer: SupportViewer = {
  id: "u-1",
  name: "Tarek Fawzy",
  image: null,
  isStaff: false,
};

const page = async ({ params }: Params) => {
  const { id } = await params;

  return (
    <div className="h-full w-full overflow-x-hidden">
      <SupportConversationView initial={mock} viewer={viewer} />
    </div>
  );
};

export default page;
