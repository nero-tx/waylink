import { createClient, type RedisClientType } from "redis";

const globalForRedis = globalThis as unknown as {
  redisClient?: RedisClientType;
  redisConnecting?: Promise<RedisClientType> | null;
};

function createRedisClient(): RedisClientType {
  const url = process.env.REDIS_URL;
  if (!url) {
    throw new Error("REDIS_URL is not defined");
  }

  const client = createClient({
    url,
    // Fail commands immediately when disconnected instead of queuing them
    disableOfflineQueue: true,
    socket: {
      // Retry in the background, backing off up to 5 seconds
      reconnectStrategy: (retries) => Math.min(retries * 500, 5000),
    },
  });

  client.on("error", (err) => {
    console.error("[redis] error:", err.message);
  });

  return client;
}

export async function redisClient(): Promise<RedisClientType> {
  const client = globalForRedis.redisClient ?? createRedisClient();
  globalForRedis.redisClient = client;

  if (client.isReady) return client;

  // A connection attempt is already in progress
  if (globalForRedis.redisConnecting) {
    return globalForRedis.redisConnecting;
  }

  // Already open but reconnecting: return it so commands fail fast
  if (client.isOpen) return client;

  // Clear the pending promise on success or failure, so the next call can retry
  globalForRedis.redisConnecting = client.connect().then(
    () => {
      globalForRedis.redisConnecting = null;
      return client;
    },
    (err) => {
      globalForRedis.redisConnecting = null;
      throw err;
    },
  );

  return globalForRedis.redisConnecting;
}
