export interface Config {
  port?: number;
  enableJsonParser?: boolean;
  enableUrlencoded?: boolean;
  serveStatic?: {
    folder: string;
    route?: string;
  }[];
}
