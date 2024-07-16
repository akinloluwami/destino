import express, { Express, Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

export const createServer = (port: number) => {
  const app: Express = express();

  const methodMap: { [key: string]: Function } = {
    GET: app.get.bind(app),
    POST: app.post.bind(app),
    PUT: app.put.bind(app),
    DELETE: app.delete.bind(app),
  };

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

      console.log(`Registering route: ${routePath}`);
      Object.keys(route).forEach((method) => {
        const handler = route[method];
        const expressMethod = methodMap[method.toUpperCase()];
        if (expressMethod) {
          expressMethod(routePath, handler);
        } else {
          console.warn(`Unknown method ${method} in file ${filePath}`);
        }
      });
    }
  };

  const registerMiddlewareFromFile = (filePath: string) => {
    const extname = path.extname(filePath);
    if (extname === ".ts" || extname === ".js") {
      const middleware = require(filePath).default;
      console.log(`Registering middleware: ${filePath}`);
      app.use(middleware);
    }
  };

  const callerDir = path.dirname(require.main!.filename);
  const routesDir = path.join(callerDir, "routes");

  applyMiddlewares(routesDir);
  loadRoutes(routesDir);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};
