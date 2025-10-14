import { redis } from "../config/redisClient"

/**
 * Store usersData in Redis cache (FIFO list of last 20 usersData)
 */
export async function cacheUserData(userId: string, userData: any) {
  const key = `user:${userId}:usersData`
  await redis.lpush(key, JSON.stringify(userData)) // add new userData to list
  await redis.ltrim(key, 0, 19) // keep only last 20
}

/**
 * Retrieve last cached userData from Redis
 */
export async function getUserDataById(userId: string) {
  const key = `user:${userId}:userData`
  const userData = await redis.lrange(key, 0, -1)
  return userData.map((msg) => JSON.parse(msg))
}