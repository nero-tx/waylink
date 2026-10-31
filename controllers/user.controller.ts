import { getAuthSession } from "@/lib/auth-server";
import { generateKey, getCache, setCache } from "@/lib/cache";
import { Errors } from "@/lib/errors";
import { userService } from "@/services/user.service";

const userWishList = async () => {
  const session = await getAuthSession();
  if (!session?.user) {
    throw Errors.unauthorized(
      "User must be authenticated to access wishlists.",
    );
  }

  const key = generateKey("wishlists", session.user.id ,"*");
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

export const userController = { userWishList, listItems, userProvider };
