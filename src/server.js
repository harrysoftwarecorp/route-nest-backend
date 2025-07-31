import express from "express";
import mongoose from "mongoose";
import { TripData } from "./models/TripData.js";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 8000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/route-nest";

app.get("/api/trips", async (req, res) => {
  try {
    const trips = await TripData.find();
    res.json(trips);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/trips/:id", async (req, res) => {
  try {
    const tripData = await TripData.findById(req.params.id);
    if (!tripData) {
      return res.status(404).json({ error: "Trip data not found" });
    }
    res.json(tripData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/trips/", async (req, res) => {
  try {
    const tripData = new TripData(req.body);
    await tripData.save();
    res.status(201).json(tripData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/trips/:id", async (req, res) => {
  try {
    await TripData.findByIdAndDelete(req.params.id);
    res.sendStatus(200);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/trips/:id/stops", async (req, res) => {
  try {
    const trip = await TripData.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    trip.stops.push(req.body);
    await trip.save();
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
    app.listen(PORT);
    console.log(`Server started successfully on port ${PORT}`);
  } catch (error) {
    console.error("Error starting the server:", error);
  }
}
startServer();
