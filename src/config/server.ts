import http from "http"
import cors from "cors"
import express from "express"
import dotenv from "dotenv"
import cookieParser from "cookie-parser"
import initSocket from "./socketio.js"
import authRoute from "../routes/authRoute/index.js"
import chatRoute from "../routes/chatRoute/index.js"
import userRoute from "../routes/userRoute/index.js"
import { type Server as IOServer } from "socket.io"

let io: IOServer | null = null

dotenv.config()

const connectServer = async () => {
  const app = express() // For App router
  const server = http.createServer(app)

  app.use(express.json())
  app.use(cookieParser())
  app.use(cors({ origin: "http://localhost:8080", credentials: true })) // Change this for production

  // Other routes and middleware can be added here
  app.use("/api/auth", authRoute)
  app.use("/api/users", userRoute)
  app.use("/api/chat", chatRoute)

  // Initialize Socket.io connection
  io = await initSocket(server)

  const PORT = process.env.PORT || 3000

  server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}...`)
  })
}

export default connectServer

export const getSocketIO = () => io
