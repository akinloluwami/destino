import { Config } from "../index";

export default {
  rateLimit: {
    route: "/*",
    options: {
      duration: "2m",
      max: 5,
      message: "Too many requests, please try again later.",
      headers: true,
    },
  },
} satisfies Config;
