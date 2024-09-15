export interface Config {
  port?: number;
  enableJsonParser?: boolean;
  enableUrlencoded?: boolean;
  serveStatic?: {
    folder: string;
    route?: string;
  }[];
  cors?: CorsConfig | CorsConfig[];
  rateLimit?: RateLimitConfig | RateLimitConfig[];
  enableCookieParser?: boolean;
}

interface CorsConfig {
  route?: string;
  options: {
    origin?: string | string[];
    methods?: string | string[];
    allowedHeaders?: string | string[];
    exposedHeaders?: string | string[];
    credentials?: boolean;
    maxAge?: number;
  };
}

export interface RateLimitConfig {
  route?: string;
  options: {
    duration: string;
    max: number;
    message?: string;
    headers?: boolean;
  };
}
