"use server";

import { db } from "@/db";
import { products, wishlistItems, wishlists } from "@/db/schemas";
import { protectAction } from "@/lib/aj-actions";
import { getAuthSession } from "@/lib/auth-server";
import { wishlistFormSchema, WishlistFormValues } from "@/validations";
import { eq, and, inArray } from "drizzle-orm";
import { invalidateCache, generateKey, delCache } from "@/lib/cache";
import { after } from "next/server";
import z from "zod";

export const createList = async (dataForm: WishlistFormValues) => {
  const guard = await protectAction("user");

  if (!guard.ok) {
    return {
      message:
        guard?.message || "Security system unavailable. Try again later.",
      state: "error",
    };
  }

  const session = await getAuthSession();
  if (!session) {
    return { message: "Unauthorized", state: "error" };
  }

  const result = wishlistFormSchema.safeParse(dataForm);

  if (!result.success) {
    return {
      message: result.error.issues[0]?.message || "Invalid form data",
      state: "error",
    };
  }

  const { color, isPrivate, name, description } = result.data;
  const [newList] = await db
    .insert(wishlists)
    .values({
      userId: session.user.id,
      color,
      description,
      isPrivate,
      name,
    })
    .returning();

  await delCache(generateKey("wishlist", "user", session.user.id));

  return {
    message: "List created successfully",
    state: "success",
    list: newList,
  };
};

export const removeList = async (listId: string) => {
  const guard = await protectAction("user");

  if (!guard.ok) {
    return {
      message:
        guard?.message || "Security system unavailable. Try again later.",
      state: "error",
    };
  }

  const session = await getAuthSession();
  if (!session) {
    return { message: "Unauthorized", state: "error" };
  }

  const deleted = await db
    .delete(wishlists)
    .where(and(eq(wishlists.id, listId), eq(wishlists.userId, session.user.id)))
    .returning();

  if (deleted.length === 0)
    return { state: "error", message: "Not found or no permission" };

  await invalidateCache([
    generateKey("wishlist", "user", session.user.id),
    generateKey("wishlist", listId, "items"),
  ]);

  return {
    message: "List removed successfully",
    state: "success",
  };
};

export const updateList = async (id: string, data: WishlistFormValues) => {
  const guard = await protectAction("user");

  if (!guard.ok) {
    return {
      message:
        guard?.message || "Security system unavailable. Try again later.",
      state: "error",
    };
  }

  const session = await getAuthSession();
  if (!session) return { state: "error", message: "Unauthorized" };

  const result = wishlistFormSchema.safeParse(data);
  if (!result.success)
    return { state: "error", message: result.error.issues[0]?.message };

  const { color, name, description, isPrivate } = result.data;
  const updated = await db
    .update(wishlists)
    .set({ color, name, description, isPrivate })
    .where(and(eq(wishlists.id, id), eq(wishlists.userId, session.user.id)))
    .returning();

  if (updated.length === 0)
    return { state: "error", message: "Not found or no permission" };

  await delCache(generateKey("wishlist", "user", session.user.id));

  return {
    state: "success",
    message: "Updated successfully",
    list: updated[0],
  };
};

export const deleteItem = async (listId: string, id: string) => {
  const guard = await protectAction("user");

  if (!guard.ok) {
    return {
      message:
        guard?.message || "Security system unavailable. Try again later.",
      state: "error",
    };
  }

  const session = await getAuthSession();
  if (!session) {
    return { state: "error", message: "Unauthorized" };
  }
  const ownerList = await db.query.wishlists.findFirst({
    where: and(eq(wishlists.id, listId), eq(wishlists.userId, session.user.id)),
    columns: {
      id: true,
    },
  });

  if (!ownerList) {
    return {
      state: "error",
      message: "List not found or you do not have permission",
    };
  }
  const deleted = await db
    .delete(wishlistItems)
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.wishlistId, listId)))
    .returning();

  if (deleted.length === 0) {
    return {
      state: "error",
      message: "Item not found",
    };
  }

  await invalidateCache([
    generateKey("wishlist", deleted[0].wishlistId, "items"),
    generateKey("wishlist", "user", session.user.id),
  ]);

  return {
    state: "success",
    message: "Item deleted successfully",
    item: deleted[0],
  };
};

