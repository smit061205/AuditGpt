const { HTTP_STATUS } = require("../config/constants");
const { createLogger } = require("./logger");
const logger = createLogger("ErrorHandler");

/**
 * Global error handling middleware
 */
function errorHandler(err, req, res, next) {
  logger.error("Unhandled error", { message: err.message, stack: err.stack });

  const status = err.status || HTTP_STATUS.INTERNAL_ERROR;
  const message = err.message || "An unexpected error occurred";

  res.status(status).json({
    success: false,
    error: message,
    suggestion: "Try: Satyam, Reliance, TCS, HDFC Bank, Infosys",
  });
}

/**
 * 404 Not Found handler
 */
function notFoundHandler(req, res) {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    success: false,
    error: `Route ${req.path} not found`,
  });
}

module.exports = { errorHandler, notFoundHandler };
