import { Event } from "../../models/Event.js";
import { DATA_LABEL, network, depotNodeId, vehicles, deliveries } from "../../data/seedNetwork.js";
import { assignDeliveries } from "../optimization/assign.js";

// Roads as GeoJSON LineStrings, which MapLibre can draw directly.
// GeoJSON coordinates are [longitude, latitude].
function roadsToGeoJSON() {
  const nodeById = new Map(network.nodes.map((node) => [node.id, node]));
  return {
    type: "FeatureCollection",
    features: network.roads.map((road) => {
      const from = nodeById.get(road.from);
      const to = nodeById.get(road.to);
      return {
        type: "Feature",
        properties: {
          id: road.id,
          name: road.name,
          minutes: road.minutes,
          km: road.km,
          status: road.status,
        },
        geometry: {
          type: "LineString",
          coordinates: [
            [from.lng, from.lat],
            [to.lng, to.lat],
          ],
        },
      };
    }),
  };
}

// Events that still matter for the map: not resolved and not disputed.
function findActiveEvents() {
  return Event.find({ verificationStatus: { $in: ["pending", "verified"] } })
    .sort({ createdAt: -1 })
    .limit(100);
}

export function getRoads() {
  return { roads: network.roads, roadsGeoJSON: roadsToGeoJSON() };
}

export const getVehicles = () => vehicles;
export const getDeliveries = () => deliveries;

export async function getTwinState() {
  return {
    dataLabel: DATA_LABEL,
    network,
    roadsGeoJSON: roadsToGeoJSON(),
    depotNodeId,
    vehicles,
    deliveries,
    baselinePlan: assignDeliveries({ network, depotNodeId, vehicles, deliveries }),
    activeEvents: await findActiveEvents(),
  };
}

export async function getTwinOverview() {
  const activeEvents = await Event.countDocuments({
    verificationStatus: { $in: ["pending", "verified"] },
  });
  return {
    dataLabel: DATA_LABEL,
    nodes: network.nodes.length,
    roads: network.roads.length,
    vehicles: vehicles.length,
    deliveries: deliveries.length,
    activeEvents,
  };
}