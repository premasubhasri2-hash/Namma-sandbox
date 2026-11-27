import * as eventAnalysisService from "../services/events/eventAnalysisService.js";

const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const analyzeEvent = wrap(async (req, res) => {
  res.json({ data: await eventAnalysisService.analyzeReport(req.body) });
});