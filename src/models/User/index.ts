import { Schema, model, Document } from "mongoose"
import bcrypt from "bcrypt"

export interface IUser extends Document {
  name: string
  username: string
  email: string
  password: string
  comparedPassword: (password: string) => Promise<boolean>
  profilePicUrl?: string
  status: "online" | "offline" | "away"
  lastSeen: Date
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    profilePicUrl: { type: String },
    status: {
      type: String,
      enum: ["online", "offline", "away"],
      default: "offline",
    },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true, versionKey: false }
)

// Pre-save middleware to hash the password before saving if it was modified
UserSchema.pre("save", async function (next) {
  const user = this as IUser
  // Only hash the password if it has been modified (or is new)
  if (!user.isModified("password")) {
    return next()
  }
  try {
    // Number of salt rounds for hashing (higher = more secure, slower)
    const saltRounds = 10
    const salt = await bcrypt.genSalt(saltRounds)
    const hashedPassword = await bcrypt.hash(user.password, salt)
    user.password = hashedPassword
    next()
  } catch (error) {
    next(error as Error)
  }
})

// Instance method to compare a plain password with the hashed password
UserSchema.methods.comparedPassword = async function (
  password: string
): Promise<boolean> {
  return bcrypt.compare(password, this.password)
}

export const User = model<IUser>("User", UserSchema)
