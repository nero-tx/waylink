import { getAuthSession } from "@/lib/auth-server";
import { getCurrentProvider } from "@/lib/provider-auth";
import { listTicketService } from "@/services/support.service";

type Actor =
  | { role: "user" | "admin"; userId: string }
  | { role: "provider"; userId: string; providerId: string };

async function requireProvider(secure?: boolean) {
  const { provider, role, status } = await getCurrentProvider();
  if (!provider || !role) throw new Error("Unauthorized.");

  if (secure) {
    if (status !== "ok") throw new Error("Permission denied.");
    const isPrivileged = role === "owner" || role === "manager";
    if (!isPrivileged) {
      throw new Error("Insufficient permissions.");
    }
  }

  return provider;
}

/**
 * Validates the session, builds the actor (id + role) and runs the handler.
 * Maps SupportError to a status code and hides unexpected errors behind a 500.
 */
async function withActor<T>(
  role: "user" | "provider",
  handler: (actor: Actor) => Promise<T>,
) {
  const session = await getAuthSession();
  if (!session) throw new Error("Unauthorized");

  const user = session.user;

  let actor: Actor = {
    userId: user.id,
    role: "user",
  };

  if (role === user.role && user.role === "provider") {
    const { id, ownerId } = await requireProvider();
    actor = {
      role: "provider",
      userId: ownerId,
      providerId: id,
    };
  }

  try {
    return await handler(actor);
  } catch (err) {
    console.error("[support.controller]", err);
    throw "Something went wrong";
  }
}

export function listTicketsController(
  params: URLSearchParams,
  role: "user" | "provider" = "user",
) {
  return withActor(role, async (actor) => {
    return await listTicketService(params, actor);
  });
}
