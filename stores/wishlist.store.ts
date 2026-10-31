import { create } from "zustand";
import type { Wishlist, WishlistItem } from "@/lib/all-types";

interface WishlistState {
  wishlists: Wishlist[];
  activeWishlistId: string | null;
  items: WishlistItem[];

  setWishlists: (wishlists: Wishlist[]) => void;
  setActiveWishlist: (id: string | null) => void;

  addWishlist: (wishlist: Wishlist) => void;
  removeWishlist: (id: string) => void;
  updateWishlist: (id: string, newData: Partial<Wishlist>) => void;

  setItems: (wishlistId: string, items: WishlistItem[]) => void;
  addItems: (newItems: WishlistItem[]) => void;
  removeItem: (itemId: string) => void;
  clearItems: () => void;
}

export const useWishlistStore = create<WishlistState>((set) => ({
  wishlists: [],
  activeWishlistId: null,
  items: [],

  setWishlists: (wishlists) =>
    set((state) => ({
      wishlists,
      activeWishlistId: wishlists.some(
        (list) => list.id === state.activeWishlistId,
      )
        ? state.activeWishlistId
        : (wishlists[0]?.id ?? null),
      items: wishlists.some((list) => list.id === state.activeWishlistId)
        ? state.items
        : [],
    })),

  setActiveWishlist: (id) =>
    set((state) => ({
      activeWishlistId: id,
      items: state.activeWishlistId === id ? state.items : [],
    })),

  addWishlist: (wishlist) =>
    set((state) => ({
      wishlists: [...state.wishlists, wishlist],
      activeWishlistId: wishlist.id,
      items: [],
    })),

  removeWishlist: (id) =>
    set((state) => {
      const wishlists = state.wishlists.filter((list) => list.id !== id);

      const isActive = state.activeWishlistId === id;

      return {
        wishlists,
        activeWishlistId: isActive
          ? (wishlists[0]?.id ?? null)
          : state.activeWishlistId,
        items: isActive ? [] : state.items,
      };
    }),

  updateWishlist: (id, newData) =>
    set((state) => ({
      wishlists: state.wishlists.map((list) =>
        list.id === id ? { ...list, ...newData } : list,
      ),
    })),

  setItems: (wishlistId, items) =>
    set((state) => (state.activeWishlistId === wishlistId ? { items } : state)),

  addItems: (newItems) =>
    set((state) => {
      const existingIds = new Set(state.items.map((item) => item.id));

      return {
        items: [
          ...state.items,
          ...newItems.filter((item) => !existingIds.has(item.id)),
        ],
      };
    }),

  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    })),

  clearItems: () => set({ items: [] }),
}));
