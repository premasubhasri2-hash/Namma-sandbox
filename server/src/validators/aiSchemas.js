import { z } from "zod";
import { EVENT_CATEGORIES } from "../models/Event.js";

const image = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  base64: z.string().min(100).max(7_000_000), // about 5 MB of image data
});

export const analyzeEventSchema = z
  .object({
    eventId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid event id").optional(),
    description: z.string().trim().min(10).max(2000).optional(),
    category: z.enum(EVENT_CATEGORIES).optional(),
    location: z
      .object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) })
      .optional(),
    image: image.optional(),
  })
  .refine((d) => d.eventId || d.description, { message: "Provide eventId or description" });

  export const explainSimulationSchema = z.object({
  simulationId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid simulation id"),
  refresh: z.boolean().optional(),
});
export const analyzeImpactSchema = z.object({
  simulationId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid simulation id"),
});
export const planScenarioSchema = z.object({
  text: z.string().trim().min(5).max(500),
});