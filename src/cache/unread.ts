import { redis } from "../config/redisClient.js"
import { Chat } from "../models/Chat/index.js"

/**
 * Increment unread count in both Redis and MongoDB
 */
export async function incrementUnread(chatId: string, userId: string) {
  // Redis: increment count
  const unread = await redis.incr(`unread:${chatId}:${userId}`)

  // MongoDB: increment unread map
  await Chat.findByIdAndUpdate(chatId, {
    $inc: { [`unreadCount.${userId}`]: 1 },
  })

  return unread
}

/**
 * Reset unread count in both Redis and MongoDB
 */
export async function resetUnread(chatId: string, userId: string) {
  // Redis: reset to 0
  await redis.set(`unread:${chatId}:${userId}`, "0")

  // MongoDB: reset in map
  await Chat.findByIdAndUpdate(chatId, {
    $set: { [`unreadCount.${userId}`]: 0 },
  })
}
