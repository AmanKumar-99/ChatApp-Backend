import { Chat } from "../models/Chat/index.js"

/**
 * Map MIME type to app-level messageType
 */
export function mapMimeToMessageType(
  mime?: string
): "image" | "video" | "audio" | "file" | "text" {
  if (!mime) return "file"
  if (mime.startsWith("image/")) return "image"
  if (mime.startsWith("video/")) return "video"
  if (mime.startsWith("audio/")) return "audio"
  return "file"
}

/**
 * Check if userId is a member of chatId (returns true/false).
 * Uses Chat model.
 */
export async function isUserMemberOfChat(
  userId: string,
  chatId: string
): Promise<boolean> {
  if (!userId || !chatId) return false
  const chat = await Chat.findById(chatId).select("members").lean()
  if (!chat) return false
  return (chat.members || [])
    .map((m: any) => m.toString())
    .includes(userId)
}
