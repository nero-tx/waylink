import type { Metadata } from "next";
import { SupportTicketsView } from "../_components/SupportTicketsView";
import { SupportTicket } from "@/lib/all-types";

export const metadata: Metadata = {
  title: "Support Center | Waylink",
  description:
    "Get help with your Waylink account, bookings, payments, or services. Contact our support team for assistance.",
  robots: {
    index: false,
    follow: false,
  },
};

const INITIAL_TICKETS: SupportTicket[] = [
  {
    id: "tkt-uuid-001",
    ticketNumber: 1042,
    userId: "user_9921",
    providerId: "prov-101",
    assigneeId: "staff_ali",
    category: "provider_status",
    subject:
      "Booking confirmation #BK-8841 stuck in pending state after payment",
    status: "open",
    priority: "high",
    createdAt: new Date("2026-09-14T21:30:00Z"),
    updatedAt: new Date("2026-11-14T23:20:00Z"),
    lastMessageAt: new Date("2026-11-14T23:10:00Z"),
    closedAt: null,
    messageCount: 5,
    hasStaffReply: true,
  },
  {
    id: "tkt-uuid-002",
    ticketNumber: 1041,
    userId: "user_9921",
    providerId: null,
    assigneeId: "staff_sara",
    category: "billing",
    subject: "Duplicate invoice charge on monthly Pro subscription",
    status: "waiting_on_customer",
    priority: "urgent",
    createdAt: new Date("2026-11-13T10:00:00Z"),
    updatedAt: new Date("2026-11-14T22:30:00Z"),
    lastMessageAt: new Date("2026-11-14T22:30:00Z"),
    closedAt: null,
    messageCount: 8,
    hasStaffReply: true,
  },
  {
    id: "tkt-uuid-003",
    ticketNumber: 1039,
    userId: "user_9921",
    providerId: "prov-102",
    assigneeId: "staff_ali",
    category: "technical",
    subject: "Webhook delivery timeout when syncing provider availability",
    status: "in_progress",
    priority: "normal",
    createdAt: new Date("2026-11-12T09:00:00Z"),
    updatedAt: new Date("2026-11-14T19:00:00Z"),
    lastMessageAt: new Date("2026-11-14T19:00:00Z"),
    closedAt: null,
    messageCount: 3,
    hasStaffReply: true,
  },
  {
    id: "tkt-uuid-004",
    ticketNumber: 1035,
    userId: "user_9921",
    providerId: null,
    assigneeId: "staff_sara",
    category: "account",
    subject:
      "Request to enable 2FA hardware security keys on organization account",
    status: "closed",
    priority: "low",
    createdAt: new Date("2026-11-10T08:00:00Z"),
    updatedAt: new Date("2026-11-12T14:22:00Z"),
    lastMessageAt: new Date("2026-11-12T14:22:00Z"),
    closedAt: new Date("2026-11-12T14:22:00Z"),
    messageCount: 6,
    hasStaffReply: true,
  },
];

const Page = () => {
  return (
    <SupportTicketsView
      role="user"
      tickets={INITIAL_TICKETS}
    />
  );
};

export default Page;
