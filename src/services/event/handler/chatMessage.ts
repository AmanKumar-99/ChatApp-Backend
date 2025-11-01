import { Server, Socket } from "socket.io"
import streamifier from "streamifier"
import {
  isUserMemberOfChat,
  mapMimeToMessageType,
} from "../../../utilities/helper.js"
import cloudinary from "../../../config/cloudinary.js"
import { Message } from "../../../models/Message/index.js"
import { Chat } from "../../../models/Chat/index.js"
import { cacheMessage } from "../../../cache/messages.js"
import { incrementUnread } from "../../../cache/unread.js"

/**
 * payload may be:
 * {
 *   chatId: string,
 *   content?: string,            // optional text
 *   fileName?: string,           // optional file name
 *   fileType?: string,           // optional MIME type
 *   fileData?: string,           // optional base64 or dataURL
 * }
 */
export async function handleChatMessage(
  io: Server,
  socket: Socket,
  payload: any
) {
  try {
    const userId = socket.data.userId as string | undefined
    if (!userId) {
      socket.emit("chat:error", { message: "Unauthorized" })
      return
    }

    const { chatId, content } = payload
    if (!chatId) {
      socket.emit("chat:error", { message: "Missing chatId" })
      return
    }

    // Validate membership
    const member = await isUserMemberOfChat(userId, chatId)
    if (!member) {
      socket.emit("chat:error", { message: "Not a member of chat" })
      return
    }

    // Prepare message fields (some may be filled in later)
    let messageType: "text" | "image" | "video" | "audio" | "file" = "text"
    let mediaUrl: string | undefined
    let publicId: string | undefined
    let resourceType: string | undefined
    let format: string | undefined
    let bytes: number | undefined
    let originalFilename: string | undefined

    // If fileData provided => upload first (we stream to Cloudinary)
    if (payload.fileData) {
      const { fileName, fileType, fileData } = payload as {
        fileName?: string
        fileType?: string
        fileData: string
      }

      // Decide messageType from MIME
      messageType = mapMimeToMessageType(fileType)

      // Normalize base64 (strip data URL prefix if present)
      const base64 = fileData.includes(",")
        ? fileData.split(",")[1]
        : fileData
      const buffer = Buffer.from(base64, "base64")

      // Optional: enforce server-side max size (example: 50MB)
      const MAX_BYTES = Number(
        process.env.MAX_UPLOAD_BYTES || 50 * 1024 * 1024
      )
      if (buffer.length > MAX_BYTES) {
        socket.emit("chat:error", {
          message: `File too large. Max ${Math.round(
            MAX_BYTES / (1024 * 1024)
          )} MB`,
        })
        return
      }

      // Upload to Cloudinary via upload_stream (resource_type auto)
      const uploadResult: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "auto",
            folder: `chat_files/${chatId}`,
            public_id: `${Date.now()}_${fileName || "file"}`.replace(
              /\s+/g,
              "_"
            ),
          },
          (error, result) => {
            if (error) return reject(error)
            resolve(result)
          }
        )
        // stream the buffer
        streamifier.createReadStream(buffer).pipe(uploadStream)
      })

      // collect upload metadata
      mediaUrl = uploadResult.secure_url
      publicId = uploadResult.public_id
      resourceType = uploadResult.resource_type
      format = uploadResult.format
      bytes = uploadResult.bytes
      originalFilename = fileName || payload.originalFilename || "file"
      // If there was no text content, set messageType to inferred type (otherwise content may be "text")
      // We'll store final messageType based on available content: if there's text AND file, we keep messageType = messageType (file type)
      // but in UI you can render both content and file.
    }

    // If no fileData and no text, invalid payload
    if (!payload.fileData && !content) {
      socket.emit("chat:error", { message: "Empty message" })
      return
    }

    // Decide final messageType: if content present and no file -> 'text'; if file present -> image/video/audio/file (even if text also present)
    let finalMessageType: "text" | "image" | "video" | "audio" | "file" =
      "text"
    if (payload.fileData) {
      finalMessageType = mapMimeToMessageType(payload.fileType)
    } else {
      finalMessageType = "text"
    }

    // Create and save message doc containing both content (if any) and file metadata (if any)
    const msgDoc = new Message({
      chatId,
      senderId: userId,
      content: content || "", // empty string if no text
      messageType: finalMessageType, // 'text' or file-type
      mediaUrl: mediaUrl,
      publicId: publicId,
      resourceType: resourceType,
      format: format,
      bytes: bytes,
      originalFilename: originalFilename,
      status: "sent",
    })

    await msgDoc.save()

    // cache last messages
    try {
      await cacheMessage(chatId, msgDoc.toObject())
    } catch (e) {
      console.warn("cacheMessage failed", e)
    }

    // broadcast to room using same event so clients handle both text+file uniformly
    io.to(`chat:${chatId}`).emit("chat:message", msgDoc.toObject())

    // increment unread for other members
    const chat = await Chat.findById(chatId).select("members").lean()
    if (chat) {
      for (const m of chat.members) {
        const mid = m.toString()
        if (mid !== userId) await incrementUnread(chatId, mid)
      }
    }

    // acknowledgement for uploader
    socket.emit("chat:messageSent", { messageId: msgDoc._id })
  } catch (err: any) {
    console.error("handleChatMessage error:", err)
    socket.emit("chat:error", { message: "Failed to send message" })
  }
}
