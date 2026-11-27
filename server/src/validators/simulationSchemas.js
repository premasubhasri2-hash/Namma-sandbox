import { z } from "zod";

export const runSimulationSchema = z
  .object({
    title: z.string().trim().min(3).max(120).optional(),
    baseEventId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid event id").optional(),
    blockedRoadIds: z.array(z.string().trim().min(1)).max(12).optional(),
    penaltyMinutes: z.record(z.string(), z.number().min(0).max(240)).optional(),
    durationMinutes: z.number().positive().max(24 * 60).optional(),
  })
  .refine(
    (d) =>
      d.baseEventId ||
      (d.blockedRoadIds && d.blockedRoadIds.length > 0) ||
      (d.penaltyMinutes && Object.keys(d.penaltyMinutes).length > 0),
    { message: "Provide baseEventId, blockedRoadIds or penaltyMinutes" },
  );