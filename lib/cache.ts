import { redisClient } from "@/lib/redis";
import { createQueryCacheKey } from "./create-query-key";

const DEFAULT_TTL_SECONDS = 60;
const CACHE_TIMEOUT_MS = 500;
const versionKey = (ns: string) => `cache-version:${ns}`;
type QueryInput = URLSearchParams | string | Record<string, unknown>;

// Stops a hanging Redis call from blocking the request
function withTimeout<T>(
  promise: Promise<T>,
  ms = CACHE_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("cache timeout")), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function logCacheError(op: string, key: string, err: unknown) {
  console.warn(
    `[cache] ${op} failed for "${key}", falling back:`,
    err instanceof Error ? err.message : err,
  );
}

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    const redis = await withTimeout(redisClient());
    const raw = await withTimeout(redis.get(key));
    if (raw === null) return null;
    return JSON.parse(raw) as T;
  } catch (err) {
    logCacheError("get", key, err);
    return null;
  }
}

export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = DEFAULT_TTL_SECONDS,
): Promise<boolean> {
  try {
    const redis = await withTimeout(redisClient());
    await withTimeout(
      redis.set(key, JSON.stringify(value), { EX: ttlSeconds }),
    );
    return true;
  } catch (err) {
    logCacheError("set", key, err);
    return false;
  }
}

export async function delCache(...keys: string[]): Promise<number> {
  if (keys.length === 0) return 0;
  try {
    const redis = await withTimeout(redisClient());
    return await withTimeout(redis.del(keys));
  } catch (err) {
    logCacheError("del", keys.join(", "), err);
    return 0;
  }
}

const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// Deletes exact keys. Retries once on failure, because a failed delete leaves stale data.
export async function invalidateCache(
  keys: string[],
  { retries = 3, delayMS = 125 }: { retries?: number; delayMS?: number } = {},
): Promise<boolean> {
  const uniqueKeys = [...new Set(keys)];
  if (uniqueKeys.length === 0) return true;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const redis = await withTimeout(redisClient());
      await withTimeout(redis.del(uniqueKeys));
      return true;
    } catch (err) {
      logCacheError("invalidate", uniqueKeys.join(", "), err);
      if (attempt === retries) break;

      await sleep(delayMS);
    }
  }
  return false;
}

const SEPARATOR = ":";

export function generateKey(...args: string[]): string {
  if (args.length === 0) {
    throw new Error("generateKey needs at least one part");
  }

  return args
    .map((part) => {
      if (typeof part !== "string" || part.length === 0) {
        throw new Error("generateKey parts must be non-empty strings");
      }
      return encodeURIComponent(part);
    })
    .join(SEPARATOR);
}

export async function buildCacheKey(ns: string, input: QueryInput) {
  const version = (await getCache(versionKey(ns))) ?? "0";
  return generateKey(ns, `v${version}`, createQueryCacheKey(input));
}

// Invalidate the whole namespace
export async function invalidateNamespace(ns: string) {
  const key = versionKey(ns);
  try {
    const redis = await withTimeout(redisClient());
    await withTimeout(redis.incr(key));
    return true;
  } catch (err) {
    logCacheError("invalidate namespace", key, err);
    return false;
  }
}
