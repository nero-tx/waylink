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
  updateItem: (itemId: string, newData: Partial<WishlistItem>) => void;
  addItems: (newItems: WishlistItem | WishlistItem[]) => void;
  removeItem: (itemId: string) => void;
  clearItems: () => void;
}

export const useWishlistStore = create<WishlistState>((set) => ({
  wishlists: [],
  activeWishlistId: null,
  items: [],

  setWishlists: (wishlists) =>
    set((_) => ({
      wishlists,
    })),

  setActiveWishlist: (id) =>
    set((_) => ({
      activeWishlistId: id,
    })),

  addWishlist: (wishlist) =>
    set((state) => ({
      wishlists: [...state.wishlists, wishlist],
    })),

  removeWishlist: (id) =>
    set((state) => {
      const wishlists = state.wishlists.filter((list) => list.id !== id);

      const isActive = state.activeWishlistId === id;

      return {
        wishlists,
        activeWishlistId: isActive ? null : state.activeWishlistId,
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
      newItems = Array.isArray(newItems) ? newItems : [newItems];

      return {
        items: [
          ...state.items,
          ...newItems.filter((item) => !existingIds.has(item.id)),
        ],
      };
    }),

  updateItem: (itemId, newData) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === itemId ? { ...item, ...newData } : item,
      ),
    })),

  removeItem: (itemId) =>
    set((state) => ({
      items: state.items.filter((item) => item.id !== itemId),
    })),

  clearItems: () => set({ items: [] }),
}));
