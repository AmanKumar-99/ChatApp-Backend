import { Server, Socket } from "socket.io"
import { setUserOffline, setUserOnline } from "../../cache/presence.js"
import { redis } from "../../config/redisClient.js"
import { incrementUnread, resetUnread } from "../../cache/unread.js"
import { Chat } from "../../models/Chat/index.js"
import { cacheMessage } from "../../cache/messages.js"
import { Message } from "../../models/Message/index.js"
import {
  addMembersToGroup,
  removeMembersFromGroup,
} from "../chatService/index.js"

export function registerSocketEvents(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("New connection:", socket.id)

    // User joins after authentication
    socket.on("user:join", async (userId: string) => {
      socket.data.userId = userId

      let chatIds: string[] = []
      try {
        chatIds = await redis.smembers(`user:${userId}:chats`)
      } catch (e) {
        // fallback: query DB - Chat.find({ members: userId }).select('_id')
        const chats = await Chat.find({ members: userId })
          .select("_id")
          .lean()
        chatIds = chats.map((c) => c._id.toString())
        // populate Redis for next time
        for (const cid of chatIds)
          await redis.sadd(`user:${userId}:chats`, cid)
      }

      // join the socket to each room so it receives broadcasts
      for (const cid of chatIds) {
        socket.join(`chat:${cid}`)
      }

      // Optionally emit success / chat list
      socket.emit("user:joined", { userId, chatIds })

      await setUserOnline(userId, socket.id, io)
    })

    // Join chat room
    socket.on("chat:join", async ({ chatId, userId }) => {
      socket.join(`chat:${chatId}`)
      const chat = await Chat.findById(chatId)
      if (chat && !chat.members.includes(userId)) {
        chat.members.push(userId)
        await chat.save()
      }
    })

    // Send message
    socket.on(
      "chat:message",
      async ({ chatId, senderId, content, messageType }) => {
        const message = new Message({
          chatId,
          senderId,
          content,
          messageType: messageType || "text",
          status: "sent",
        })
        await message.save()

        // Cache message in Redis for fast reads
        await cacheMessage(chatId, message.toObject())

        // Broadcast
        io.to(`chat:${chatId}`).emit("chat:message", message)

        // Update unread for all others
        const chat = await Chat.findById(chatId)
        if (chat) {
          for (const memberId of chat.members) {
            if (memberId.toString() !== senderId) {
              await incrementUnread(chatId, memberId.toString())
            }
          }
        }
      }
    )

    // Add members to group (triggered by group admin)
    socket.on("group:addMembers", async ({ chatId, newMemberIds }) => {
      try {
        const updatedChat = await addMembersToGroup(
          io,
          chatId,
          newMemberIds
        )
        socket.emit("group:addMembers:success", updatedChat)
      } catch (err) {
        socket.emit("group:addMembers:error", {
          message: (err as Error).message,
        })
      }
    })

    // Remove members from group
    socket.on(
      "group:removeMembers",
      async ({ chatId, memberIdsToRemove }) => {
        try {
          const updatedChat = await removeMembersFromGroup(
            io,
            chatId,
            memberIdsToRemove
          )
          socket.emit("group:removeMembers:success", updatedChat)
        } catch (err) {
          socket.emit("group:removeMembers:error", {
            message: (err as Error).message,
          })
        }
      }
    )

    // Typing indicator
    socket.on("chat:typing", ({ chatId, userId, isTyping }) => {
      redis.set(`typing:${chatId}:${userId}`, String(isTyping))
      socket.to(`chat:${chatId}`).emit("chat:typing", { userId, isTyping })
    })

    // Reset unread when user reads
    socket.on("chat:read", async ({ chatId, userId }) => {
      await resetUnread(chatId, userId)
      await Message.updateMany(
        { chatId, status: { $ne: "read" } },
        { status: "read" }
      )
    })

    // Disconnect
    socket.on("disconnected", async () => {
      const userId = socket.data.userId
      if (userId) {
        await setUserOffline(userId, socket.id)
        console.log(`User ${userId} disconnected`)
      }
    })
  })
}
