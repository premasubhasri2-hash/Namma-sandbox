import * as eventAnalysisService from "../services/events/eventAnalysisService.js";
import * as simulationExplanationService from "../services/agents/simulationExplanationService.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const analyzeEvent = wrap(async (req, res) => {
  res.json({ data: await eventAnalysisService.analyzeReport(req.body) });
});
export const explainSimulation = wrap(async (req, res) => {
  const { simulationId, refresh } = req.body;
  res.json({ data: await simulationExplanationService.explainSavedSimulation(simulationId, { refresh }) });
});