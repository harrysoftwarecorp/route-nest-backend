import mongoose from "mongoose";

// Stop Schema - matches the new Stop interface
const stopSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
  },
  tripId: {
    type: String,
    required: true,
  },
  // Location data
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500,
  },
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
  },
  lng: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
  },
  address: {
    type: String,
    trim: true,
  },
  placeId: {
    type: String,
    trim: true,
  },
  // Timing
  plannedArrival: {
    type: Date,
    required: true,
  },
  plannedDeparture: {
    type: Date,
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1, // At least 1 minute
    default: 60,
  },
  actualArrival: {
    type: Date,
  },
  actualDeparture: {
    type: Date,
  },
  // Stop details
  stopType: {
    type: String,
    required: true,
    enum: [
      "attraction",
      "food",
      "accommodation",
      "transport",
      "shopping",
      "nature",
      "culture",
      "activity",
      "rest",
      "custom",
    ],
    default: "custom",
  },
  priority: {
    type: String,
    required: true,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  cost: {
    type: Number,
    min: 0,
  },
  notes: {
    type: String,
    maxlength: 1000,
  },
  photos: {
    type: [String],
    default: [],
  },
  // Ordering
  order: {
    type: Number,
    required: true,
    min: 1,
  },
  // Status
  isCompleted: {
    type: Boolean,
    default: false,
  },
  isSkipped: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Route Segment Schema
const routeSegmentSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
  },
  fromStopId: {
    type: Number,
    required: true,
  },
  toStopId: {
    type: Number,
    required: true,
  },
  // Route geometry
  coordinates: {
    type: [[Number]], // Array of [lng, lat] points
    default: [],
  },
  distance: {
    type: Number,
    required: true,
    min: 0, // In meters
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 0, // In seconds
  },
  // Transportation
  transportMode: {
    type: String,
    required: true,
    enum: [
      "walking",
      "cycling",
      "motorcycle",
      "car",
      "public_transport",
      "boat",
      "flight",
    ],
    default: "walking",
  },
  // Route details
  instructions: [
    {
      instruction: String,
      distance: Number,
      duration: Number,
      coordinates: [Number], // [lng, lat]
    },
  ],
  elevationProfile: [
    {
      lat: Number,
      lng: Number,
      elevation: Number,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Trip Stats Schema
const tripStatsSchema = new mongoose.Schema({
  totalDistance: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  stopCount: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
  },
  averageStopDuration: {
    type: Number,
    min: 0,
    default: 0,
  },
  transportModes: {
    type: [String],
    enum: [
      "walking",
      "cycling",
      "motorcycle",
      "car",
      "public_transport",
      "boat",
      "flight",
    ],
    default: ["walking"],
  },
  estimatedCost: {
    type: Number,
    min: 0,
  },
  difficultyLevel: {
    type: String,
    enum: ["easy", "moderate", "challenging"],
    default: "easy",
  },
});

// Main Trip Schema - matches the new Trip interface
const tripSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 200,
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  userId: {
    type: String,
    required: true,
    default: "default-user", // Temporary until auth is implemented
  },
  // Trip metadata
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  estimatedDuration: {
    type: Number,
    required: true,
    min: 1, // At least 1 day
    default: 1,
  },
  // Trip settings
  isPublic: {
    type: Boolean,
    default: false,
  },
  isTemplate: {
    type: Boolean,
    default: false,
  },
  // Route data
  stops: {
    type: [stopSchema],
    default: [],
  },
  routes: {
    type: [routeSegmentSchema],
    default: [],
  },
  // Trip statistics
  stats: {
    type: tripStatsSchema,
    default: () => ({}),
  },
  // Categorization
  tags: {
    type: [String],
    default: [],
  },
  category: {
    type: String,
    required: true,
    enum: [
      "cultural",
      "adventure",
      "food_tour",
      "nature",
      "city_exploration",
      "road_trip",
      "motorcycle_tour",
      "walking_tour",
      "business",
      "custom",
    ],
    default: "custom",
  },
  // Sharing and collaboration
  sharedWith: {
    type: [String],
    default: [],
  },
  visibility: {
    type: String,
    enum: ["private", "public", "shared"],
    default: "private",
  },
  // Rating system
  rating: {
    type: Number,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    min: 0,
    default: 0,
  },
  // Legacy fields for backward compatibility
  length: {
    type: Number,
    // This will be computed from estimatedDuration for backward compatibility
  },
});

// Pre-save middleware to handle computations and updates
tripSchema.pre("save", function (next) {
  // Update the updatedAt field
  this.updatedAt = new Date();

  // Ensure backward compatibility with legacy 'length' field
  if (this.estimatedDuration && !this.length) {
    this.length = this.estimatedDuration;
  }

  // Auto-generate stop IDs and update trip stats
  if (this.isModified("stops")) {
    this.stops.forEach((stop, index) => {
      if (!stop.id) {
        stop.id = Date.now() + index;
      }
      if (!stop.order) {
        stop.order = index + 1;
      }
      if (!stop.tripId) {
        stop.tripId = this._id.toString();
      }
      stop.updatedAt = new Date();
    });

    // Update trip statistics
    this.stats.stopCount = this.stops.length;
    this.stats.totalDistance = this.routes.reduce(
      (total, route) => total + route.distance,
      0
    );
    this.stats.estimatedDuration = this.stops.reduce(
      (total, stop) => total + stop.estimatedDuration,
      0
    );
    this.stats.averageStopDuration =
      this.stops.length > 0
        ? this.stats.estimatedDuration / this.stops.length
        : 0;
    this.stats.estimatedCost = this.stops.reduce(
      (total, stop) => total + (stop.cost || 0),
      0
    );

    // Extract unique transport modes from routes
    const transportModes = [
      ...new Set(this.routes.map((route) => route.transportMode)),
    ];
    if (transportModes.length > 0) {
      this.stats.transportModes = transportModes;
    }
  }

  next();
});

// Virtual for computed progress (not stored in DB)
tripSchema.virtual("progress").get(function () {
  const completedStops = this.stops.filter((stop) => stop.isCompleted).length;
  const totalStops = this.stops.length;
  return {
    completedStops,
    totalStops,
    percentComplete:
      totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0,
  };
});

// Virtual for next stop (not stored in DB)
tripSchema.virtual("nextStop").get(function () {
  return this.stops.find((stop) => !stop.isCompleted && !stop.isSkipped);
});

// Ensure virtuals are included in JSON output
tripSchema.set("toJSON", { virtuals: true });
tripSchema.set("toObject", { virtuals: true });

// Create indexes for better performance
tripSchema.index({ userId: 1, createdAt: -1 });
tripSchema.index({ category: 1, isPublic: 1 });
tripSchema.index({ tags: 1 });
tripSchema.index({ "stats.totalDistance": 1 });
tripSchema.index({ rating: -1 });

export const TripData = mongoose.model("TripData", tripSchema);
