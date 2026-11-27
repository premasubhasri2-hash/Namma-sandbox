import mongoose from "mongoose";
import { Event } from "../../models/Event.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });

function assertValidId(id) {
  if (!mongoose.isValidObjectId(id)) throw httpError(400, `Invalid event id: ${id}`);
}

export async function createEvent(input) {
  const { location, ...rest } = input;
  // MongoDB stores coordinates as [longitude, latitude].
  return Event.create({
    ...rest,
    location: { type: "Point", coordinates: [location.lng, location.lat] },
  });
}

export async function listEvents({ status, category, page, limit }) {
  const filter = {};
  if (status) filter.verificationStatus = status;
  if (category) filter.category = category;

  const safeLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
  const safePage = Math.max(Number(page) || 1, 1);

  const [data, total] = await Promise.all([
    Event.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit),
    Event.countDocuments(filter),
  ]);

  return { data, meta: { total, page: safePage, limit: safeLimit } };
}

export async function getEventById(id) {
  assertValidId(id);
  const event = await Event.findById(id);
  if (!event) throw httpError(404, "Event not found");
  return event;
}

export async function updateEventStatus(id, verificationStatus) {
  assertValidId(id);
  const event = await Event.findByIdAndUpdate(
    id,
    { verificationStatus },
    { new: true, runValidators: true },
  );
  if (!event) throw httpError(404, "Event not found");
  return event;
}

// Events within maxDistanceKm of a point, nearest first (uses the 2dsphere index).
export async function findNearbyEvents({ lat, lng, maxDistanceKm }) {
  if (![lat, lng, maxDistanceKm].every(Number.isFinite)) {
    throw httpError(400, "lat, lng and maxDistanceKm must be numbers");
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    throw httpError(400, "lat or lng is out of range");
  }
  if (maxDistanceKm <= 0 || maxDistanceKm > 50) {
    throw httpError(400, "maxDistanceKm must be between 0 and 50");
  }

  return Event.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: maxDistanceKm * 1000,
      },
    },
  }).limit(50);
}