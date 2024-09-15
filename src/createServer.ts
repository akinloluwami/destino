import express, { Express } from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import { Config } from "./config.type";
import { applyRateLimit } from "./middlewares/rate-limit";
import { requestLogger } from "./middlewares/request-logger";

export const createServer = () => {
  const app: Express = express();

  let routeCount = 0;
  let middlewareCount = 0;

  let config: Config;

  const defaultConfig: Config = {
    enableJsonParser: true,
    enableUrlencoded: false,
    serveStatic: undefined,
    cors: undefined,
    port: 6969,
    rateLimit: undefined,
  };

  const jsConfigPath = path.resolve(process.cwd(), "destino.config.js");
  const tsConfigPath = path.resolve(process.cwd(), "destino.config.ts");

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
      const loadedConfig = require(configPath);

      if (loadedConfig.default) {
        config = loadedConfig.default;
      } else {
        config = loadedConfig;
      }

      config = { ...defaultConfig, ...config };

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
    console.log("Current Config:", config);
  }

  app.use(requestLogger);

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

  const registeredPaths = new Set<string>();

  const applyMiddlewares = (dir: string, middlewares: string[] = []) => {
    const files = fs.readdirSync(dir);

    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        applyMiddlewares(filePath, middlewares);
      } else if (isMiddlewareFile(file)) {
        middlewares.push(filePath);
      }
    });

    return middlewares;
  };

  const loadRoutes = (dir: string) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
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

      if (!registeredPaths.has(routePath)) {
        Object.keys(route).forEach((method) => {
          const handler = route[method];

          //@ts-ignore
          app[method.toLowerCase()](routePath, handler);
          routeCount++;
          console.log(
            `Registered route: [${method.toUpperCase()}] ${routePath}`
          );
        });
        registeredPaths.add(routePath);
      }
    }
  };

  const registerMiddlewareFromFile = (filePath: string) => {
    const extname = path.extname(filePath);
    if (extname === ".ts" || extname === ".js") {
      const middleware = require(filePath).default;
      const relativePath = path.relative(routesDir, filePath);
      let middlewareBasePath = path.dirname(relativePath).replace(/\\/g, "/");

      if (middlewareBasePath === ".") {
        middlewareBasePath = "/";
      } else {
        middlewareBasePath = `/${middlewareBasePath}`;
      }

      app.use(middlewareBasePath, middleware);
      middlewareCount++;
      console.log(`Registered middleware: ${middlewareBasePath}`);
      registeredPaths.add(filePath);
    }
  };

  const registerMiddlewaresInOrder = (middlewares: string[]) => {
    const sortedMiddlewares = middlewares.sort((a, b) => {
      const aDepth = a.split(path.sep).length;
      const bDepth = b.split(path.sep).length;
      return aDepth - bDepth;
    });

    sortedMiddlewares.forEach((filePath) => {
      registerMiddlewareFromFile(filePath);
    });
  };

  const callerDir = path.dirname(require.main!.filename);
  const routesDir = path.join(callerDir, "routes");

  console.log("Applying middlewares...⌛");
  const middlewares = applyMiddlewares(routesDir);
  registerMiddlewaresInOrder(middlewares);
  console.log(`${middlewareCount} middlewares registered. ✅`);

  console.log("Registering routes...⌛");
  loadRoutes(routesDir);
  console.log(`${routeCount} routes registered. ✅`);

  const port = config.port;
  app.listen(port, () => {
    console.log(`Server is running on port http://localhost:${port}`);
  });
};
