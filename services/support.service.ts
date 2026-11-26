"use server";

import { db } from "@/db";
import { supportMessages, supportTickets } from "@/db/schemas";
import {
  Actor,
  SupportMessage,
  SupportStatus,
  SupportTicketConversation,
} from "@/lib/all-types";
import { parseQuery } from "@/lib/query_parser/analyzer";
import {
  buildSearchQuery,
  buildWhereConditions,
  mergeWhere,
} from "@/lib/query_parser/helpers";
import {
  count,
  desc,
  eq,
  getTableColumns,
  inArray,
  or,
  sql,
} from "drizzle-orm";

type StatusFilter = "open" | "closed" | "pending" | "all";

const STATUS_GROUPS: Record<
  "open" | "pending" | "closed",
  readonly SupportStatus[]
> = {
  open: ["open"],
  pending: ["in_progress", "waiting_on_customer"],
  closed: ["resolved", "closed"],
};

function getStatusCounts(
  statusRows: { status: SupportStatus; total: number }[],
) {
  const countGroup = (group: Exclude<StatusFilter, "all">) =>
    statusRows
      .filter((row) => STATUS_GROUPS[group].includes(row.status))
      .reduce((sum, row) => sum + Number(row.total), 0);

  return {
    all: statusRows.reduce((sum, row) => sum + Number(row.total), 0),
    open: countGroup("open"),
    pending: countGroup("pending"),
    closed: countGroup("closed"),
  } satisfies Record<StatusFilter, number>;
}

export async function listTicketService(
  urlParams: URLSearchParams,
  actor: Actor,
) {
  const { query } = parseQuery(urlParams);
  const limit = Number(query?.limit ?? 10);
  const offset = Number(query?.offset ?? 0);

  const ticketsSQL = buildWhereConditions(query?.where ?? {}, supportTickets);
  const actorSQL = buildWhereConditions(
    {
      userId: actor.userId,
      providerId: actor.role === "provider" ? actor.providerId : undefined,
    },
    supportTickets,
  );
  const searchSQL = buildSearchQuery(
    supportTickets.searchVector,
    query?.search?.term,
    "fts",
  );

  const where = mergeWhere(ticketsSQL, searchSQL, actorSQL);
  const ticketAccessCondition = or(
    eq(supportTickets.userId, actor.userId),
    actor.role === "provider"
      ? eq(supportTickets.providerId, actor.providerId)
      : undefined,
  );

  const { searchVector, ...ticketColumns } = getTableColumns(supportTickets);

  //   1) get the full tickets
  const page = db
    .$with("page")
    .as(
      db
        .select(ticketColumns)
        .from(supportTickets)
        .where(where)
        .orderBy(desc(supportTickets.createdAt), desc(supportTickets.id))
        .limit(limit)
        .offset(offset),
    );

  // 2) Message stats only for the tickets on this page
  const messageStats = db
    .select({
      ticketId: supportMessages.ticketId,
      messageCount:
        sql<number>`count(*) filter (where ${supportMessages.isInternal} = false)`
          .mapWith(Number)
          .as("message_count"),
      hasStaffReply:
        sql<boolean>`coalesce(bool_or(${supportMessages.isStaff} and not ${supportMessages.isInternal}), false)`.as(
          "has_staff_reply",
        ),
    })
    .from(supportMessages)
    .where(
      inArray(supportMessages.ticketId, db.select({ id: page.id }).from(page)),
    )
    .groupBy(supportMessages.ticketId)
    .as("message_stats");

  // 3) Join the stats onto the page
  const pageCols = Object.fromEntries(
    Object.keys(ticketColumns).map((k) => [k, (page as any)[k]]),
  ) as typeof ticketColumns;

  const [tickets, statusRows] = await Promise.all([
    db
      .with(page)
      .select({
        ...pageCols,
        messageCount:
          sql<number>`coalesce(${messageStats.messageCount}, 0)`.mapWith(
            Number,
          ),
        hasStaffReply: sql<boolean>`coalesce(${messageStats.hasStaffReply}, false)`,
      })
      .from(page)
      .leftJoin(messageStats, eq(messageStats.ticketId, page.id))
      .orderBy(desc(page.createdAt), desc(page.id)),
    db
      .select({ status: supportTickets.status, total: count() })
      .from(supportTickets)
      .where(ticketAccessCondition)
      .groupBy(supportTickets.status),
  ]);

  const counts = getStatusCounts(statusRows);
  const total = counts.all;

  const pagination = {
    total,
    limit,
    offset,
    page: Math.floor(offset / limit) + 1,
    totalPages: Math.ceil(total / limit),
    hasNextPage: offset + limit < total,
    hasPrevPage: offset > 0,
  };

  return { tickets, pagination, counts };
}

export async function ticketIssues(
  ticketId: string,
): Promise<SupportTicketConversation | null> {
  const result = await db.query.supportTickets.findFirst({
    where: (tickets, { eq }) => eq(tickets.id, ticketId),
    columns: {
      searchVector: false,
    },
    with: {
      messages: {
        orderBy: (m, { asc }) => asc(m.createdAt),
        with: {
          author: {
            columns: { id: true, name: true, image: true },
          },
        },
      },
      provider: { columns: { id: true, name: true } },
      assignee: {
        columns: { id: true, name: true, image: true },
      },
    },
  });

  if (!result) return null;

  const { assignee, messages, provider, ...data } = result;

  const messagesOut: SupportMessage[] = messages.map(({ author, ...m }) => ({
    ...m,
    author: {
      id: author?.id ?? "",
      name: author?.name ?? "Unknown",
      image: author?.image ?? undefined,
    },
  }));

  return {
    messages: messagesOut,
    ticket: {
      ...data,
      provider,
      assignee: assignee
        ? { ...assignee, image: assignee.image ?? undefined }
        : null,
      messageCount: messages.length,
      hasStaffReply: messages.some((m) => m.isStaff && !m.isInternal),
    },
  };
}
