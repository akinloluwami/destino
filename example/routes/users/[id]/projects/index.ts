import { Request, Response } from "express";

export const GET = (req: Request, res: Response) => {
  const userId = req.params.id;
  res.send(`GET User ${userId} has projects`);
};
