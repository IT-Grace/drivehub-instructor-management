import dotenv from "dotenv";
dotenv.config();

import express, { NextFunction, type Request, Response } from "express";
import { registerRoutes } from "./routes";
// Import production utilities directly
import fs from "fs";
import path from "path";

function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

function serveStatic(app: any) {
  const distPath = path.resolve(process.cwd(), "dist", "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));
  app.use("*", (_req: any, res: any) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// Dynamic setup for Vite (only in development)
async function setupVite(app: any, server: any) {
  // Skip Vite setup in Docker containers or when not in development
  if (process.env.NODE_ENV !== "development" || process.env.DOCKER_ENV) {
    return;
  }

  // Check if we're in a containerized environment
  try {
    const fs = await import("fs");
    if (fs.existsSync("/.dockerenv")) {
      console.log("🐳 Detected Docker environment, skipping Vite setup");
      return;
    }
  } catch (error) {
    // Ignore file system check errors
  }

  try {
    const viteModule = await import("./vite.js");
    await viteModule.setupVite(app, server);
  } catch (error) {
    console.log("🔧 Vite setup failed, continuing with static file serving");
    // Don't throw the error, just log it and continue
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    // Check if we're in a containerized environment
    let isDockerEnv = false;
    try {
      if (fs.existsSync("/.dockerenv")) {
        isDockerEnv = true;
      }
    } catch (error) {
      // Ignore file system check errors
    }

    if (isDockerEnv) {
      console.log(
        "🐳 Docker environment detected, serving static files instead of Vite"
      );
      serveStatic(app);
    } else {
      await setupVite(app, server);
    }
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);

  // Determine host binding:
  // - Docker environment: always bind to 0.0.0.0 for external access
  // - Production: bind to 0.0.0.0 for external access
  // - Local development: bind to localhost for security
  let host = "localhost";
  try {
    const fs = await import("fs");
    if (fs.existsSync("/.dockerenv") || process.env.NODE_ENV === "production") {
      host = "0.0.0.0";
    }
  } catch (error) {
    // If we can't check for Docker, fall back to NODE_ENV check
    if (process.env.NODE_ENV === "production") {
      host = "0.0.0.0";
    }
  }

  server.listen(port, host, () => {
    log(`serving on port ${port} (${host})`);
  });
})();
