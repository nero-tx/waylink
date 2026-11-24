import { create } from "zustand";
import type { User } from "@/lib/all-types";

type AuthState = {
  user: User | null;
  loading: boolean;
  isModalOpen: boolean;
};

type AuthActions = {
  setSession: (user: User | null) => void;
  openModal: () => void;
  closeModal: () => void;
};

export const useAuthStore = create<AuthState & AuthActions>()((set) => ({
  user: null,
  loading: true, 
  isModalOpen: false,

  setSession: (user) =>
    set((s) => ({
      user,
      loading: false,
      isModalOpen: user ? false : s.isModalOpen,
    })),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false }),
}));

// Selectors
export const selectIsAuthenticated = (s: AuthState) => !!s.user;
