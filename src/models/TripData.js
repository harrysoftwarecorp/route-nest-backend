import mongoose from "mongoose";

const stopSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
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
  plannedTime: {
    type: Date,
    required: true,
    validate: {
      validator: function (v) {
        return v instanceof Date && !isNaN(v);
      },
      message: "plannedTime must be a valid date",
    },
  },
});

const tripDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 1,
    maxlength: 100,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
  stops: {
    type: [stopSchema],
    default: [],
    validate: {
      validator: function (v) {
        return Array.isArray(v);
      },
      message: "stops must be an array",
    },
  },
  routes: {
    type: [[[Number]]],
    default: [],
    validate: {
      validator: function (v) {
        return (
          Array.isArray(v) &&
          v.every(
            (route) =>
              Array.isArray(route) &&
              route.every(
                (coord) =>
                  Array.isArray(coord) &&
                  coord.length === 2 &&
                  typeof coord[0] === "number" &&
                  typeof coord[1] === "number"
              )
          )
        );
      },
      message: "routes must be an array of arrays of coordinate pairs",
    },
  },
});

export const TripData = mongoose.model("TripData", tripDataSchema);
