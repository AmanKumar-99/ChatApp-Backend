import mongoose from "mongoose"
import dotenv from "dotenv"

dotenv.config()

const MONGODB_URL = process.env.MONGODB_URL

if (!MONGODB_URL) {
  throw new Error("MONGODB_URL environment variable is not defined")
}

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    } as mongoose.ConnectOptions)

    mongoose.connection.once("open", () => {
      console.log("Connected to MongoDB")
    })
    console.log("MongoDB connected successfully...")
  } catch (error) {
    console.error("MongoDB connection failed:", error)
  }
}
