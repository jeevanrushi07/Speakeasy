import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 443;

const currentFile = fileURLToPath(import.meta.url);
const backendSourceDirectory = path.dirname(currentFile);
const frontendDistDirectory = path.resolve(backendSourceDirectory, "../../frontend/dist");

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://192.168.56.1:5173",
  "http://127.0.0.1:5173",
  "http://localhost:3000",
  "http://192.168.56.1:443",
  "http://127.0.0.1:443",
  "http://localhost:4173",
  "http://52.71.153.48:3000",
  "http://52.71.153.48:5173",
  "http://0.0.0.0:5173",
  "http://192.168.1.39:5173",
  "http://172.26.48.1:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

app.get("/api/test", (req, res) => {
  res.json({
    jwtSecretExists: !!process.env.JWT_SECRET_KEY,
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
  });
});

// Serve static files from the React app
app.use(express.static(frontendDistDirectory));

if (process.env.NODE_ENV === "production") {
  app.get("*", (req, res) => {
    res.sendFile(path.join(frontendDistDirectory, "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