export const updateNote = async (
  id: string,
  listId: string,
  newNote: string,
) => {
  const guard = await protectAction("user");

  if (!guard.ok) {
    return {
      message:
        guard?.message || "Security system unavailable. Try again later.",
      state: "error",
    };
  }

  const session = await getAuthSession();
  if (!session) {
    return { state: "error", message: "Unauthorized" };
  }

  const safeNote = newNote.trim();
  if (safeNote.length > 200) {
    return {
      state: "error",
      message: "Note must be 200 characters or less",
    };
  }
  const ownerList = await db.query.wishlists.findFirst({
    where: and(eq(wishlists.id, listId), eq(wishlists.userId, session.user.id)),
    columns: {
      id: true,
    },
  });
  if (!ownerList) {
    return {
      state: "error",
      message: "List not found or you do not have permission",
    };
  }

  const updated = await db
    .update(wishlistItems)
    .set({ notes: safeNote })
    .where(and(eq(wishlistItems.id, id), eq(wishlistItems.wishlistId, listId)))
    .returning();

  if (updated.length === 0) {
    return {
      state: "error",
      message: "Item not found",
    };
  }

  await delCache(generateKey("wishlist", updated[0].wishlistId, "items"));

  return {
    state: "success",
    message: "Item updated successfully",
    item: updated[0],
  };
};

const inputSchema = z.object({
  wishlistId: z.string().uuid(),
  items: z.array(z.string().uuid()).min(1).max(10),
});

export async function addWishlistItem(input: {
  wishlistId: string;
  items: string[];
}): Promise<{
  state: "success" | "error";
  message: string;
}> {
  const [guard, session] = await Promise.all([
    protectAction("user"),
    getAuthSession(),
  ]);

  if (!guard.ok) {
    return {
      state: "error",
      message:
        guard?.message || "Security system unavailable. Try again later.",
    };
  }

  if (!session) return { state: "error", message: "Unauthorized" };

  const parsed = inputSchema.safeParse({
    ...input,
    items: [...new Set(input.items)],
  });
  if (!parsed.success) {
    return {
      state: "error",
      message: parsed.error.issues[0]?.message || "Invalid input",
    };
  }

  const { wishlistId, items: itemIds } = parsed.data;
  const userId = session.user.id;

  const [ownerList, found] = await Promise.all([
    db.query.wishlists.findFirst({
      where: and(eq(wishlists.id, wishlistId), eq(wishlists.userId, userId)),
      columns: { id: true },
    }),
    db.query.products.findMany({
      where: inArray(products.id, itemIds),
      columns: { id: true, type: true },
    }),
  ]);

  // Ownership is checked before any result is used
  if (!ownerList) {
    return {
      state: "error",
      message: "List not found or you do not have permission",
    };
  }

  if (found.length === 0) {
    return { state: "success", message: "Nothing was added" };
  }

  const inserted = await db
    .insert(wishlistItems)
    .values(
      found.map((p) => ({
        wishlistId,
        itemId: p.id,
        itemType: p.type,
      })),
    )
    .onConflictDoNothing()
    .returning({
      itemId: wishlistItems.itemId,
      itemType: wishlistItems.itemType,
    });

  if (inserted.length > 0) {
    after(() =>
      invalidateCache([
        generateKey("wishlist", wishlistId, "items"),
        generateKey("wishlist", "user", userId),
      ]),
    );

    return {
      state: "success",
      message: `Added ${inserted.length} items successfully`,
    };
  }

  return {
    state: "success",
    message: "All selected items are already in this list",
  };
}
