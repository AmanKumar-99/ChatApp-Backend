import { Server } from "socket.io"
import http from "http"
import { registerSocketEvents } from "../services/event/socketEvent.js"

// Initialize Socket.io server and register events
export default function initSocket(server: http.Server) {
  const io = new Server(server, {
    cors: { origin: "*" }, // configure allowed origins
  })

  registerSocketEvents(io)

  return io
}
