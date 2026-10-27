import { redisClient } from "@/lib/redis";

const DEFAULT_TTL_SECONDS = 60;
const CACHE_TIMEOUT_MS = 500;

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
