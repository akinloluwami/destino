import { Config } from "../index";

export default {
  port: 4242,
  cors: {
    options: {
      origin: "*",
    },
  },
  enableJsonParser: true,
  enableUrlencoded: true,
} satisfies Config;
