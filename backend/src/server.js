const app = require("./app");
const config = require("./config/env");
const { createLogger } = require("./utils/logger");

const logger = createLogger("Server");

const PORT = config.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 AuditGPT Backend running on http://localhost:${PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  logger.info(
    `Groq AI: ${config.GROQ_API_KEY ? "✅ Configured" : "⚠️  Not configured (using rule-based fallback)"}`,
  );
});

// Graceful shutdown
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT received. Shutting down gracefully...");
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection", { reason: String(reason) });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception", { error: error.message });
  process.exit(1);
});

module.exports = server;
