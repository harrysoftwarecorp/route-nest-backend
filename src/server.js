import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { TripData } from "./models/TripData.js";

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 8000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/route-nest";

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

// ===========================================
// SEARCH & DISCOVERY ENDPOINTS (MUST BE FIRST)
// ===========================================

// Search trips - MUST come before /api/trips/:id
app.get("/api/trips/search", async (req, res) => {
  try {
    const {
      query,
      category,
      tags,
      location,
      radius = 50,
      limit = 10,
    } = req.query;

    const searchQuery = { isPublic: true };

    if (query) {
      searchQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (category) searchQuery.category = category;
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",");
      searchQuery.tags = { $in: tagArray };
    }

    const trips = await TripData.find(searchQuery)
      .sort({ rating: -1, reviewCount: -1 })
      .limit(parseInt(limit))
      .select(
        "name estimatedDuration createdAt category tags stats isPublic rating"
      );

    res.json(trips);
  } catch (error) {
    console.error("Error searching trips:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get popular trips - MUST come before /api/trips/:id
app.get("/api/trips/popular", async (req, res) => {
  try {
    const { location, limit = 10 } = req.query;

    const trips = await TripData.find({ isPublic: true, rating: { $gte: 4.0 } })
      .sort({ rating: -1, reviewCount: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .select(
        "name estimatedDuration createdAt category tags stats isPublic rating"
      );

    res.json(trips);
  } catch (error) {
    console.error("Error fetching popular trips:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// LEGACY ENDPOINTS (MUST BE BEFORE GENERIC ROUTES)
// ===========================================

// Legacy trip creation endpoint
app.post("/api/trips/legacy", async (req, res) => {
  try {
    const { name, length } = req.body;
    const tripData = new TripData({
      name,
      estimatedDuration: length,
      length, // Keep for backward compatibility
      category: "custom",
      tags: [],
      isPublic: false,
      userId: "default-user",
    });
    await tripData.save();
    res.status(201).json(tripData);
  } catch (error) {
    console.error("Error creating legacy trip:", error);
    res.status(400).json({ error: error.message });
  }
});

// ===========================================
// TRIP MANAGEMENT ENDPOINTS
// ===========================================

// Get all trips (with query support for filtering)
app.get("/api/trips", async (req, res) => {
  try {
    const {
      category,
      tags,
      isPublic,
      userId = "default-user",
      limit = 50,
      sort = "-createdAt",
    } = req.query;

    // Build query
    const query = { userId };

    if (category) query.category = category;
    if (isPublic !== undefined) query.isPublic = isPublic === "true";
    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : tags.split(",");
      query.tags = { $in: tagArray };
    }

    const trips = await TripData.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .select(
        "name estimatedDuration createdAt category tags stats isPublic rating"
      );

    // Transform to TripSummary format
    const tripSummaries = trips.map((trip) => ({
      _id: trip._id,
      name: trip.name,
      estimatedDuration: trip.estimatedDuration,
      createdAt: trip.createdAt,
      stopCount: trip.stats.stopCount,
      category: trip.category,
      tags: trip.tags,
      stats: {
        totalDistance: trip.stats.totalDistance,
        estimatedCost: trip.stats.estimatedCost,
      },
      isPublic: trip.isPublic,
      rating: trip.rating,
      // Keep legacy field for backward compatibility
      length: trip.length || trip.estimatedDuration,
    }));

    res.json(tripSummaries);
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create new trip
app.post("/api/trips", async (req, res) => {
  try {
    const tripData = new TripData({
      ...req.body,
      userId: req.body.userId || "default-user",
    });
    await tripData.save();
    res.status(201).json(tripData);
  } catch (error) {
    console.error("Error creating trip:", error);
    res.status(400).json({ error: error.message });
  }
});

// Get single trip by ID
app.get("/api/trips/:id", async (req, res) => {
  try {
    const trip = await TripData.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.json(trip);
  } catch (error) {
    console.error("Error fetching trip:", error);
    res.status(500).json({ error: error.message });
  }
});

// Update trip
app.put("/api/trips/:id", async (req, res) => {
  try {
    const trip = await TripData.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    res.json(trip);
  } catch (error) {
    console.error("Error updating trip:", error);
    res.status(400).json({ error: error.message });
  }
});

// Delete trip
app.delete("/api/trips/:id", async (req, res) => {
  try {
    const trip = await TripData.findByIdAndDelete(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }
    res.status(200).json({ message: "Trip deleted successfully" });
  } catch (error) {
    console.error("Error deleting trip:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// STOP MANAGEMENT ENDPOINTS
// ===========================================

// Add stop to trip
app.post("/api/trips/:id/stops", async (req, res) => {
  try {
    const trip = await TripData.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const newStop = {
      ...req.body,
      id: Date.now() + trip.stops.length,
      tripId: req.params.id,
      order: trip.stops.length + 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    trip.stops.push(newStop);
    await trip.save();
    res.status(201).json(trip);
  } catch (error) {
    console.error("Error adding stop:", error);
    res.status(400).json({ error: error.message });
  }
});

// Legacy stop addition endpoint (for backward compatibility)
app.put("/api/trips/:id/stops", async (req, res) => {
  try {
    const trip = await TripData.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const newStop = {
      id: Date.now() + trip.stops.length,
      tripId: req.params.id,
      name: req.body.name,
      lat: req.body.lat,
      lng: req.body.lng,
      plannedArrival: req.body.plannedTime || new Date(),
      estimatedDuration: 60, // Default 1 hour
      stopType: "custom",
      priority: "medium",
      order: trip.stops.length + 1,
      isCompleted: false,
      isSkipped: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    trip.stops.push(newStop);
    await trip.save();
    res.json(trip);
  } catch (error) {
    console.error("Error adding legacy stop:", error);
    res.status(400).json({ error: error.message });
  }
});

// Update stop
app.put("/api/trips/:id/stops/:stopId", async (req, res) => {
  try {
    const trip = await TripData.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const stopIndex = trip.stops.findIndex(
      (stop) => stop.id === Number(req.params.stopId)
    );

    if (stopIndex === -1) {
      return res.status(404).json({ error: "Stop not found" });
    }

    // Update stop data
    Object.assign(trip.stops[stopIndex], req.body, {
      updatedAt: new Date(),
    });

    await trip.save();
    res.json(trip);
  } catch (error) {
    console.error("Error updating stop:", error);
    res.status(400).json({ error: error.message });
  }
});

// Delete stop
app.delete("/api/trips/:id/stops/:stopId", async (req, res) => {
  try {
    const trip = await TripData.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const stopIndex = trip.stops.findIndex(
      (stop) => stop.id === Number(req.params.stopId)
    );

    if (stopIndex === -1) {
      return res.status(404).json({ error: "Stop not found" });
    }

    trip.stops.splice(stopIndex, 1);

    // Reorder remaining stops
    trip.stops.forEach((stop, index) => {
      stop.order = index + 1;
    });

    await trip.save();
    res.json(trip);
  } catch (error) {
    console.error("Error deleting stop:", error);
    res.status(500).json({ error: error.message });
  }
});

// Reorder stops
app.put("/api/trips/:id/stops/reorder", async (req, res) => {
  try {
    const { stopIds } = req.body;
    const trip = await TripData.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Create a mapping of current stops
    const stopMap = new Map(trip.stops.map((stop) => [stop.id, stop]));

    // Reorder stops based on provided order
    trip.stops = stopIds.map((stopId, index) => {
      const stop = stopMap.get(stopId);
      if (stop) {
        stop.order = index + 1;
        return stop;
      }
      throw new Error(`Stop with ID ${stopId} not found`);
    });

    await trip.save();
    res.json(trip);
  } catch (error) {
    console.error("Error reordering stops:", error);
    res.status(400).json({ error: error.message });
  }
});

// Mark stop as completed/incomplete
app.patch("/api/trips/:id/stops/:stopId/status", async (req, res) => {
  try {
    const { isCompleted, actualArrival, actualDeparture } = req.body;
    const trip = await TripData.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    const stop = trip.stops.find((s) => s.id === Number(req.params.stopId));
    if (!stop) {
      return res.status(404).json({ error: "Stop not found" });
    }

    stop.isCompleted = isCompleted;
    stop.updatedAt = new Date();

    if (actualArrival) stop.actualArrival = new Date(actualArrival);
    if (actualDeparture) stop.actualDeparture = new Date(actualDeparture);

    await trip.save();
    res.json(trip);
  } catch (error) {
    console.error("Error updating stop status:", error);
    res.status(400).json({ error: error.message });
  }
});

// ===========================================
// ROUTE MANAGEMENT ENDPOINTS
// ===========================================

// Generate routes (placeholder - would integrate with routing service)
app.post("/api/trips/:id/routes/generate", async (req, res) => {
  try {
    const trip = await TripData.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Placeholder route generation logic
    // In a real implementation, this would call a routing service like OpenRouteService
    const routes = [];
    for (let i = 0; i < trip.stops.length - 1; i++) {
      const fromStop = trip.stops[i];
      const toStop = trip.stops[i + 1];

      routes.push({
        id: `route_${Date.now()}_${i}`,
        fromStopId: fromStop.id,
        toStopId: toStop.id,
        coordinates: [
          [fromStop.lng, fromStop.lat],
          [toStop.lng, toStop.lat],
        ], // Direct line for now
        distance:
          calculateDistance(
            fromStop.lat,
            fromStop.lng,
            toStop.lat,
            toStop.lng
          ) * 1000, // Convert to meters
        estimatedDuration: 600, // 10 minutes default
        transportMode: "walking",
        createdAt: new Date(),
      });
    }

    trip.routes = routes;
    await trip.save();
    res.json(trip);
  } catch (error) {
    console.error("Error generating routes:", error);
    res.status(500).json({ error: error.message });
  }
});

// Optimize route (placeholder)
app.post("/api/trips/:id/routes/optimize", async (req, res) => {
  try {
    const trip = await TripData.findById(req.params.id);
    if (!trip) {
      return res.status(404).json({ error: "Trip not found" });
    }

    // Placeholder optimization logic
    // In a real implementation, this would use TSP algorithms or routing optimization services

    res.json(trip);
  } catch (error) {
    console.error("Error optimizing route:", error);
    res.status(500).json({ error: error.message });
  }
});

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in kilometers
}

// ===========================================
// ERROR HANDLING MIDDLEWARE
// ===========================================

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// ===========================================
// SERVER STARTUP
// ===========================================

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Modern Mongoose doesn't need these options, but including for compatibility
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`🚀 Server started successfully on port ${PORT}`);
      console.log(`📍 API available at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error("❌ Error starting the server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("🔄 SIGTERM received, shutting down gracefully");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("🔄 SIGINT received, shutting down gracefully");
  await mongoose.connection.close();
  process.exit(0);
});

startServer();
