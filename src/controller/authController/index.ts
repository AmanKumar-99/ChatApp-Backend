import {
  logout,
  registerService,
  signInService,
  verifyUserData,
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

export const verifyUserDataController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return verifyUserData(req, res, next).catch((err) => next(err))
}

export const logoutController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    logout(req, res)
  } catch (err) {
    next(err)
  }
}
