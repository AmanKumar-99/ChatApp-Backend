import Redis from "ioredis"

// Create a Redis client with sensible retry options and attach error handlers
export const redis = new Redis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: 3,
    // retry strategy in ms
    retryStrategy(times) {
      return Math.min(times * 50, 2000)
    },
    // reconnect on some network errors
    reconnectOnError(err) {
      // ioredis passes errors; allow reconnect on ECONNREFUSED and other transient errors
      if (
        err &&
        (err.message.includes("ECONNREFUSED") ||
          err.message.includes("Connection is closed"))
      ) {
        return true
      }
      return false
    },
  }
)

redis.on("error", (err) => {
  // Log Redis errors but don't crash the process — app can still function with degraded features
  // (presence/unread will be inconsistent until Redis is available)
  // Use console.error here because this module runs before any logging is configured.
  console.error("[ioredis] error:", err && err.message ? err.message : err)
})

redis.on("connect", () => {
  console.log("[ioredis] connected...")
})
