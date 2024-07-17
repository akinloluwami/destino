export interface Config {
  port?: number;
  enableJsonParser?: boolean;
  enableUrlencoded?: boolean;
  serveStatic?: {
    folder: string;
    route?: string;
  }[];
  cors?: CorsConfig | CorsConfig[];
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
