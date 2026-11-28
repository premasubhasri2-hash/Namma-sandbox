import { getSimulationById } from "../simulation/simulationService.js";
import { buildSimulationFacts } from "./simulationFacts.js";
import { explainSimulation } from "./recommendationAgent.js";

// Loads a saved simulation, asks Agent E to explain it, and stores the
// explanation on the simulation so it can be shown again without calling the AI.
export async function explainSavedSimulation(simulationId, { refresh = false } = {}) {
  const simulation = await getSimulationById(simulationId);

  if (simulation.recommendations && !refresh) {
    return { simulation, recommendation: simulation.recommendations, cached: true };
  }

  const facts = buildSimulationFacts(simulation.toObject().result);
  const recommendation = await explainSimulation(facts);

  simulation.recommendations = recommendation;
  await simulation.save();
  return { simulation, recommendation, cached: false };
}
