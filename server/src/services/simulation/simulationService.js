import mongoose from "mongoose";
import { Simulation } from "../../models/Simulation.js";
import { Event } from "../../models/Event.js";
import { network, depotNodeId, vehicles, deliveries } from "../../data/seedNetwork.js";
import { runSimulation } from "./runSimulation.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });

export async function createSimulation(input) {
  let { blockedRoadIds = [], penaltyMinutes = {}, durationMinutes } = input;

  // If a base event is given, it supplies the blocked roads and duration
  // unless the request already specifies them.
  let event = null;
  if (input.baseEventId) {
    event = await Event.findById(input.baseEventId);
    if (!event) throw httpError(404, "Base event not found");
    if (blockedRoadIds.length === 0) blockedRoadIds = event.affectedRoadIds;
    durationMinutes ??= event.estimatedDurationMinutes;
  }
  durationMinutes ??= 60;

  let result;
  try {
    result = runSimulation({
      network,
      depotNodeId,
      vehicles,
      deliveries,
      scenarioParams: { blockedRoadIds, penaltyMinutes, durationMinutes },
    });
  } catch (error) {
    // The engine throws for bad input such as an unknown road id.
    throw httpError(400, error.message);
  }

  return Simulation.create({
    title: input.title ?? (event ? `Simulation for: ${event.title}` : "What-if simulation"),
    baseEventId: event?._id,
    scenarioParameters: result.scenario,
    affectedDeliveryIds: result.affectedDeliveryIds,
    recommendedStrategy: result.recommendedStrategy,
    baselineMetrics: result.baseline.metrics,
    rerouteMetrics: result.reroute.metrics,
    waitMetrics: result.wait.metrics,
    result,
  });
}

export async function listSimulations({ page, limit }) {
  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);

  const [data, total] = await Promise.all([
    Simulation.find()
      .select("-result") // keep list responses small
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Simulation.countDocuments(),
  ]);
  return { data, meta: { total, page: safePage, limit: safeLimit } };
}

export async function getSimulationById(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, `Invalid simulation id: ${id}`);
  const simulation = await Simulation.findById(id);
  if (!simulation) throw httpError(404, "Simulation not found");
  return simulation;
}