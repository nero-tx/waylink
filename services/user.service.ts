import { db } from "@/db";
import {
  productMedia,
  products,
  productScores,
  productStats,
  providers,
  wishlistItems,
  wishlists,
} from "@/db/schemas";
import { Location, Media, ServiceListItem } from "@/lib/all-types";
import { buildSearchQuery, mergeWhere } from "@/lib/query_parser/helpers";
import { and, count, desc, eq, or, getTableColumns, sql } from "drizzle-orm";

const cover = db
  .select({
    productId: productMedia.productId,
    media: sql<Media[]>`jsonb_agg(to_jsonb(${productMedia}))`.as("media"),
  })
  .from(productMedia)
  .where(or(eq(productMedia.type, "image"), eq(productMedia.isCover, true)))
  .groupBy(productMedia.productId)
  .limit(2)
  .as("cover");

async function getUserWishlists(userId: string) {
  if (!userId) throw new Error("User id is required.");

  const wishlistsWithCount = await db
    .select({
      ...getTableColumns(wishlists),
      totalItems: count(wishlistItems.id),
    })
    .from(wishlists)
    .leftJoin(wishlistItems, eq(wishlistItems.wishlistId, wishlists.id))
    .where(eq(wishlists.userId, userId))
    .groupBy(wishlists.id);

  return wishlistsWithCount;
}

async function getListItems(listId: string) {
  const itemsQuery = db
    .select({
      ...getTableColumns(wishlistItems),
      productId: wishlistItems.itemId,
      title: products.title,
      reviews: productStats.reviewsCount,
      bookings: productStats.bookingsCount,
      avgRate: sql<number>`coalesce(${productStats.averageRating}, 0)`.mapWith(
        Number,
      ),
      media: cover.media,
    })
    .from(wishlistItems)
    .leftJoin(products, eq(wishlistItems.itemId, products.id))
    .leftJoin(productStats, eq(products.id, productStats.productId))
    .leftJoin(cover, eq(cover.productId, products.id))
    .where(eq(wishlistItems.wishlistId, listId))
    .orderBy(desc(wishlistItems.id));

  const countQuery = db
    .select({ total: count() })
    .from(wishlistItems)
    .where(eq(wishlistItems.wishlistId, listId));

  const [items, [{ total }]] = await Promise.all([itemsQuery, countQuery]);

  return { items, total };
}

const getUserProvider = async (userId: string) => {
  const provider = await db.query.providers.findFirst({
    where: eq(providers.ownerId, userId),
    with: {
      logs: {
        limit: 1,
        where(log, { isNull }) {
          isNull(log.resolvedAt);
        },
        orderBy: (log, { desc }) => [desc(log.createdAt)],
      },
    },
  });

  return provider;
};

const listServices = async (
  search: string,
  limit: number,
): Promise<ServiceListItem[]> => {
  const searchQuery = buildSearchQuery(products.searchVector, search, "fts");

  const rows = await db
    .select({
      id: products.id,
      title: products.title,
      slug: products.slug,
      type: products.type,
      status: products.status,
      coverMedia: cover.media,
    })
    .from(products)
    .innerJoin(productScores, eq(productScores.productId, products.id))
    .leftJoin(cover, eq(cover.productId, products.id))
    .where(mergeWhere(eq(products.status, "active"), searchQuery))
    .orderBy(desc(productScores.finalScore))
    .limit(limit);

  return rows.map(({ coverMedia, ...service }) => ({
    ...service,
    media: coverMedia,
  }));
};

export const userService = {
  getUserWishlists,
  getListItems,
  getUserProvider,
  listServices,
};
