import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 443;

const __dirname = path.resolve();

app.use(
  cors({
    origin: ["http://localhost:5173", "http://192.168.56.1:5173", "http://127.0.0.1:5173", "http://localhost:3000", "http://192.168.56.1:443", "http://127.0.0.1:443", "http://localhost:4173", "http://52.71.153.48:3000", "http://52.71.153.48:5173", "http://0.0.0.0:5173", "http://192.168.1.39:5173", "http://172.26.48.1:5173"],
    credentials: true, // allow frontend to send cookies
  })
);

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../frontend/dist")));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});
