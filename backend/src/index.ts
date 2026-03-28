import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const MONGODB_URI = process.env.MONGODB_URI;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  const db =
    mongoose.connection.readyState === 1
      ? "connected"
      : mongoose.connection.readyState === 2
        ? "connecting"
        : "disconnected";
  res.json({ status: "ok", service: "acadomi-api", database: db });
});

async function start() {
  if (MONGODB_URI) {
    try {
      await mongoose.connect(MONGODB_URI);
      console.log("MongoDB connected");
    } catch (err) {
      console.error("MongoDB connection failed:", err);
    }
  } else {
    console.warn("MONGODB_URI not set — API runs without database.");
  }

  app.listen(PORT, () => {
    console.log(`Acadomi API listening on http://localhost:${PORT}`);
  });
}

void start();
