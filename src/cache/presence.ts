import { redis } from "../config/redisClient.js"
import { User } from "../models/User/index.js"

// Mark a user as online: store socket id in Redis set and update persistent status
export async function setUserOnline(userId: string, socketId: string) {
  await redis.set(`user:${userId}:status`, "online")
  await redis.sadd(`sockets:${userId}`, socketId)

  await User.findByIdAndUpdate(userId, { status: "online" })
}

// Remove a socket for a user; if no sockets remain mark user offline and record last seen
export async function setUserOffline(userId: string, socketId: string) {
  await redis.srem(`sockets:${userId}`, socketId)
  const socketsLeft = await redis.scard(`sockets:${userId}`)

  if (socketsLeft === 0) {
    await redis.set(`user:${userId}:status`, "offline")
    await redis.set(`user:${userId}:lastSeen`, new Date().toISOString())

    await User.findByIdAndUpdate(userId, {
      status: "offline",
      lastSeen: new Date(),
    })
  }
}
