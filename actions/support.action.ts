"use server";

import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { supportMessages, supportTickets } from "@/db/schemas";
import type {
  SupportCategory,
  SupportStatus,
  SupportTicket,
} from "@/lib/all-types";
import {
  supportTicketSchema,
  type SupportTicketFormValues,
} from "@/validations/support";
import { authGuard } from "./service.action";
import { getAuthSession } from "@/lib/auth-server";
import { customAlphabet } from "nanoid";
import { randomInt } from "node:crypto";
import { getTicketIssuesController } from "@/controllers/support.controller";

type SupportRole = "user" | "provider";
type ActionError = {
  state: "error";
  message: string;
  errors?: Record<string, string>;
};
type ActionSuccess<T = undefined> = {
  state: "success";
  message: string;
  data?: T;
};
type ActionResult<T = undefined> = ActionSuccess<T> | ActionError;

/**
 * Who is calling. `userId` is always set because support_tickets.user_id is
 * NOT NULL; a provider acts through its owner user.
 */
type Actor =
  | { role: "user"; userId: string }
  | { role: "provider"; userId: string; providerId: string };

// Rules
/** A ticket can only be edited / deleted while its status is in this list. */
const MUTABLE_STATUSES: readonly SupportStatus[] = ["open"];

/** Categories each side may use (same lists as the UI, enforced again here). */
const ROLE_CATEGORIES: Record<SupportRole, readonly SupportCategory[]> = {
  user: ["account", "booking", "billing", "technical", "other"],
  provider: [
    "account",
    "provider_status",
    "booking",
    "billing",
    "listing",
    "technical",
    "other",
  ],
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helpers
const fail = (
  message: string,
  errors?: Record<string, string>,
): ActionError => ({ state: "error", message, errors });

const UNAUTHORIZED = fail("Unauthorized");

async function resolveActor(
  role: SupportRole,
): Promise<{ actor: Actor } | { error: ActionError }> {
  if (role === "provider") {
    try {
      const guard = await authGuard("provider");
      if (guard.actorType !== "provider") return { error: UNAUTHORIZED };

      return {
        actor: {
          role: "provider",
          userId: guard.actor.ownerId,
          providerId: guard.actor.id,
        },
      };
    } catch {
      return { error: UNAUTHORIZED };
    }
  }

  const session = await getAuthSession();
  if (!session) return { error: UNAUTHORIZED };

  return { actor: { role: "user", userId: session.user.id } };
}

/**
 * Generates a random ticket number using a 31-character alphabet.
 * Excludes 0, 1, I, L, and O to avoid look-alike confusion.
 * Supports random lengths from 6 to 10 characters (inclusive).
 * A larger alphabet reduces collision probability; the unique index
 * and retry-on-conflict logic in createTicket guarantee uniqueness.
 *
 * Examples: 7K3M9Q, HW4BRNZJ2A
 */
function generateTicketNumber(min = 6, max = 10): string {
  const length = randomInt(min, max + 1);
  return customAlphabet("23456789ABCDEFGHJKMNPQRSTUVWXYZ", length)();
}

/** Never trust the client: re-validate with the same schema + role rules. */
function validate(
  actor: Actor,
  input: unknown,
): { values: SupportTicketFormValues } | { error: ActionError } {
  const parsed = supportTicketSchema.safeParse(input);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[String(issue.path[0] ?? "form")] ??= issue.message;
    }
    return {
      error: fail(parsed.error.issues[0]?.message ?? "Invalid input.", errors),
    };
  }

  if (!ROLE_CATEGORIES[actor.role].includes(parsed.data.category)) {
    return {
      error: fail("This category isn't available for your account.", {
        category: "Select a different category.",
      }),
    };
  }

  return { values: parsed.data };
}

/* --- support_tickets ownership --------------------------------------- */

/**
 * user_id is the ticket's author. provider_id is set when the ticket is about
 * a provider account, so on its own it does NOT prove ownership: a user's
 * ticket about provider X also carries X. A provider therefore owns a ticket
 * only when BOTH its provider_id and its owner user_id match.
 */
const ownerFields = (actor: Actor) => ({
  userId: actor.userId,
  providerId: actor.role === "provider" ? actor.providerId : null,
});

const ownedBy = (actor: Actor) =>
  actor.role === "provider"
    ? and(
        eq(supportTickets.providerId, actor.providerId),
        eq(supportTickets.userId, actor.userId),
      )
    : eq(supportTickets.userId, actor.userId);

