import http from "http"
import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import { connectDB } from "./config/db.js"
import authRoute from "./routes/authRoute/index.js"
import chatRoute from "./routes/chatRoute/index.js"
import cookieParser from "cookie-parser"
import initSocket from "./config/socketio.js"

dotenv.config()

const app = express()
const server = http.createServer(app)

app.use(express.json())
app.use(cookieParser())
app.use(cors({ origin: "http://localhost:8080", credentials: true })) // Change this for production

// Connect to Database
connectDB()

// Initialize Socket.io
initSocket(server)

// Other routes and middleware can be added here
app.use("/api/auth", authRoute)
app.use("/api/chat", chatRoute)

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`)
})
