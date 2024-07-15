import express, { Express, Router } from "express";
import fs from "fs";
import path from "path";

function createServer(routesDir: string = "routes"): Express {
  const app = express();

  function loadMiddlewares(router: Router, dirPath: string) {
    const middlewarePath = path.join(dirPath, "_middleware");
    const jsPath = `${middlewarePath}.js`;
    const tsPath = `${middlewarePath}.ts`;

    if (fs.existsSync(jsPath) || fs.existsSync(tsPath)) {
      const middlewareModule = require(
        path.join(__dirname, fs.existsSync(jsPath) ? jsPath : tsPath)
      );
      const middleware =
        middlewareModule.middleware || middlewareModule.default;
      if (typeof middleware === "function") {
        router.use(middleware);
      }
    }
  }

  function loadRoutes(router: Router, dirPath: string) {
    const files = fs.readdirSync(dirPath);

    loadMiddlewares(router, dirPath);

    files.forEach((file) => {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        const subRouter = express.Router();
        loadRoutes(subRouter, filePath);
        router.use(
          "/" + path.relative(routesDir, filePath).replace(/\\/g, "/"),
          subRouter
        );
      } else if (
        (file.endsWith(".js") || file.endsWith(".ts")) &&
        !file.startsWith("_middleware")
      ) {
        let routePath =
          "/" +
          path
            .relative(routesDir, filePath)
            .replace(/\.js$|\.ts$/, "")
            .replace(/\\/g, "/");

        routePath = routePath.replace(/\[(\w+)\]/g, ":$1");

        const routeModule = require(path.join(__dirname, filePath));

        if (routeModule.GET) router.get(routePath, routeModule.GET);
        if (routeModule.POST) router.post(routePath, routeModule.POST);
        if (routeModule.PUT) router.put(routePath, routeModule.PUT);
        if (routeModule.DELETE) router.delete(routePath, routeModule.DELETE);
        if (routeModule.PATCH) router.patch(routePath, routeModule.PATCH);
      }
    });
  }

  loadRoutes(app, routesDir);

  return app;
}

export default createServer;
