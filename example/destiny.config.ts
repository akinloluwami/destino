import { Config } from "../index";

export default {
  port: 4242,
  enableJsonParser: true,
  enableUrlencoded: true,
  serveStatic: [{ folder: "assets", route: "/files" }],
  cors: {
    options: {
      origin: "*",
    },
  },
} satisfies Config;
