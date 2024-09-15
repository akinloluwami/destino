import { NextFunction, Request, Response } from "express";

export function cookieParser(req: Request, res: Response, next: NextFunction) {
  const cookies = req.headers.cookie || "";
  req.cookies = cookies.split(";").reduce(
    (acc, cookie) => {
      const [name, ...rest] = cookie.split("=");
      const value = rest.join("=").trim();
      acc[name.trim()] = value;
      return acc;
    },
    {} as Record<string, string>
  );

  next();
}
