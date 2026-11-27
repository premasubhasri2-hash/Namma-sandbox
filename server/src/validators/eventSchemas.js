import { z } from "zod";
import { EVENT_CATEGORIES, SEVERITIES, VERIFICATION_STATUSES } from "../models/Event.js";

// The demo only supports Bengaluru. This is a rough bounding box, not an exact border.
export const SUPPORTED_REGION = { minLat: 12.7, maxLat: 13.25, minLng: 77.35, maxLng: 77.85 };

const location = z
  .object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  })
  .refine(
    ({ lat, lng }) =>
      lat >= SUPPORTED_REGION.minLat &&
      lat <= SUPPORTED_REGION.maxLat &&
      lng >= SUPPORTED_REGION.minLng &&
      lng <= SUPPORTED_REGION.maxLng,
    { message: "Location is outside the supported region (Bengaluru)" },
  );

export const createEventSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(2000),
  category: z.enum(EVENT_CATEGORIES),
  severity: z.enum(SEVERITIES).optional(),
  location,
  estimatedDurationMinutes: z.number().int().positive().max(7 * 24 * 60).optional(),
  affectedRoadIds: z.array(z.string().trim().min(1)).max(20).optional(),
});

export const updateStatusSchema = z.object({
  verificationStatus: z.enum(VERIFICATION_STATUSES),
});