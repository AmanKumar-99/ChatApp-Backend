import { Request, Response, NextFunction } from "express"
import { User } from "../../models/User/index.js"

export const getAllUsersData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 5
  const search = (req.query.search as string) || ""

  /**
   * TODO: Add caching logic here
   */

  // Implement pagination and search logic here
  const query: any = {}

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ]
  }

  let users

  users = await User.find(query)
    .skip((page - 1) * limit)
    .limit(limit)
    .select("-password") // Exclude password field

  const total = await User.countDocuments(query)

  res.json({
    users,
    page,
    totalPages: Math.ceil(total / limit),
    totalUsers: total, // Not sure are we going to need this
  })
}

export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.params.userId
  return await User.findById(userId)
    .select("-password") // Exclude password field
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }
      res.json(user)
    })
    .catch((err) => next(err))
}
