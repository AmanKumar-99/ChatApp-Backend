import http from "http"
import cors from "cors"
import dotenv from "dotenv"
import express from "express"
import { Server } from "socket.io"
import { connectDB } from "./DB/index.js"
import authRoute from "./routes/authRoute/index.js"
import cookieParser from "cookie-parser"

dotenv.config()

const app = express()
const server = http.createServer(app)
const io = new Server(server)

app.use(express.json())
app.use(cookieParser())
app.use(cors({ origin: "http://localhost:8080", credentials: true })) // Change this for production

// Connect to Database
connectDB()

// Other routes and middleware can be added here
app.use("/api/auth", authRoute)

// Socket.io connection
io.on("connection", (socket) => {
  console.log("A user connected", socket.id)
})

const PORT = process.env.PORT || 3000

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}...`)
})
