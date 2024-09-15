import colors from "ansi-colors";
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

    const methodColors: { [key: string]: (text: string) => string } = {
      GET: colors.bgBlue.white,
      POST: colors.bgGreen.white,
      PUT: colors.bgYellow.white,
      DELETE: colors.bgRed.white,
    };

    const methodStyler = methodColors[req.method] || colors.bgCyan.white;

    const methodColor = methodStyler(req.method);
    const statusColor =
      statusCode >= 500
        ? colors.redBright.bold(statusCode.toString())
        : statusCode >= 400
        ? colors.red.bold(statusCode.toString())
        : colors.green.bold(statusCode.toString());
    const timeColor = colors.magenta(`${durationInMilliseconds}ms`);

    console.log(
      `${methodColor}  ${req.originalUrl}  ${statusColor}  ${timeColor}`
    );
  });

  next();
};
