require("dotenv").config();

const config = {
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  DEMO_MODE: process.env.DEMO_MODE === "true",
  CACHE_ENABLED: process.env.CACHE_ENABLED !== "false",
};

// Optional warning if API key is missing
if (!config.GROQ_API_KEY) {
  console.warn(
    "⚠️ GROQ_API_KEY is not set. AI features will use fallback rule-based analysis.",
  );
}

if (!process.env.LOG_LEVEL) {
  console.warn('ℹ️  LOG_LEVEL not set, defaulting to "info"');
}

module.exports = config;
