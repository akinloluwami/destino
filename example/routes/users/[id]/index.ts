import { Request, Response } from "express";

export const GET = (req: Request, res: Response) => {
  const userId = req.params.id;
  res.send(`GET User ${userId}`);
};

export const POST = (req: Request, res: Response) => {
  res.send("POST User");
};
