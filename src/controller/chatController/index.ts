import type { Request, Response } from "express"
import {
  addMembersToGroup,
  createDirectChat,
  createGroupChat,
  removeMembersFromGroup,
} from "../../services/chatService/index.js"

export const directChatController = async (
  req: Request,
  res: Response
) => {
  const { userAId, userBId } = req.body
  try {
    const chat = await createDirectChat(userAId, userBId)
    res.status(200).json(chat)
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating direct chat", error: err })
  }
}

export const groupChatController = async (req: Request, res: Response) => {
  const { groupName, adminId, memberIds } = req.body
  try {
    const chat = await createGroupChat(groupName, adminId, memberIds)
    res.status(200).json(chat)
  } catch (err) {
    res
      .status(500)
      .json({ message: "Error creating group chat", error: err })
  }
}