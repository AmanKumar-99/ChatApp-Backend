import { Chat } from "../../models/Chat/index.js"
import { redis } from "../../config/redisClient.js"
import mongoose from "mongoose"
import type { Server } from "socket.io"

/**
 * Create or get a 1-1 (direct) chat between two users
 * - Avoids duplicate chats
 * - Adds chat info to Redis for fast lookup
 */
export async function createDirectChat(userAId: string, userBId: string) {
  // Check if chat already exists between both users
  let chat = await Chat.findOne({
    type: "direct",
    members: { $all: [userAId, userBId], $size: 2 },
  })

  if (chat) {
    return chat
  }

  // Otherwise create a new one
  chat = new Chat({
    type: "direct",
    members: [userAId, userBId],
  })
  await chat.save()

  // Save mapping to Redis for fast lookup
  await redis.sadd(`user:${userAId}:chats`, chat._id as string)
  await redis.sadd(`user:${userBId}:chats`, chat._id as string)

  // Also store basic metadata in Redis (useful for quick UI preload)
  await redis.hmset(`chat:${chat._id}:meta`, {
    type: "direct",
    members: JSON.stringify(chat.members),
  })

  return chat
}

/**
 * Create a new group chat
 * - Stores chat in MongoDB
 * - Adds chatId to all members in Redis
 */
export async function createGroupChat(
  groupName: string,
  adminId: string,
  memberIds: string[]
) {
  const uniqueMembers = Array.from(new Set([...memberIds, adminId]))

  const chat = new Chat({
    type: "group",
    groupName,
    groupAdmins: [adminId],
    members: uniqueMembers.map((id) => new mongoose.Types.ObjectId(id)),
  })

  await chat.save()

  // Redis updates
  for (const memberId of uniqueMembers) {
    await redis.sadd(`user:${memberId}:chats`, chat._id as string)
  }

  await redis.hmset(`chat:${chat._id}:meta`, {
    type: "group",
    groupName,
    members: JSON.stringify(uniqueMembers),
    admins: JSON.stringify([adminId]),
  })

  return chat
}

/**
 * Add new members to a group chat.
 */
export async function addMembersToGroup(
  io: Server | null,
  chatId: string,
  newMemberIds: string[]
) {
  const chat = await Chat.findById(chatId)
  if (!chat) throw new Error("Chat not found")
  if (chat.type !== "group")
    throw new Error("Cannot add members to direct chat")

  // Avoid duplicates
  const existingIds = new Set(chat.members.map((id) => id.toString()))
  const uniqueNew = newMemberIds.filter((id) => !existingIds.has(id))

  if (uniqueNew.length === 0) return chat // No new members

  // Update MongoDB
  chat.members.push(
    ...uniqueNew.map((id) => new mongoose.Types.ObjectId(id))
  )
  await chat.save()

  // Update Redis for each user
  for (const memberId of uniqueNew) {
    await redis.sadd(`user:${memberId}:chats`, chat._id as string)
  }

  // Update Redis chat metadata
  await redis.hset(
    `chat:${chat._id}:meta`,
    "members",
    JSON.stringify(chat.members)
  )

  // 🔥 Notify all users in that group (via socket)
  if (io) {
    io.to(`chat:${chatId}`).emit("group:membersAdded", {
      chatId,
      newMembers: uniqueNew,
    })
  }

  return chat
}

/**
 * Remove members from a group chat.
 */
export async function removeMembersFromGroup(
  io: Server | null,
  chatId: string,
  memberIdsToRemove: string[]
) {
  const chat = await Chat.findById(chatId)
  if (!chat) throw new Error("Chat not found")
  if (chat.type !== "group")
    throw new Error("Cannot remove members from direct chat")

  const updatedMembers = chat.members.filter(
    (id) => !memberIdsToRemove.includes(id.toString())
  )

  chat.members = updatedMembers
  await chat.save()

  // Remove from Redis
  for (const memberId of memberIdsToRemove) {
    await redis.srem(`user:${memberId}:chats`, chat._id as string)
  }

  // Update Redis chat metadata
  await redis.hset(
    `chat:${chat._id}:meta`,
    "members",
    JSON.stringify(updatedMembers)
  )

  // 🔥 Notify current members
  if (io) {
    io.to(`chat:${chatId}`).emit("group:membersRemoved", {
      chatId,
      removedMembers: memberIdsToRemove,
    })
  }

  return chat
}
