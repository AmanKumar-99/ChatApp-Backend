import express from "express"
import {
  signInController,
  registerController,
} from "../../controller/authController/index.js"

const router = express.Router()

// Route for user sign-in
router.post("/signin", signInController)

// Route for user registration
router.post("/register", registerController)

export default router
