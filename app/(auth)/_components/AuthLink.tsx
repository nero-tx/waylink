"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { safeNext } from "@/lib/utils";

type AuthPage = "/login" | "/signup";

export function buildAuthHref(page: AuthPage, current: string) {
  const next = safeNext(current);
  return next === "/" ? page : `${page}?next=${encodeURIComponent(next)}`;
}

export function AuthLink({
  page = "/login",
  onClick,
  ...props
}: Omit<React.ComponentProps<typeof Link>, "href"> & { page?: AuthPage }) {
  const router = useRouter();

  return (
    <Link
      href={page}
      {...props}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;

        e.preventDefault();
        // Read the URL at click time: always current, includes ?filters,
        // and doesn't need useSearchParams (no Suspense needed in layouts).
        const current = window.location.pathname + window.location.search;
        router.push(buildAuthHref(page, current));
      }}
    />
  );
}
