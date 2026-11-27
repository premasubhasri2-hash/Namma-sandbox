import * as dashboardService from "../services/dashboard/dashboardService.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const getSummary = wrap(async (req, res) => {
  res.json({ data: await dashboardService.getSummary() });
});

export const getRecentActivity = wrap(async (req, res) => {
  res.json({ data: await dashboardService.getRecentActivity(req.query.limit) });
});