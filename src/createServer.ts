import express, { Express } from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { Config } from "./config.type";
import { applyRateLimit } from "./middlewares/rate-limit";

export const createServer = () => {
  const app: Express = express();

  let config: Config;
  let routeCount = 0;

  const defaultConfig: Config = {
    enableJsonParser: false,
    enableUrlencoded: false,
    serveStatic: undefined,
    cors: undefined,
    port: 6969,
    rateLimit: undefined,
  };

  const jsConfigPath = path.resolve(process.cwd(), "destiny.config.js");
  const tsConfigPath = path.resolve(process.cwd(), "destiny.config.ts");

  try {
    let configPath;
    if (fs.existsSync(jsConfigPath)) {
      configPath = jsConfigPath;
    } else if (fs.existsSync(tsConfigPath)) {
      require("ts-node").register();
      configPath = tsConfigPath;
    }

    if (configPath) {
      console.log("Loading config...⌛");
      config = { ...defaultConfig, ...require(configPath) };
      console.log("Config loaded. ✅");
    } else {
      console.log("Config file is not present. Using default. ☑️");
      config = defaultConfig;
    }
  } catch (error) {
    console.error(
      "Error loading config file. Using default configuration.",
      error
    );
    config = defaultConfig;
  }

  if (config.enableJsonParser) {
    app.use(express.json());
  }

  if (config.enableUrlencoded) {
    app.use(express.urlencoded({ extended: true }));
  }

  applyRateLimit(app, config);

  if (config.serveStatic && Array.isArray(config.serveStatic)) {
    config.serveStatic.forEach((staticConfig) => {
      const folder = staticConfig.folder;
      const route = staticConfig.route || "/";
      app.use(route, express.static(path.resolve(folder)));
    });
  }

  if (config.cors) {
    if (Array.isArray(config.cors)) {
      config.cors.forEach((corsConfig) => {
        app.use(corsConfig.route!, cors(corsConfig.options));
      });
    } else {
      app.use(cors(config.cors.options));
    }
  }

  const methodMap: { [key: string]: Function } = {
    GET: app.get.bind(app),
    POST: app.post.bind(app),
    PUT: app.put.bind(app),
    DELETE: app.delete.bind(app),
  };

  const registeredMiddlewarePaths = new Set<string>();

  const applyMiddlewares = (dir: string) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        applyMiddlewares(filePath);
      } else {
        if (isMiddlewareFile(file)) {
          registerMiddlewareFromFile(filePath);
        }
      }
    });
  };

  const loadRoutes = (dir: string) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        applyMiddlewares(filePath);
        loadRoutes(filePath);
      } else {
        if (!isMiddlewareFile(file)) {
          registerRouteFromFile(filePath);
        }
      }
    });
  };

  const isMiddlewareFile = (file: string): boolean => {
    return (
      file.startsWith("_middleware") &&
      (file.endsWith(".ts") || file.endsWith(".js"))
    );
  };

  const registerRouteFromFile = (filePath: string) => {
    const extname = path.extname(filePath);
    if (extname === ".ts" || extname === ".js") {
      const route = require(filePath);
      let routePath = path.relative(routesDir, filePath);
      routePath = routePath.replace(/\.[^/.]+$/, "");
      routePath = routePath.replace(/\\/g, "/");

      if (path.basename(routePath) === "index") {
        routePath = path.dirname(routePath);
      }

      routePath = `/${routePath}`.replace(/\/index$/, "");
      routePath = routePath.replace(/\\/g, "/");

      routePath = routePath.replace(/\[([^[\]]+)\]/g, ":$1");

      Object.keys(route).forEach((method) => {
        const handler = route[method];
        const expressMethod = methodMap[method.toUpperCase()];
        if (expressMethod) {
          expressMethod(routePath, handler);
          routeCount++;
        } else {
          console.warn(`Unknown method ${method} in file ${filePath}`);
        }
      });
    }
  };

  const registerMiddlewareFromFile = (filePath: string) => {
    const extname = path.extname(filePath);
    if (extname === ".ts" || extname === ".js") {
      if (!registeredMiddlewarePaths.has(filePath)) {
        const middleware = require(filePath).default;
        const relativePath = path.relative(routesDir, filePath);
        let middlewareBasePath = path.dirname(relativePath).replace(/\\/g, "/");

        middlewareBasePath = `/${middlewareBasePath}`;

        app.use(middlewareBasePath, middleware);
        registeredMiddlewarePaths.add(filePath);
      }
    }
  };

  const callerDir = path.dirname(require.main!.filename);
  const routesDir = path.join(callerDir, "routes");

  applyMiddlewares(routesDir);
  console.log("Registering routes...⌛");
  loadRoutes(routesDir);
  console.log(`${routeCount} routes registered. ✅`);

  const port = config.port;
  app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
  });
};
