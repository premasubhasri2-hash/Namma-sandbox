import * as twinService from "../services/twin/twinService.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const getState = wrap(async (req, res) => {
  res.json({ data: await twinService.getTwinState() });
});

export const getOverview = wrap(async (req, res) => {
  res.json({ data: await twinService.getTwinOverview() });
});

export const getRoads = wrap(async (req, res) => {
  res.json({ data: twinService.getRoads() });
});

export const getVehicles = wrap(async (req, res) => {
  res.json({ data: twinService.getVehicles() });
});

export const getDeliveries = wrap(async (req, res) => {
  res.json({ data: twinService.getDeliveries() });
});