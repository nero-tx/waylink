"use client";

import { useState } from "react";
import { CircleCheck, RotateCcw } from "lucide-react";
import { useSupportStore } from "@/stores/support.store";
import type { SupportTicketConversation } from "@/lib/all-types";
import { Button } from "@/components/ui/button";
import { RenderStatusPill } from "./SupportElements";

type Ticket = SupportTicketConversation["ticket"];

export function TicketTopBar({ ticket }: { ticket: Ticket }) {
  const closeTicket = useSupportStore((s) => s.closeTicket);
  const reopenTicket = useSupportStore((s) => s.reopenTicket);
  const isClosed = ticket.status === "closed";

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">#{ticket.ticketNumber}</span>
          <RenderStatusPill status={ticket.status} />
        </div>
        <h1 className="truncate text-lg font-semibold text-green-600">{ticket.subject}</h1>
      </div>

      <div className="flex items-center gap-2">
        {isClosed ? (
          <Button
            variant="outline"
            className="border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            onClick={() => reopenTicket(ticket.id)}
          >
            <RotateCcw className="size-4" />
            Reopen ticket
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => closeTicket(ticket.id)}
          >
            <CircleCheck className="size-4" />
            Close ticket
          </Button>
        )}
      </div>
    </header>
  );
}
