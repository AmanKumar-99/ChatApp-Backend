import { User } from "../../models/User/index.js"
import jwtSign, {
  jwtRefreshSign,
  REFRESH_EXPIRES_SECONDS,
} from "../../utilities/jwtSign.js"
import { Request, Response, NextFunction } from "express"
import jwt, { JwtPayload } from "jsonwebtoken"
import { verifyAuthToken } from "../../utilities/verifyAuth.js"

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
    const user = await User.findOne({ email }).exec()

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Compare the provided password with the stored hashed password
    const isMatchPassword = await user.comparedPassword(password)
    if (!isMatchPassword) {
      return res.status(401).json({ message: "Invalid credentials" })
    }

    // Generate JWT token
    const token = jwtSign({ email, password }) // Access Token
    const refreshToken = jwtRefreshSign({ email, password })

    const userData = user.toObject()
    const { password: _, ...userWithoutPassword } = userData

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true, // Set to true if using HTTPS (production)
      sameSite: "strict",
      maxAge: REFRESH_EXPIRES_SECONDS * 1000,
    })

    return res.json({
      message: "Signed in successfully",
      user: userWithoutPassword,
      token,
    })
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

    const token = jwtSign({ email, password }) // Access token
    const refreshToken = jwtRefreshSign({ email, password })
    let user = null
    if (token) {
      user = await User.findOne({ email }).select("-password").exec()
      user = user?.toObject()

      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: true, // Set to true if using HTTPS (production)
        sameSite: "strict",
        maxAge: REFRESH_EXPIRES_SECONDS * 1000,
      })
    }
    return res.json({
      message: "User registered successfully",
      token,
      user,
    })
  } catch (error: any) {
    next(error)
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message })
  }
}

// Get user data from token
export const verifyUserData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.refreshToken
  const { email } = req.query

  const accessToken = jwtSign({ email })

  verifyAuthToken(
    token,
    async (
      err: jwt.VerifyErrors | null,
      payload: string | JwtPayload | undefined
    ) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Invalid token", error: err })
      } else {
        req.payload = payload
      }
    }
  )

  if (typeof req.payload !== "string" && req.payload?.email) {
    const user = (await User.findOne({ email }).exec())?.toObject()
    res.json({ user, token: accessToken })
  }

  next()
}

// Logout service
export const logout = (req: Request, res: Response) => {
  res.clearCookie("refreshToken")
  res.json({ ok: true })
}
