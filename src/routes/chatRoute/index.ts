import express from "express"
import {
  directChatController,
  groupChatController,
} from "../../controller/chatController/index.js"
import verifyAuth from "../../utilities/verifyAuth.js"

const router = express.Router()

// POST /direct - Direct chat message
router.post("/direct", verifyAuth, directChatController)

// POST /group - Group chat message
router.post("/group", verifyAuth, groupChatController)

export default router
