// backend/src/index.ts
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import bodyParser from "body-parser";
import webhookRouter from "./controllers/webhook.controller";
import { firestore } from "./config/firebase";

const app = express();
app.use(bodyParser.json({ limit: "5mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health route
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    firestore: firestore ? "connected" : "not-configured"
  });
});

// Webhook endpoint (WhatsApp)
app.use("/webhook", webhookRouter);

// basic index
app.get("/", (req, res) => res.send("AI Career Agent Backend - Node/TS"));

const PORT = Number(process.env.PORT) || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running on port ${PORT}`);
});
