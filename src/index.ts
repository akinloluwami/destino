import express, { Express } from "express";
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

  const loadRoutes = (dir: string) => {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        const indexFilePath = path.join(filePath, "index.ts");
        const indexJsFilePath = path.join(filePath, "index.js");

        if (fs.existsSync(indexFilePath)) {
          registerRoute("/", indexFilePath, path.relative(routesDir, filePath));
        } else if (fs.existsSync(indexJsFilePath)) {
          registerRoute(
            "/",
            indexJsFilePath,
            path.relative(routesDir, filePath)
          );
        } else {
          loadRoutes(filePath);
        }
      } else {
        registerRouteFromFile(filePath);
      }
    });
  };

  const registerRouteFromFile = (filePath: string) => {
    const extname = path.extname(filePath);
    if (extname === ".ts" || extname === ".js") {
      const route = require(filePath);
      let routePath = path.relative(routesDir, filePath);
      routePath = routePath.replace(/\.[^/.]+$/, "");
      routePath = routePath.replace(/\\/g, "/");
      routePath = `/${routePath}`;

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

  const registerRoute = (
    routePath: string,
    filePath: string,
    parentDir: string
  ) => {
    const route = require(filePath);
    routePath = path.join("/", parentDir).replace(/\\/g, "/");
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
  };

  const callerDir = path.dirname(require.main!.filename);
  const routesDir = path.join(callerDir, "routes");

  loadRoutes(routesDir);

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
};
