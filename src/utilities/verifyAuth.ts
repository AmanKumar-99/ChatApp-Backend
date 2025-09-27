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
  const token = authHeader && authHeader.split(" ")[1]

  if (!token) {
    return res.status(401).json({ message: "No token provided" })
  }

  const jwtSecret = process.env.JWT_SECRET

  if (!jwtSecret) {
    return res
      .status(500)
      .json({ message: "JWT_SECRET environment variable is not defined" })
  }

  jwt.verify(token, jwtSecret, (err, payload) => {
    if (err) {
      return res.status(401).json({ message: "Invalid token", error: err })
    } else {
      req.payload = payload
      return next()
    }
  })
}

export default verifyAuth
