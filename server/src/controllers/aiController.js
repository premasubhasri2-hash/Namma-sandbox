import * as eventAnalysisService from "../services/events/eventAnalysisService.js";
import * as simulationExplanationService from "../services/agents/simulationExplanationService.js";
import * as impactService from "../services/agents/impactService.js";
import { planScenario } from "../services/agents/scenarioPlannerAgent.js";
import { orchestrate } from "../services/agents/orchestrator.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const analyzeEvent = wrap(async (req, res) => {
  res.json({ data: await eventAnalysisService.analyzeReport(req.body) });
});
export const explainSimulation = wrap(async (req, res) => {
  const { simulationId, refresh } = req.body;
  res.json({ data: await simulationExplanationService.explainSavedSimulation(simulationId, { refresh }) });
});
export const analyzeImpact = wrap(async (req, res) => {
  res.json({ data: await impactService.analyzeSimulationImpact(req.body.simulationId) });
});
export const planScenarioFromText = wrap(async (req, res) => {
  res.json({ data: await planScenario(req.body.text) });
});
export const orchestrateFromText = wrap(async (req, res) => {
  res.json({ data: await orchestrate(req.body.text) });
});