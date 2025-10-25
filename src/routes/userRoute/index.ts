import express from "express"
import verifyAuth from "../../utilities/verifyAuth.js"
import { getUserByIdController, getUserDataController } from "../../controller/userController/index.js"

const router = express.Router()

// GET / - Get All Users
router.get("/", verifyAuth, getUserDataController)

// GET /:userId - Get User by Id
router.get("/:userId", verifyAuth, getUserByIdController)

export default router
