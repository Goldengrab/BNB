import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.js";
import { initDb } from "./config/initDb.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS — restrict to ALLOWED_ORIGIN in production
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = process.env.ALLOWED_ORIGIN;
    const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    // Allow all in local dev; restrict in production if ALLOWED_ORIGIN is set
    if (!isProd || !allowed || !origin || origin === allowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS: Origin not allowed'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Configure body parsers with limit for base64 avatar uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Serve API routes
app.use("/api", apiRoutes);

// Serve the frontend static files from root directory
app.use(express.static("."));

// Fallback to index.html for unknown routes to maintain SPA navigation
app.get("*", (req, res, next) => {
  // If request is for an API endpoint, do not serve index.html (let Express return 404)
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile("index.html", { root: "." });
});

// Initialize database and start listening
try {
  await initDb();
} catch (error) {
  console.error("Critical: Failed to launch database schemas:", error);
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`AEQUITAS CORE BACKEND RUNNING`);
    console.log(`Local Access: http://localhost:${PORT}`);
    console.log(`==================================================`);
  });
}

export default app;
