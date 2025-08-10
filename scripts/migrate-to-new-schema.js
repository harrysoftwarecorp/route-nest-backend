// scripts/migrate-to-new-schema.js
import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/route-nest";

// Old schema definition for reference
const oldTripDataSchema = new mongoose.Schema({
  name: String,
  length: Number,
  createdAt: { type: Date, default: Date.now },
  stops: [
    {
      id: Number,
      name: String,
      lat: Number,
      lng: Number,
      plannedTime: Date,
    },
  ],
  routes: [[[Number]]],
});

const OldTripData = mongoose.model(
  "OldTripData",
  oldTripDataSchema,
  "tripdatas"
);

async function migrateData() {
  try {
    console.log("🔄 Starting data migration to new schema...");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Get all existing trips
    const oldTrips = await OldTripData.find({});
    console.log(`📊 Found ${oldTrips.length} trips to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const oldTrip of oldTrips) {
      try {
        // Check if already migrated (has new schema fields)
        if (oldTrip.category || oldTrip.userId || oldTrip.estimatedDuration) {
          console.log(`⏭️  Skipping already migrated trip: ${oldTrip.name}`);
          skipped++;
          continue;
        }

        // Transform old data to new schema
        const migratedData = {
          // Basic trip info
          name: oldTrip.name,
          description: `Migrated trip: ${oldTrip.name}`,
          userId: "migrated-user",

          // Dates
          createdAt: oldTrip.createdAt,
          updatedAt: new Date(),

          // Duration
          estimatedDuration: oldTrip.length || 1,
          length: oldTrip.length || 1, // Keep for backward compatibility

          // New required fields with defaults
          category: "custom",
          tags: ["migrated"],
          isPublic: false,
          isTemplate: false,
          visibility: "private",
          sharedWith: [],

          // Transform stops
          stops: (oldTrip.stops || []).map((stop, index) => ({
            id: stop.id || Date.now() + index,
            tripId: oldTrip._id.toString(),
            name: stop.name || `Stop ${index + 1}`,
            lat: stop.lat,
            lng: stop.lng,
            plannedArrival: stop.plannedTime || new Date(),
            estimatedDuration: 60, // Default 1 hour
            stopType: "custom",
            priority: "medium",
            order: index + 1,
            isCompleted: false,
            isSkipped: false,
            createdAt: oldTrip.createdAt,
            updatedAt: new Date(),
          })),

          // Transform routes (simplified)
          routes: (oldTrip.routes || []).map((route, index) => ({
            id: `route_${oldTrip._id}_${index}`,
            fromStopId: oldTrip.stops[index]?.id || index,
            toStopId: oldTrip.stops[index + 1]?.id || index + 1,
            coordinates: route,
            distance: calculateRouteDistance(route),
            estimatedDuration: 600, // 10 minutes default
            transportMode: "walking",
            createdAt: oldTrip.createdAt,
          })),

          // Initialize stats
          stats: {
            totalDistance: 0,
            estimatedDuration: (oldTrip.stops || []).length * 60, // 1 hour per stop
            stopCount: (oldTrip.stops || []).length,
            averageStopDuration: 60,
            transportModes: ["walking"],
            difficultyLevel: "easy",
          },
        };

        // Calculate total distance from routes
        migratedData.stats.totalDistance = migratedData.routes.reduce(
          (total, route) => total + route.distance,
          0
        );

        // Update the document in place
        await OldTripData.findByIdAndUpdate(
          oldTrip._id,
          { $set: migratedData },
          { new: true }
        );

        migrated++;
        console.log(
          `✅ Migrated trip: ${oldTrip.name} (${migrated}/${oldTrips.length})`
        );
      } catch (error) {
        console.error(
          `❌ Error migrating trip ${oldTrip.name}:`,
          error.message
        );
        errors++;
      }
    }

    console.log("\n📋 Migration Summary:");
    console.log(`✅ Successfully migrated: ${migrated} trips`);
    console.log(`⏭️  Skipped (already migrated): ${skipped} trips`);
    console.log(`❌ Errors: ${errors} trips`);
    console.log("🎉 Migration completed!");
  } catch (error) {
    console.error("💥 Migration failed:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
  }
}

// Utility function to calculate route distance
function calculateRouteDistance(coordinates) {
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    return 0;
  }

  let totalDistance = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    const [lat1, lng1] = coordinates[i];
    const [lat2, lng2] = coordinates[i + 1];
    totalDistance += calculateDistance(lat1, lng1, lat2, lng2) * 1000; // Convert to meters
  }

  return totalDistance;
}

// Haversine formula for distance calculation
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
  return R * c;
}

// Rollback function (in case migration needs to be reversed)
async function rollbackMigration() {
  try {
    console.log("🔄 Starting migration rollback...");

    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Remove migrated trips (those with 'migrated' tag)
    const result = await OldTripData.deleteMany({ tags: "migrated" });
    console.log(`🗑️  Removed ${result.deletedCount} migrated trips`);

    console.log("↩️  Rollback completed!");
  } catch (error) {
    console.error("💥 Rollback failed:", error);
  } finally {
    await mongoose.connection.close();
  }
}

// Command line interface
const command = process.argv[2];

switch (command) {
  case "migrate":
    migrateData();
    break;
  case "rollback":
    rollbackMigration();
    break;
  default:
    console.log("Usage:");
    console.log(
      "  node migrate-to-new-schema.js migrate   - Migrate existing data"
    );
    console.log(
      "  node migrate-to-new-schema.js rollback  - Rollback migration"
    );
    process.exit(1);
}
