import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

// Constants
const AUTH_EXPIRES = "15m"
export const REFRESH_EXPIRES_SECONDS = 60 * 60 * 24 * 20 // 20 DAYS

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET

if (!jwtAccessSecret) {
  throw new Error("JWT_ACCESS_SECRET environment variable is not defined")
}

if (!jwtRefreshSecret) {
  throw new Error("JWT_REFRESH_SECRET environment variable is not defined")
}

export const jwtRefreshSign = (payload: string | object | Buffer) =>
  jwt.sign(payload, jwtRefreshSecret, {
    expiresIn: `${REFRESH_EXPIRES_SECONDS}s`,
  })

export default (payload: string | object | Buffer) =>
  jwt.sign(payload, jwtAccessSecret, { expiresIn: AUTH_EXPIRES })
