import rateLimit from "express-rate-limit";
import { Config, RateLimitConfig } from "../config.type";
import { Express } from "express";
import { readableTime } from "../helpers/readable-time";

function parseDuration(duration: string): number {
  const match = duration.match(/(\d+)([smhd])/);
  if (!match) {
    throw new Error("Invalid duration format");
  }
  const [, amount, unit] = match;
  return readableTime(parseInt(amount, 10), unit as "s" | "m" | "h" | "d");
}

export function applyRateLimit(app: Express, config: Config) {
  if (!config.rateLimit) return;

  const rateLimitConfigs = Array.isArray(config.rateLimit)
    ? config.rateLimit
    : [config.rateLimit];

  rateLimitConfigs.forEach((rlConfig: RateLimitConfig) => {
    const windowMs = parseDuration(rlConfig.options.duration);

    const limiter = rateLimit({
      windowMs,
      max: rlConfig.options.max,
      message: rlConfig.options.message,
      headers: rlConfig.options.headers,
    });

    if (rlConfig.route) {
      app.use(rlConfig.route, limiter);
    } else {
      app.use(limiter);
    }
  });
}
