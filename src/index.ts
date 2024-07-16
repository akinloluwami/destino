import express, { Request, Response, NextFunction } from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3344;

const loadRoutes = (dir: string) => {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const route = require(filePath);

    const routePath = "/" + file.replace(/\.[^/.]+$/, "");

    Object.keys(route).forEach((method) => {
      const handler = route[method];

      switch (method.toUpperCase()) {
        case "GET":
          app.get(routePath, handler);
          break;
        case "POST":
          app.post(routePath, handler);
          break;
        case "PUT":
          app.put(routePath, handler);
          break;
        case "DELETE":
          app.delete(routePath, handler);
          break;
        default:
          console.warn(`Unknown method ${method} in file ${file}`);
      }
    });
  });
};

const routesDir = path.join(__dirname, "routes");
loadRoutes(routesDir);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
