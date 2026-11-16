"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type UrlValue = string | number | boolean | string[] | null | undefined;
export type UrlPatch<T> = { [K in keyof T]?: T[K] | null };
type ElementOf<V> = V extends readonly (infer E)[] ? E : NonNullable<V>;

export interface UseUrlOptions<T> {
  allowed?: { [K in keyof T]?: readonly ElementOf<T[K]>[] };
  history?: "replace" | "push";
  scroll?: boolean;
  /** Keep the URL clean by dropping params equal to their default. Default true. */
  omitDefaults?: boolean;
}

export interface SetUrlParams<T> {
  <K extends keyof T>(key: K, value: T[K] | null | undefined): void;
  (patch: UrlPatch<T>): void;
}

// Read / write helpers
function isEqual(a: UrlValue, b: UrlValue) {
  if (Array.isArray(a) && Array.isArray(b))
    return a.join("\u0000") === b.join("\u0000");
  return a === b;
}

function readParam(
  sp: URLSearchParams,
  key: string,
  fallback: UrlValue,
  allowed?: readonly unknown[],
): UrlValue {
  if (Array.isArray(fallback)) {
    const items = sp
      .getAll(key)
      .filter((v) => v !== "" && (!allowed || allowed.includes(v)));
    return items.length ? items : fallback;
  }

  const raw = sp.get(key);
  if (raw === null) return fallback;

  if (typeof fallback === "number") {
    const n = Number(raw);
    if (raw.trim() === "" || !Number.isFinite(n)) return fallback;
    return allowed && !allowed.includes(n) ? fallback : n;
  }

  if (typeof fallback === "boolean") {
    if (raw === "true" || raw === "1") return true;
    if (raw === "false" || raw === "0") return false;
    return fallback;
  }

  return allowed && !allowed.includes(raw) ? fallback : raw;
}

function writeParam(
  params: URLSearchParams,
  key: string,
  value: UrlValue,
  fallback: UrlValue,
  omitDefaults: boolean,
) {
  params.delete(key);

  if (value === null || value === undefined || value === "") return;
  if (omitDefaults && isEqual(value, fallback)) return;

  if (Array.isArray(value)) {
    if (!value.length) return;
    for (const item of value) params.append(key, String(item));
    return;
  }

  params.set(key, String(value));
}

/**
 * Typed, validated state that lives in the URL query string.
 *
 * @example
 * type Filters = { status: StatusFilter; priority: PriorityFilter; page: number; q: string };
 *
 * const { urlParams, setUrlParams, resetUrl } = useUrl<Filters>(
 *   { status: "open", priority: "all", page: 1, q: "" },
 *   { allowed: { status: STATUS_FILTERS, priority: ["all", ...SUPPORT_PRIORITIES] } },
 * );
 *
 * urlParams.priority;                        // PriorityFilter
 * setUrlParams("priority", "urgent");        // one key
 * setUrlParams({ q: "refund", page: 1 });    // many keys, one navigation
 *
 * Defaults + options are read once (first render), so inline object literals are fine.
 * Needs a <Suspense> boundary above it (useSearchParams).
 */
export function useUrl<T extends Record<keyof T, UrlValue>>(
  initial: T,
  options: UseUrlOptions<T> = {},
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Frozen on first render so a new object literal each render can't cause re-computation.
  const [defaults] = useState(initial);
  const [config] = useState(options);
  const {
    allowed,
    history = "replace",
    scroll = false,
    omitDefaults = true,
  } = config;
  const keys = useMemo(
    () => Object.keys(defaults) as (keyof T & string)[],
    [defaults],
  );

  const query = searchParams.toString();

  // Last query we navigated to but that hasn't landed in useSearchParams yet.
  // Lets two setUrlParams calls in the same tick build on each other instead of overwriting.
  const pending = useRef<string | null>(null);
  useEffect(() => {
    pending.current = null;
  }, [query]);

  const urlParams = useMemo(() => {
    const sp = new URLSearchParams(query);
    const out = {} as T;
    for (const key of keys) {
      out[key] = readParam(
        sp,
        key,
        defaults[key],
        allowed?.[key],
      ) as T[typeof key];
    }
    return out;
  }, [query, keys, defaults, allowed]);

  const navigate = useCallback(
    (next: string) => {
      if (next === (pending.current ?? query)) return;
      pending.current = next;
      const url = next ? `${pathname}?${next}` : pathname;
      startTransition(() => router[history](url, { scroll }));
    },
    [query, pathname, router, history, scroll],
  );

  const setUrlParams = useCallback(
    (keyOrPatch: keyof T | UrlPatch<T>, maybeValue?: UrlValue) => {
      const patch = (
        typeof keyOrPatch === "object"
          ? keyOrPatch
          : { [keyOrPatch]: maybeValue }
      ) as UrlPatch<T>;

      const params = new URLSearchParams(pending.current ?? query);
      for (const key of Object.keys(patch) as (keyof T & string)[]) {
        if (!keys.includes(key)) continue; // ignore keys that weren't declared
        writeParam(
          params,
          key,
          patch[key] as UrlValue,
          defaults[key],
          omitDefaults,
        );
      }
      navigate(params.toString());
    },
    [query, keys, defaults, omitDefaults, navigate],
  ) as SetUrlParams<T>;

  /** Removes this hook's params only (other params on the page are untouched). */
  const resetUrl = useCallback(
    (only?: readonly (keyof T)[]) => {
      const params = new URLSearchParams(pending.current ?? query);
      for (const key of only ?? keys) params.delete(key as string);
      navigate(params.toString());
    },
    [query, keys, navigate],
  );

  /** True when at least one param differs from its default (e.g. show a "Reset" button). */
  const hasActiveParams = useMemo(
    () => keys.some((key) => !isEqual(urlParams[key], defaults[key])),
    [keys, urlParams, defaults],
  );

  return { urlParams, setUrlParams, resetUrl, hasActiveParams, isPending };
}
