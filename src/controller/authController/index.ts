import {
  registerService,
  signInService,
} from "../../services/authService/index.js"
import { Request, Response, NextFunction } from "express"

export const signInController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return signInService(req, res, next).catch((err) => next(err))
}

export const registerController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return registerService(req, res, next).catch((err) => next(err))
}
