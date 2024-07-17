import { Config } from "../index";

export default {
  port: 4242,
  enableJsonParser: true,
  serveStatic: [{ folder: "assets", route: "/files" }],
} satisfies Config;