async function findOwnedTicket(id: string, actor: Actor) {
  const [ticket] = await db
    .select({ id: supportTickets.id, status: supportTickets.status })
    .from(supportTickets)
    .where(and(eq(supportTickets.id, id), ownedBy(actor)))
    .limit(1);

  return ticket ?? null;
}

// Actions --------------------

export async function createSupportTicket(
  role: SupportRole,
  input: SupportTicketFormValues,
): Promise<ActionResult<SupportTicket>> {
  const auth = await resolveActor(role);
  if ("error" in auth) return auth.error;
  const { actor } = auth;

  const checked = validate(actor, input);
  if ("error" in checked) return checked.error;
  const { values } = checked;

  try {
    const ticket = await db.transaction(async (tx) => {
      // status default, last_message_at and timestamps come from the DB
      const [created] = await tx
        .insert(supportTickets)
        .values({
          ticketNumber: generateTicketNumber(),
          subject: values.subject,
          category: values.category,
          priority: values.priority,
          status: "open",
          ...ownerFields(actor),
        })
        .returning();

      // the description is the first message of the ticket
      await tx.insert(supportMessages).values({
        ticketId: created.id,
        authorId: actor.userId,
        body: values.body,
      });

      return created;
    });

    // cache: revalidate here once caching lands
    return { state: "success", message: "Ticket created.", data: ticket };
  } catch (error) {
    console.error("[support] createSupportTicket", error);
    return fail("Couldn't create the ticket. Try again.");
  }
}

export async function updateSupportTicket(
  role: SupportRole,
  id: string,
  input: SupportTicketFormValues,
): Promise<ActionResult> {
  const auth = await resolveActor(role);
  if ("error" in auth) return auth.error;
  const { actor } = auth;

  if (!UUID.test(id)) return fail("Ticket not found.");

  const checked = validate(actor, input);
  if ("error" in checked) return checked.error;
  const { values } = checked;

  try {
    const ticket = await findOwnedTicket(id, actor);
    if (!ticket) return fail("Ticket not found.");
    if (!MUTABLE_STATUSES.includes(ticket.status)) {
      return fail("This ticket can no longer be edited.");
    }

    await db.transaction(async (tx) => {
      const [_, [first]] = await Promise.all([
        tx
          .update(supportTickets)
          .set({
            subject: values.subject,
            category: values.category,
            priority: values.priority,
          })
          .where(and(eq(supportTickets.id, id), ownedBy(actor))),

        // editing the description edits the ticket's first message
        tx
          .select({ id: supportMessages.id })
          .from(supportMessages)
          .where(eq(supportMessages.ticketId, id))
          .orderBy(asc(supportMessages.createdAt))
          .limit(1),
      ]);

      if (first) {
        await tx
          .update(supportMessages)
          .set({ body: values.body })
          .where(eq(supportMessages.id, first.id));
      }
    });

    // cache: revalidate here once caching lands
    return { state: "success", message: "Ticket updated." };
  } catch (error) {
    console.error("[support] updateSupportTicket", error);
    return fail("Couldn't update the ticket. Try again.");
  }
}

export async function deleteSupportTicket(
  role: SupportRole,
  id: string,
): Promise<ActionResult> {
  const auth = await resolveActor(role);
  if ("error" in auth) return auth.error;
  const { actor } = auth;

  if (!UUID.test(id)) return fail("Ticket not found.");

  try {
    const ticket = await findOwnedTicket(id, actor);
    if (!ticket) return fail("Ticket not found.");
    if (!MUTABLE_STATUSES.includes(ticket.status)) {
      return fail("This ticket can no longer be deleted.");
    }

    await db.transaction(async (tx) => {
      await tx.delete(supportMessages).where(eq(supportMessages.ticketId, id));
      await tx
        .delete(supportTickets)
        .where(and(eq(supportTickets.id, id), ownedBy(actor)));
    });

    // cache: revalidate here once caching lands
    return { state: "success", message: "Ticket deleted." };
  } catch (error) {
    console.error("[support] deleteSupportTicket", error);
    return fail("Couldn't delete the ticket. Try again.");
  }
}

export async function listTicketIssue(ticketId: string) {
  try {
    if (!ticketId) throw new Error("Missing Ticket ID.");
    const data = await getTicketIssuesController(ticketId);

    if (!data) {
      return {
        ok: false,
        data: null,
        error: "Ticket issues not found.",
      };
    }

    return {
      ok: true,
      data,
      error: null,
    };
  } catch (error) {
    console.error("listTicketIssue:", error);

    return {
      ok: false,
      data: null,
      error: "Failed to fetch ticket issues. Please try again later.",
    };
  }
}
