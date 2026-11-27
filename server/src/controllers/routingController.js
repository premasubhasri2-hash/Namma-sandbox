import * as routingService from "../services/routing/routingService.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const shortestPath = wrap(async (req, res) => {
  res.json({ data: routingService.findShortestPath(req.body) });
});

export const alternativeRoutes = wrap(async (req, res) => {
  res.json({ data: routingService.findAlternativeRoutes(req.body) });
});