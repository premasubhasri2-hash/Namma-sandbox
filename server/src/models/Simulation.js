import mongoose from "mongoose";

const simulationSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, maxlength: 120, default: "What-if simulation" },
    baseEventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },

    scenarioParameters: { type: mongoose.Schema.Types.Mixed, required: true },
    affectedDeliveryIds: { type: [String], default: [] },
    recommendedStrategy: {
      type: String,
      enum: ["reroute", "wait", "no_action_needed"],
      required: true,
    },

    // Short summaries for list views, and the full result for the detail page.
    baselineMetrics: { type: mongoose.Schema.Types.Mixed, required: true },
    rerouteMetrics: { type: mongoose.Schema.Types.Mixed, required: true },
    waitMetrics: { type: mongoose.Schema.Types.Mixed, required: true },
    result: { type: mongoose.Schema.Types.Mixed, required: true },

    // Filled in later by the AI recommendation step.
    recommendations: { type: mongoose.Schema.Types.Mixed, default: null },

    status: { type: String, enum: ["completed", "failed"], default: "completed" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  // minimize:false keeps empty objects like {} instead of silently dropping them.
  { timestamps: true, minimize: false },
);

simulationSchema.index({ createdAt: -1 });

export const Simulation = mongoose.model("Simulation", simulationSchema);