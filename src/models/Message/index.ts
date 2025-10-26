import { model, Schema, Document } from "mongoose"

export interface IMessage extends Document {
  chatId: Schema.Types.ObjectId
  senderId: Schema.Types.ObjectId
  content?: string
  mediaUrl?: string
  publicId?: string
  resourceType?: string
  bytes?: number
  originalFilename?: string
  messageType: "text" | "image" | "file" | "video" | "audio"
  status: "sent" | "delivered" | "read"
  createdAt: Date
}

const MessageSchema = new Schema<IMessage>(
  {
    chatId: {
      type: Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
      index: true,
    },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String },
    mediaUrl: { type: String },
    publicId: { type: String },
    resourceType: { type: String },
    originalFilename: { type: String },
    bytes: { type: Number },
    messageType: {
      type: String,
      enum: ["text", "image", "file", "video", "audio"],
      default: "text",
    },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true, versionKey: false }
)

MessageSchema.index({ chatId: 1, createdAt: -1 }) // retrieve messages in chat

export const Message = model<IMessage>("Message", MessageSchema)
