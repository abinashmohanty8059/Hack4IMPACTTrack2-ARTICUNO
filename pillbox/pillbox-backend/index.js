import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import deviceRoutes from "./routes/device.js";
import patientRoutes from "./routes/patients.js";
import scheduleRoutes from "./routes/schedules.js";
import logRoutes from "./routes/logs.js";
import vitalsRoutes from "./routes/vitals.js";
import insightsRoutes from "./routes/insights.js";
import chatRoutes from "./routes/chat.js";
import doctorRoutes from "./routes/doctor.js";
import { startScheduler } from "./scheduler.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/device", deviceRoutes);
app.use("/patients", patientRoutes);
app.use("/schedules", scheduleRoutes);
app.use("/logs", logRoutes);
app.use("/vitals", vitalsRoutes);
app.use("/insights", insightsRoutes);
app.use("/chat", chatRoutes);
app.use("/doctor", doctorRoutes);

// Basic Home Route
app.get("/", (req, res) => {
  res.json({ message: "Pillbox Backend API is running", status: "healthy" });
});

/**
 * 404 Handler
 */
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

/**
 * Global Error Handling Middleware
 */
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.stack || err.message}`);
  
  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  
  res.status(status).json({
    error: {
      message,
      status,
      // Only include stack in development if needed
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Pillbox backend running at http://localhost:${PORT}`);
  
  // Start the background cron job
  startScheduler();
  console.log("⏰ Medication scheduler started.");
});
