import * as eventService from "../services/events/eventService.js";

// Sends any error from an async handler to our error middleware.
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export const createEvent = wrap(async (req, res) => {
  const event = await eventService.createEvent(req.body);
  res.status(201).json({ data: event });
});

export const listEvents = wrap(async (req, res) => {
  const { status, category, page, limit } = req.query;
  res.json(await eventService.listEvents({ status, category, page, limit }));
});

export const getEvent = wrap(async (req, res) => {
  res.json({ data: await eventService.getEventById(req.params.id) });
});

export const updateEventStatus = wrap(async (req, res) => {
  const event = await eventService.updateEventStatus(req.params.id, req.body.verificationStatus);
  res.json({ data: event });
});

export const nearbyEvents = wrap(async (req, res) => {
  const data = await eventService.findNearbyEvents({
    lat: Number(req.query.lat),
    lng: Number(req.query.lng),
    maxDistanceKm: Number(req.query.maxDistanceKm ?? 5),
  });
  res.json({ data });
});