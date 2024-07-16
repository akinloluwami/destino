import { Request, Response } from "express";

export const GET = (req: Request, res: Response) => {
  const id = req.params.id;
  res.send(`GET project = ${id}`);
};
