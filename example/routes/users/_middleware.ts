import { Request, Response, NextFunction } from "express";

export default function Middleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log("Middleware executed for user route");
  next();
}
