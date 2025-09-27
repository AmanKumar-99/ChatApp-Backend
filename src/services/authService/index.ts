import { create } from "domain"
import { User } from "../../models/User/index.js"
import jwtSign from "../../utilities/jwtSign.js"
import { Request, Response, NextFunction } from "express"

// Function to handle user authentication
export const signInService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" })
    }
    // Check if user exists
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Compare the provided password with the stored hashed password
    const isMatchPassword = await user.comparedPassword(password)
    if (!isMatchPassword) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwtSign({ email, password })
    return res.json({ message: "Signed in successfully", token })
  } catch (error: any) {
    next(error)
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message })
  }
}

// Function to handle user registration
export const registerService = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, profilePicUrl, email, password } = req.body

    const existingUser = await User.findOne({ email }).exec()

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" })
    }

    // Create a new user
    await User.create({
      name,
      email,
      password,
      profilePicUrl,
    })

    const token = jwtSign({ email, password })
    let user = null
    if (token) {
      user = await User.findOne({ email }).select("-password").exec()
      user = user?.toObject()
    }
    return res.json({
      message: "User registered successfully",
      user,
      token,
    })
  } catch (error: any) {
    next(error)
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message })
  }
}
