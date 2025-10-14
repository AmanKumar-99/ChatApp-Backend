import type { NextFunction, Request, Response } from "express"
import {
  getAllUsersData,
  getUserById,
} from "../../services/userService/index.js"

export const getUserDataController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return getAllUsersData(req, res, next).catch((err) => next(err))
}

export const getUserByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return getUserById(req, res, next).catch((err) => next(err))
}
