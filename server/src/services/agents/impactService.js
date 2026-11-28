import { getSimulationById } from "../simulation/simulationService.js";
import { network, deliveries } from "../../data/seedNetwork.js";
import { buildImpactReport } from "./impactAnalysis.js";

// Impact is cheap to compute from the saved result, so it is calculated on
// request and not stored.
export async function analyzeSimulationImpact(simulationId) {
  const simulation = await getSimulationById(simulationId);
  return buildImpactReport(simulation.toObject().result, { network, deliveries });
}
