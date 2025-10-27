import { connectDB } from "./config/db.js"

import connectServer from "./config/server.js"

// Connecting Server
connectServer()

// Connect to Database
connectDB()
