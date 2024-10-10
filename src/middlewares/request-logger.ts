import colors from "ansi-colors";
import { NextFunction, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { ensureDirSync } from "fs-extra"; // To ensure the directory is created

export const requestLogger = (configFilePath: string) => {
  const configDir = path.dirname(configFilePath);
  const logDir = path.join(configDir, ".destino", "logs");

  ensureDirSync(logDir);

  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime();

    // Store the original send method
    const originalSend = res.send;

    let responseBody: any;

    // Override res.send to capture the response body
    res.send = function (body) {
      responseBody = body; // Capture the response body here
      return originalSend.call(this, body); // Call the original send method
    };

    res.on("finish", () => {
      const [seconds, nanoseconds] = process.hrtime(start);
      const durationInMilliseconds = (
        seconds * 1000 +
        nanoseconds / 1e6
      ).toFixed(0);
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

      const logMessage = `${methodColor}  ${req.originalUrl}  ${statusColor}  ${timeColor}`;

      console.log(logMessage);

      // Log request and response
      const logEntry = {
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        duration: Number(durationInMilliseconds),
        requestBody: req.body,
        responseBody: responseBody, // Now capturing the response body
        timestamp: new Date().toISOString(),
      };

      const logFilePath = path.join(
        logDir,
        `${new Date().toISOString().slice(0, 10)}.log`
      );
      fs.appendFileSync(logFilePath, JSON.stringify(logEntry, null, 2) + "\n");
    });

    next();
  };
};
