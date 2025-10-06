import express from "express"
import {
  directChatController,
  groupChatController,
} from "../../controller/chatController/index.js"

const router = express.Router()

// POST /direct - Direct chat message
router.post("/direct", directChatController)

// POST /group - Group chat message
router.post("/group", groupChatController)

export default router
