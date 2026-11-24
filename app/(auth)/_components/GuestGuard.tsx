"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthLoader } from "./AuthLoader";
import { selectIsAuthenticated, useAuthStore } from "@/stores/auth.store";
import { useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/utils";

function useNextPath() {
  return safeNext(useSearchParams().get("next"));
}

export function GuestGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const next = useNextPath();
  const loading = useAuthStore((s) => s.loading);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace(next);
  }, [loading, isAuthenticated, next, router]);

  if (loading) return <AuthLoader label="Verifying your session..." />;
  if (isAuthenticated) return <AuthLoader label="Redirecting you..." />;

  return <>{children}</>;
}
