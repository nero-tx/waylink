"use client";

import { useEffect, useCallback } from "react";
import AuthModal from "../AuthModel";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { User } from "@/lib/all-types";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth.store";
import { useShallow } from "zustand/react/shallow";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // which the old one-time getSession() call missed.
  const { data, isPending } = authClient.useSession();

  const setSession = useAuthStore((s) => s.setSession);
  const isModalOpen = useAuthStore((s) => s.isModalOpen);
  const closeModal = useAuthStore((s) => s.closeModal);

  useEffect(() => {
    if (isPending) return;
    const user = (data?.user as User) ?? null;
    setSession(user);
  }, [data, isPending, setSession]);

  return (
    <>
      {children}
      <AuthModal isOpen={isModalOpen} onClose={closeModal} />
    </>
  );
}

export function useLogout() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);

  return useCallback(async () => {
    // leave protected pages first, as before
    router.replace("/");
    try {
      await authClient.signOut();
      setSession(null);
      router.refresh();
      toast.success("Signed out successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to log out");
    }
  }, [router, setSession]);
}

export function useAuth() {
  const logout = useLogout();
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const { user, loading, openModal, closeModal } = useAuthStore(
    useShallow((s) => ({
      user: s.user,
      loading: s.loading,
      openModal: s.openModal,
      closeModal: s.closeModal,
    })),
  );

  return { isAuthenticated, user, loading, openModal, closeModal, logout };
}
