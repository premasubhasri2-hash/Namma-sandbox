import { Event } from "../../models/Event.js";
import { Simulation } from "../../models/Simulation.js";
import { DATA_LABEL, vehicles, deliveries } from "../../data/seedNetwork.js";

// "Active" events are the ones that still matter: not resolved, not disputed.
const ACTIVE = ["pending", "verified"];
const activeFilter = { verificationStatus: { $in: ACTIVE } };

export async function getSummary() {
  const [
    activeEvents,
    verifiedEvents,
    pendingReports,
    simulationsRun,
    categoryCounts,
    affectedRoadGroups,
    lastSimulation,
  ] = await Promise.all([
    Event.countDocuments(activeFilter),
    Event.countDocuments({ verificationStatus: "verified" }),
    Event.countDocuments({ verificationStatus: "pending" }),
    Simulation.countDocuments(),
    Event.aggregate([
      { $match: activeFilter },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    // One group per distinct road mentioned by an active event.
    Event.aggregate([
      { $match: activeFilter },
      { $unwind: "$affectedRoadIds" },
      { $group: { _id: "$affectedRoadIds" } },
    ]),
    Simulation.findOne()
      .sort({ createdAt: -1 })
      .select("title recommendedStrategy affectedDeliveryIds createdAt"),
  ]);

  return {
    dataLabel: DATA_LABEL,
    activeEvents,
    verifiedEvents,
    pendingReports,
    affectedRoutes: affectedRoadGroups.length,
    activeVehicles: vehicles.filter((v) => v.available !== false).length,
    totalDeliveries: deliveries.length,
    simulationsRun,
    eventsByCategory: categoryCounts.map((c) => ({ category: c._id, count: c.count })),
    lastSimulation,
  };
}

export async function getRecentActivity(limit = 10) {
  const safeLimit = Math.min(Math.max(Number(limit) || 10, 1), 50);

  const [events, simulations] = await Promise.all([
    Event.find().sort({ createdAt: -1 }).limit(safeLimit).select("title category verificationStatus createdAt"),
    Simulation.find().sort({ createdAt: -1 }).limit(safeLimit).select("title recommendedStrategy createdAt"),
  ]);

  return [
    ...events.map((e) => ({
      type: "event",
      id: e._id,
      title: e.title,
      detail: `${e.category} · ${e.verificationStatus}`,
      createdAt: e.createdAt,
    })),
    ...simulations.map((s) => ({
      type: "simulation",
      id: s._id,
      title: s.title,
      detail: `recommended: ${s.recommendedStrategy}`,
      createdAt: s.createdAt,
    })),
  ]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, safeLimit);
}