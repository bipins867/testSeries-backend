import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { config } from "./config";
import quizRoutes from "./routes/quizRoutes";
import { quizStore } from "./services/storeService";

// ──────────────────────────────────────────────
// Express app setup
// ──────────────────────────────────────────────

const app = express();

// Middleware
app.use(cors({
  origin: "*"}));
app.use(express.json({ limit: "1mb" }));

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// ──────────────────────────────────────────────
// Routes
// ──────────────────────────────────────────────

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    quizzesInMemory: quizStore.size,
    timestamp: new Date().toISOString(),
  });
});

// Quiz API
app.use("/", quizRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(`[Error] ${err.message}`);
  if (config.nodeEnv === "development") {
    console.error(err.stack);
  }

  res.status(500).json({
    error: "Internal server error",
    ...(config.nodeEnv === "development" && { message: err.message }),
  });
});

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────

app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   UPSC Quiz Backend — Running               ║
║   Port:  ${String(config.port).padEnd(36)}║
║   Env:   ${config.nodeEnv.padEnd(36)}║
║   Model: ${config.openai.model.padEnd(36)}║
╚══════════════════════════════════════════════╝
  `);
});

// Periodic cleanup of expired quizzes (every 10 minutes)
setInterval(() => {
  quizStore.purgeExpired();
}, 10 * 60 * 1000);

export default app;
