import express from "express"
import {
  signInController,
  registerController,
  logoutController,
} from "../../controller/authController/index.js"
import { verifyUserData } from "../../services/authService/index.js"

const router = express.Router()

// Protected route to get user info, verifies token from cookie
router.get("/me", verifyUserData)

// Route for user sign-in
router.post("/signin", signInController)

// Route for user registration
router.post("/register", registerController)

// Route for user logout
router.post("/logout", logoutController)

export default router
