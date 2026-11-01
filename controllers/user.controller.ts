import { getAuthSession } from "@/lib/auth-server";
import { generateKey, getCache, setCache } from "@/lib/cache";
import { Errors } from "@/lib/errors";
import { userService } from "@/services/user.service";
import { URL } from "url";

const userWishList = async () => {
  const session = await getAuthSession();
  if (!session?.user) {
    throw Errors.unauthorized(
      "User must be authenticated to access wishlists.",
    );
  }

  const key = generateKey("wishlists", session.user.id, "*");
  const cache = await getCache(key);
  if (cache) {
    return cache;
  }

  const res = await userService.getUserWishlists(session.user.id);
  await setCache(key, res, 3600);
  return res;
};

const listItems = async (listId: string) => {
  const session = await getAuthSession();
  if (!session?.user) {
    throw Errors.unauthorized(
      "User must be authenticated to access wishlists.",
    );
  }

  const key = generateKey("wishlist", listId, "items");
  const cache = await getCache(key);
  if (cache) {
    return cache;
  }

  const res = await userService.getListItems(listId);
  await setCache(key, res, 3600);
  return res;
};

const userProvider = async () => {
  const session = await getAuthSession();
  if (!session?.user) {
    throw Errors.unauthorized(
      "User must be authenticated to access wishlists.",
    );
  }

  return await userService.getUserProvider(session.user.id);
};

const listServices = async (url: URL) => {
  const params = url.searchParams;
  const search = params.get("search")?.trim();
  const limit = params.get("limit");

  try {
    const key = generateKey("wishlists", "services");

    const cache = await getCache(key);
    if (cache && !search) {
      return cache;
    }

    const res = await userService.listServices(
      search ?? "",
      limit ? parseInt(limit) : 10,
    );

    if (!search) await setCache(key, res, 3600);

    return res;
  } catch (error) {
    throw new Error("Failed to load services.");
  }
};

export const userController = {
  userWishList,
  listItems,
  userProvider,
  listServices,
};
