import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("telemetry.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    latitude REAL,
    longitude REAL,
    vibration_variance REAL,
    status TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    github_id TEXT UNIQUE,
    username TEXT,
    avatar_url TEXT,
    access_token TEXT
  )
`);

const app = express();
const httpServer = createServer(app);

// Enable CORS so the Frontend can talk to this Backend
app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: { origin: "*" },
});

let latestGPS = { lat: 0, lng: 0 };

app.post("/api/gps", (req, res) => {
  const { lat, lng } = req.body;
  latestGPS = { lat, lng };
  res.json({ status: "ok" });
});

app.post("/api/telemetry", (req, res) => {
  const { vibration_variance, session_id } = req.body;
  const status = vibration_variance > 0.5 ? "Bad" : "Good";
  const stmt = db.prepare(`
    INSERT INTO telemetry (session_id, latitude, longitude, vibration_variance, status)
    VALUES (?, ?, ?, ?, ?)
  `);
  const info = stmt.run(session_id || "default", latestGPS.lat, latestGPS.lng, vibration_variance, status);
  const data = {
    id: info.lastInsertRowid,
    latitude: latestGPS.lat,
    longitude: latestGPS.lng,
    vibration_variance,
    status,
    timestamp: new Date().toISOString()
  };
  io.emit("telemetry_update", data);
  res.json(data);
});

app.get("/api/history", (req, res) => {
  const rows = db.prepare("SELECT * FROM telemetry ORDER BY timestamp ASC").all();
  res.json(rows);
});

// GitHub Auth Routes... (keep your existing ones here)

const PORT = 3000;
httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 API SERVER RUNNING ON http://localhost:${PORT}`);
});

app.use(express.static(path.join(__dirname, "dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});
