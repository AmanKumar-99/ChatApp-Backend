import { Server } from "socket.io"
import http from "http"
import { registerSocketEvents } from "../services/event/socketEvent.js"
import cookie from "cookie"
import { verifyAuthToken } from "../utilities/verifyAuth.js"

// Initialize Socket.io server and register events
export default async function initSocket(server: http.Server) {
  const io = new Server(server, {
    cors: { origin: "*" }, // configure allowed origins
  })

  io.use((socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie
        ? cookie.parse(socket.handshake.headers.cookie)
        : {}
      const token = cookies.refreshToken || socket.handshake.auth?.refreshToken
      if (!token) return next(new Error("Authentication error"))

      const user = verifyAuthToken(token)

      if (!user) {
        return next(Error("Unauthorized"))
      }
    } catch (e: any) {
      return next(new Error("unauthorized" + e.message.toString()))
    }

    next()
  })

  registerSocketEvents(io)

  return io
}
