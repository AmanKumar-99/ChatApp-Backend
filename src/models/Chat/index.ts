import { model, Schema, Document, Types } from "mongoose"

export interface IChat extends Document {
  type: "direct" | "group"
  members: Types.ObjectId[]
  groupName?: string
  groupAdmins?: Types.ObjectId[]
  unreadCount: Map<string, number> // userId to count
  createdAt: Date
  updatedAt: Date
}

const ChatSchema = new Schema<IChat>(
  {
    type: { type: String, enum: ["direct", "group"], required: true },
    members: [
      { type: Schema.Types.ObjectId, ref: "User", required: true },
    ],
    groupName: { type: String },
    groupAdmins: [{ type: Schema.Types.ObjectId, ref: "User" }],
    unreadCount: {
      type: Map,
      of: Number, // userId → count
      default: {},
    },
  },
  { timestamps: true }
)

ChatSchema.index({ members: 1 }) // find chats by user
ChatSchema.index({ updatedAt: -1 }) // sort by latest activity

export const Chat = model<IChat>("Chat", ChatSchema)
