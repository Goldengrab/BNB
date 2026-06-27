import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRoutes from "./routes/api.js";
import { initDb } from "./config/initDb.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());

// Configure body parsers with limit for base64 avatar uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

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
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`AEQUITAS CORE BACKEND RUNNING`);
      console.log(`Local Access: http://localhost:${PORT}`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error("Critical: Failed to launch database and backend server:", error);
    process.exit(1);
  }
}

startServer();
