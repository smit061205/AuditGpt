const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const routes = require("./routes");
const { errorHandler, notFoundHandler } = require("./utils/error-handler");

const app = express();

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow any localhost port or vercel deployment for this demo
      if (
        !origin ||
        origin.startsWith("http://localhost:") ||
        origin.includes("vercel.app")
      ) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    credentials: true,
  }),
);

app.use(morgan("combined"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/", routes);

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
