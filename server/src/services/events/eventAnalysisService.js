import mongoose from "mongoose";
import { Event } from "../../models/Event.js";
import { analyzeEvent } from "../agents/eventIntelligenceAgent.js";

const httpError = (status, message) => Object.assign(new Error(message), { status });

export async function analyzeReport(input) {
  // Mode 1: analyze a saved event and store the assessment on it.
  if (input.eventId) {
    if (!mongoose.isValidObjectId(input.eventId)) throw httpError(400, "Invalid event id");
    const event = await Event.findById(input.eventId);
    if (!event) throw httpError(404, "Event not found");

    const [lng, lat] = event.location.coordinates;
    const analysis = await analyzeEvent({
      description: event.description,
      category: event.category,
      location: { lat, lng },
      image: input.image,
    });

    // Only the assessment is stored. We do NOT change the event's severity or
    // affected roads automatically: a person must verify AI suggestions first.
    event.aiAnalysis = analysis;
    await event.save();
    return { event, analysis };
  }

  // Mode 2: analyze a draft report without saving anything.
  const analysis = await analyzeEvent(input);
  return { event: null, analysis };
}