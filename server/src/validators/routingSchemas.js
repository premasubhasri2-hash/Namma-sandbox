import { z } from "zod";

export const shortestPathSchema = z.object({
  from: z.string().trim().min(1),
  to: z.string().trim().min(1),
  blockedRoadIds: z.array(z.string().trim().min(1)).max(12).optional(),
});

export const alternativeRoutesSchema = shortestPathSchema.extend({
  maxRoutes: z.number().int().min(1).max(5).optional(),
});