import jwt from "jsonwebtoken"
import dotenv from "dotenv"

dotenv.config()

const jwtSecret = process.env.JWT_SECRET

if (!jwtSecret) {
  throw new Error("JWT_SECRET environment variable is not defined")
}

export default (payload: string | object | Buffer) =>
  jwt.sign(payload, jwtSecret, { expiresIn: "10m" })
