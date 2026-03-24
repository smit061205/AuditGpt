const express = require("express");
const path = require("path");
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

const fs = require('fs');
// Serve frontend static files in production if they exist
const frontendPath = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendPath)) {
  app.use(express.static(frontendPath));

  app.get('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('AuditGPT API is running. If you are looking for the UI, visit the frontend deployment.');
  });
}

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
