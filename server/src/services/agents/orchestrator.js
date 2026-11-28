// Orchestrator: runs the agents in order for ONE sentence from a manager.
//
//   1. Scenario Planner   text -> scenario (checked against the real roads)
//   2. Simulation engine  scenario -> three plans, saved to MongoDB
//   3. Impact Analysis    which deliveries/vehicles are affected, risk level
//   4. Recommendation     plain-language explanation, numbers verified
//
// The order and the data passed between steps are fixed in code. No AI decides
// the workflow. If a step fails, the steps already done are still returned.
// Running a simulation only touches synthetic demo data; nothing real changes.

import { planScenario } from "./scenarioPlannerAgent.js";

const REVIEW_BELOW_CONFIDENCE = 0.6;

// The database-backed steps are imported only when they are used, so this file
// can be tested without MongoDB.
const defaultSteps = {
  plan: planScenario,
  simulate: async (input) => (await import("../simulation/simulationService.js")).createSimulation(input),
  impact: async (id) => (await import("./impactService.js")).analyzeSimulationImpact(id),
  explain: async (id) => (await import("./simulationExplanationService.js")).explainSavedSimulation(id),
};

export async function orchestrate(text, steps = defaultSteps) {
  const log = [];

  // Runs one step, records how long it took and whether it worked.
  async function step(name, fn, describe = () => ({})) {
    const started = Date.now();
    try {
      const value = await fn();
      log.push({ name, status: "ok", ms: Date.now() - started, ...describe(value) });
      return value;
    } catch (error) {
      log.push({ name, status: "failed", ms: Date.now() - started, error: error.message });
      throw error;
    }
  }

  const output = { input: text, completed: false, steps: log, needsReview: true };

  try {
    const plan = await step("scenario-planner", () => steps.plan(text), (p) => ({ source: p.source }));
    output.plan = plan;
    if (!plan.understood) {
      output.stoppedBecause = "No known road was found in the request, so no simulation was run.";
      return output;
    }
    output.needsReview = plan.confidence < REVIEW_BELOW_CONFIDENCE || plan.warnings.length > 0;

    const simulation = await step(
      "simulation",
      () => steps.simulate({ title: `Planned: ${text.slice(0, 80)}`, ...plan.scenario }),
      (s) => ({ simulationId: String(s._id) }),
    );
    const id = String(simulation._id);
    output.simulation = {
      id,
      title: simulation.title,
      scenario: simulation.scenarioParameters,
      recommendedStrategy: simulation.recommendedStrategy,
      affectedDeliveryIds: simulation.affectedDeliveryIds,
      baselineMetrics: simulation.baselineMetrics,
      rerouteMetrics: simulation.rerouteMetrics,
      waitMetrics: simulation.waitMetrics,
    };

    output.impact = await step("impact-analysis", () => steps.impact(id), (i) => ({ riskLevel: i.riskLevel }));

    const explained = await step("recommendation", () => steps.explain(id), (e) => ({ source: e.recommendation.source }));
    output.recommendation = explained.recommendation;

    output.completed = true;
  } catch (error) {
    output.stoppedBecause = error.message;
  }
  return output;
}
