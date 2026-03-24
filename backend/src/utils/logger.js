const config = require("../config/env");

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const currentLevel = LOG_LEVELS[config.LOG_LEVEL] ?? LOG_LEVELS.info;

function formatLog(level, module, message, context) {
  const timestamp = new Date().toISOString();
  const ctx = context ? ` | ${JSON.stringify(context)}` : "";
  return `[${timestamp}] [${level.toUpperCase()}] [${module}] ${message}${ctx}`;
}

function createLogger(moduleName) {
  return {
    debug: (msg, ctx) => {
      if (currentLevel <= LOG_LEVELS.debug)
        console.debug(formatLog("debug", moduleName, msg, ctx));
    },
    info: (msg, ctx) => {
      if (currentLevel <= LOG_LEVELS.info)
        console.info(formatLog("info", moduleName, msg, ctx));
    },
    warn: (msg, ctx) => {
      if (currentLevel <= LOG_LEVELS.warn)
        console.warn(formatLog("warn", moduleName, msg, ctx));
    },
    error: (msg, ctx) => {
      if (currentLevel <= LOG_LEVELS.error)
        console.error(formatLog("error", moduleName, msg, ctx));
    },
  };
}

module.exports = { createLogger };
