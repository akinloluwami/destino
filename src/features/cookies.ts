import { Request, Response } from "express";

interface CookieOptions {
  path?: string;
  expires?: Date;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

function parseCookies(req: Request): Record<string, string> {
  const cookies = req.headers.cookie || "";
  return cookies.split(";").reduce(
    (acc, cookie) => {
      const [name, ...rest] = cookie.split("=");
      const value = rest.join("=").trim();
      acc[name.trim()] = value;
      return acc;
    },
    {} as Record<string, string>
  );
}

function setCookie(
  res: Response,
  name: string,
  value: string,
  options: CookieOptions = {}
): void {
  const cookieOptions = {
    ...options,
    path: options.path || "/",
  };
  res.setHeader(
    "Set-Cookie",
    `${name}=${value}; ${formatOptions(cookieOptions)}`
  );
}

function deleteCookie(
  res: Response,
  name: string,
  options: CookieOptions = {}
): void {
  setCookie(res, name, "", { ...options, expires: new Date(0) });
}

function formatOptions(options: CookieOptions): string {
  return Object.entries(options)
    .map(([key, value]) => {
      if (key === "sameSite") {
        return `SameSite=${value}`;
      }
      return `${key}=${value}`;
    })
    .join("; ");
}

export function cookies(req: Request, res: Response) {
  return {
    get: (name: string) => parseCookies(req)[name],
    set: (name: string, value: string, options: CookieOptions = {}) =>
      setCookie(res, name, value, options),
    delete: (name: string, options: CookieOptions = {}) =>
      deleteCookie(res, name, options),
  };
}
