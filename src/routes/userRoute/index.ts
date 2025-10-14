import express from "express"
import verifyAuth from "../../utilities/verifyAuth.js"
import { getUserByIdController, getUserDataController } from "../../controller/userController/index.js"

const router = express.Router()

// POST /direct - Direct chat message
router.get("/", verifyAuth, getUserDataController)

// POST /group - Group chat message
router.post("/:userId", verifyAuth, getUserByIdController)

export default router
