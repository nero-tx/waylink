import { headers } from "next/headers";
import { auth } from "./auth";
import { cache } from "react";

export const getAuthSession = cache(async (fresh: boolean = false) => {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
      query: fresh ? { disableCookieCache: true } : undefined,
    });

    return session ?? null;
  } catch (error) {
    console.error("[auth] getSession failed:", error);
    return null;
  }
});
