import { redis } from "../config/redisClient.js"

/**
 * Store message in Redis cache (FIFO list of last 20 messages)
 */
export async function cacheMessage(chatId: string, message: any) {
  const key = `chat:${chatId}:messages`
  await redis.lpush(key, JSON.stringify(message)) // add new message to list
  await redis.ltrim(key, 0, 19) // keep only last 20
}

/**
 * Retrieve last cached messages from Redis
 */
export async function getCachedMessages(chatId: string) {
  const key = `chat:${chatId}:messages`
  const messages = await redis.lrange(key, 0, -1)
  return messages.map((msg) => JSON.parse(msg))
}
