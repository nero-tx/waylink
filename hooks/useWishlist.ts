import {
  createList,
  deleteItem,
  removeList,
  updateList,
  updateNote,
} from "@/actions/list.action";
import type { Wishlist } from "@/lib/all-types";
import { WishlistFormValues } from "@/validations";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useWishlistStore } from "@/stores/wishlist.store";

type LayoutState = "loading" | "error" | "data" | "empty";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export const useWishlists = () => {
  // Zustand state
  const wishlists = useWishlistStore((s) => s.wishlists);
  const activeListId = useWishlistStore((s) => s.activeWishlistId);
  const items = useWishlistStore((s) => s.items);

  // Zustand actions
  const setWishlists = useWishlistStore((s) => s.setWishlists);
  const setActiveListId = useWishlistStore((s) => s.setActiveWishlist);
  const setItems = useWishlistStore((s) => s.setItems);
  const clearItems = useWishlistStore((s) => s.clearItems);

  const addWishlist = useWishlistStore((s) => s.addWishlist);
  const removeWishlist = useWishlistStore((s) => s.removeWishlist);
  const updateWishlist = useWishlistStore((s) => s.updateWishlist);

  const removeItem = useWishlistStore((s) => s.removeItem);
  const updateItem = useWishlistStore((s) => s.updateItem);

  // Local UI state
  const [listsState, setListsState] = useState<LayoutState>("loading");
  const [itemsState, setItemsState] = useState<LayoutState>("empty");
  const [spinning, setSpinning] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const activeList = useMemo(
    () => wishlists.find((list) => list.id === activeListId) ?? null,
    [wishlists, activeListId],
  );

  const refresh = () => setRefreshKey((prev) => prev + 1);

  const handleCreate = async (values: WishlistFormValues) => {
    try {
      const res = await createList(values);

      if (res.state === "error") {
        toast.error(res.message);
        return;
      }

      addWishlist(res.list as Wishlist);
      setListsState("data");

      toast.success(res.message);
    } catch {
      toast.error("Failed to create wishlist");
    }
  };

  const handleUpdate = async (id: string, values: WishlistFormValues) => {
    try {
      const res = await updateList(id, values);

      if (res.state === "error") {
        toast.error(res.message);
        return;
      }

      updateWishlist(id, res.list as Wishlist);

      toast.success(res.message);
    } catch {
      toast.error("Failed to update wishlist");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      const res = await removeList(id);

      if (res.state === "error") {
        toast.error(res.message);
        return;
      }

      removeWishlist(id);

      const remainingLists = useWishlistStore.getState().wishlists;

      if (remainingLists.length === 0) {
        setListsState("empty");
        setItemsState("empty");
      }

      toast.success(res.message);
    } catch {
      toast.error("Failed to remove wishlist");
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const fetchLists = async () => {
      setListsState("loading");
      setSpinning(true);

      try {
        const res = await fetch(`${baseUrl}/api/user/wish-list`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error("Failed to get all lists");
        }

        const result = await res.json();
        const data: Wishlist[] = result.data ?? [];

        setWishlists(data);
        setListsState(data.length ? "data" : "empty");
      } catch (error) {
        if (controller.signal.aborted) return;

        setListsState("error");
        toast.error("Failed to load wishlists");
      } finally {
        if (!controller.signal.aborted) {
          setSpinning(false);
        }
      }
    };

    fetchLists();

    return () => controller.abort();
  }, [refreshKey]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchItems = async () => {
      if (!activeListId) {
        clearItems();
        setItemsState("empty");
        return;
      }

      setItemsState("loading");

      try {
        const res = await fetch(
          `${baseUrl}/api/user/wish-list/${activeListId}`,
          { signal: controller.signal },
        );

        if (!res.ok) {
          throw new Error("Failed to get wishlist items");
        }

        const result = await res.json();
        const data = result.data?.items ?? [];

        if (controller.signal.aborted) return;

        // Store guard prevents results for an old list from replacing
        // the currently active list's items.
        setItems(activeListId, data);
        setItemsState(data.length ? "data" : "empty");
      } catch {
        if (controller.signal.aborted) return;

        clearItems();
        setItemsState("error");
      }
    };

    fetchItems();

    return () => controller.abort();
  }, [activeListId]);

  const handleDeleteItem = async (itemId: string) => {
    if (!activeListId) return;

    const listId = activeListId;

    try {
      const res = await deleteItem(listId, itemId);

      if (res.state === "error") {
        toast.error(res.message);
        return;
      }

      removeItem(itemId);

      const currentList = useWishlistStore
        .getState()
        .wishlists.find((list) => list.id === listId);

      updateWishlist(listId, {
        totalItems: Math.max(0, (currentList?.totalItems ?? 0) - 1),
      });

      const remainingItems = useWishlistStore.getState().items;

      setItemsState(remainingItems.length ? "data" : "empty");

      toast.success(res.message);
    } catch {
      toast.error("Failed to delete wishlist item");
    }
  };

  const handleUpdateNote = async (itemId: string, newNote: string) => {
    if (!activeListId) return;

    const listId = activeListId;

    try {
      const res = await updateNote(itemId, listId, newNote);

      if (res.state === "error") {
        toast.error(res.message);
        return;
      }

      updateItem(itemId, { notes: newNote });

      toast.success(res.message);
    } catch {
      toast.error("Failed to update note");
    }
  };

  return {
    wishlists,
    wishlistItems: items,
    activeListId,
    activeList,
    listsState,
    itemsState,
    spinning,
    setActiveListId,
    refresh,
    handleCreate,
    handleUpdate,
    handleRemove,
    handleDeleteItem,
    handleUpdateNote,
  };
};
