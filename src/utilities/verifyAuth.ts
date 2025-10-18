import jwt, { JwtPayload } from "jsonwebtoken"
import { Request, Response, NextFunction } from "express"

// Extend Express Request to include payload
declare module "express-serve-static-core" {
  interface Request {
    payload?: string | JwtPayload
  }
}

const verifyAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  const token =
    (authHeader && authHeader.split(" ")[1]) || req.cookies.token

  if (!token) {
    return res.status(401).json({ message: "No token provided" })
  }

  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    return res
      .status(500)
      .json({ message: "JWT_SECRET environment variable is not defined" })
  }

  verifyAuthToken(
    token,
    (
      err: jwt.VerifyErrors | null,
      payload: string | JwtPayload | undefined
    ) => {
      if (err) {
        return res
          .status(401)
          .json({ message: "Invalid token", error: err })
      } else {
        req.payload = payload
        return next()
      }
    }
  )
}

export const verifyAuthToken = (token: string, callback: any = null) => {
  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    return new Error("Secret Key Not Defined...")
  }

  return jwt.verify(token, jwtSecret, callback)
}

export default verifyAuth
