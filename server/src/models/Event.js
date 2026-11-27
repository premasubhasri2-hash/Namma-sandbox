import mongoose from "mongoose";

export const EVENT_CATEGORIES = [
  "waterlogging",
  "road_closure",
  "construction",
  "public_gathering",
  "accident",
  "other",
];
export const SEVERITIES = ["low", "medium", "high", "critical"];
export const VERIFICATION_STATUSES = ["pending", "verified", "disputed", "resolved"];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    category: { type: String, enum: EVENT_CATEGORIES, required: true },
    severity: { type: String, enum: SEVERITIES, default: "medium" },

    // GeoJSON point. MongoDB wants coordinates as [longitude, latitude].
    location: {
      type: { type: String, enum: ["Point"], default: "Point", required: true },
      coordinates: { type: [Number], required: true },
    },

    // Ids of roads in our network (e.g. "R2") this event may affect.
    affectedRoadIds: { type: [String], default: [] },

    imageUrl: { type: String },
    estimatedDurationMinutes: { type: Number, min: 1 },
    verificationStatus: { type: String, enum: VERIFICATION_STATUSES, default: "pending" },

    // Filled in later by the AI event analysis. Stays null until then.
    aiAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },

    // Becomes a reference to the User once login exists.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// Lets MongoDB answer "which events are near this point?" quickly.
eventSchema.index({ location: "2dsphere" });
eventSchema.index({ verificationStatus: 1, createdAt: -1 });

export const Event = mongoose.model("Event", eventSchema);