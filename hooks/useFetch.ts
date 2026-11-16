"use client";

import { useCallback, useEffect, useState } from "react";
import { fetcher } from "@/lib/helpers";

/**
 * GET `url` whenever it changes. Pass `null` to skip.
 * - the previous `data` stays while a new url loads (no flicker)
 * - in-flight requests are aborted when the url changes / on unmount
 *
 * isLoading   -> first load, no data yet (show a skeleton)
 * isFetching  -> any request in flight (show a subtle "refreshing" state)
 */
export function useFetch<T>(url: string | null) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(url !== null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (url === null) {
      setIsFetching(false);
      return;
    }

    const controller = new AbortController();
    setIsFetching(true);
    setError(null);

    fetcher<T>(url, { signal: controller.signal })
      .then((result) => {
        if (!controller.signal.aborted) setData(result);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setError(
          err instanceof Error ? err : new Error("Something went wrong."),
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsFetching(false);
      });

    return () => controller.abort();
  }, [url, nonce]);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  return {
    data,
    error,
    isLoading: isFetching && data === undefined,
    isFetching,
    refetch,
  };
}
