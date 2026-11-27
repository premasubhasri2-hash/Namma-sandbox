import * as simulationService from "../services/simulation/simulationService.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const createSimulation = wrap(async (req, res) => {
  const simulation = await simulationService.createSimulation(req.body);
  res.status(201).json({ data: simulation });
});

export const listSimulations = wrap(async (req, res) => {
  const { page, limit } = req.query;
  res.json(await simulationService.listSimulations({ page, limit }));
});

export const getSimulation = wrap(async (req, res) => {
  res.json({ data: await simulationService.getSimulationById(req.params.id) });
});