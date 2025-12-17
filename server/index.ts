import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import cors from "cors";
import { serverConfig, devLog, prodLog } from "./config";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Enable CORS with environment-specific origins
app.use(cors({
  origin: serverConfig.corsOrigin,
  credentials: true,
}));

devLog('CORS enabled for origins:', serverConfig.corsOrigin);

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
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use configuration-based port and host
  server.listen({
    port: Number(serverConfig.port),
    host: serverConfig.host,
  }, () => {
    const mode = serverConfig.isDevelopment ? 'development' : 'production';
    prodLog(`Server attempting to listen on ${serverConfig.host}:${serverConfig.port} in ${mode} mode.`);
    prodLog(`serving on ${serverConfig.host}:${serverConfig.port}`);
    
    if (serverConfig.isDevelopment) {
      devLog('Development mode enabled - detailed logging active');
      devLog('Frontend should be available at: http://localhost:5173');
    }
  });
})();
