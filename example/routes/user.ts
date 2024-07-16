import { Request, Response } from "express";

export function GET(req: Request, res: Response) {
  console.log("TEST");
  res.send("GET User");
}

export function POST(req: Request, res: Response) {
  const { username, email, password } = req.body;
  res.status(200).json({ message: "New user", username });
}

export function DELETE(req: Request, res: Response) {
  res.send("DELETE User");
}
