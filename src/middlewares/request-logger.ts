import { NextFunction, Request, Response } from "express";

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = process.hrtime();
  res.on("finish", () => {
    const [seconds, nanoseconds] = process.hrtime(start);
    const durationInMilliseconds = (seconds * 1000 + nanoseconds / 1e6).toFixed(
      0
    );
    const statusCode = res.statusCode;
    console.log(
      `[${req.method}]  ${req.originalUrl}  ${statusCode}  ${durationInMilliseconds}ms`
    );
  });

  next();
};
