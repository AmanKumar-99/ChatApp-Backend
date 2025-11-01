// src/socket/handlers/downloadHandler.ts
import { Server, Socket } from "socket.io"
import { Message } from "../../../models/Message/index.js"
import { isUserMemberOfChat } from "../../../utilities/helper.js"

/**
 * payload: { messageId }
 */
export async function handleDownloadRequest(
  io: Server,
  socket: Socket,
  payload: { messageId: string }
) {
  try {
    const userId = socket.data.userId as string | undefined
    if (!userId) {
      socket.emit("chat:error", { message: "Unauthorized" })
      return
    }

    const { messageId } = payload
    if (!messageId) {
      socket.emit("chat:error", { message: "Missing messageId" })
      return
    }

    const message = await Message.findById(messageId).lean()
    if (!message) {
      socket.emit("chat:error", { message: "Message not found" })
      return
    }

    const chatId = message.chatId?.toString()
    if (!chatId) {
      socket.emit("chat:error", { message: "Message has no chatId" })
      return
    }

    const allowed = await isUserMemberOfChat(userId, chatId)
    if (!allowed) {
      socket.emit("chat:error", { message: "Access denied" })
      return
    }

    if (!message.mediaUrl) {
      socket.emit("chat:error", { message: "No media attached" })
      return
    }

    // Return url & filename to client; client will open anchor to download
    socket.emit("chat:downloadReady", {
      messageId,
      url: message.mediaUrl,
      fileName: message.originalFilename || "file",
      messageType: message.messageType || "file",
    })
  } catch (err: any) {
    console.error("handleDownloadRequest error:", err)
    socket.emit("chat:error", { message: "Download request failed" })
  }
}
