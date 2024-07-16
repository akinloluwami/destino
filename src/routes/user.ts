import { Request, Response } from "express";

export function GET(req: Request, res: Response) {
  res.send("GET User");
}

export function POST(req: Request, res: Response) {
  res.send("POST User");
}

export function DELETE(req: Request, res: Response) {
  res.send("DELETE User");
}
