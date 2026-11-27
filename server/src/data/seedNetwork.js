// SYNTHETIC DEMO DATA. The nodes, travel times, vehicles and deliveries below
// are invented for the NAMMA-SANDBOX MVP. Coordinates are approximate and only
// place the demo network loosely around Koramangala, Bengaluru. This is not
// real traffic or road data and must be labelled as synthetic in the UI.

export const DATA_LABEL = "Synthetic demo data (not real traffic or road data)";

export const network = {
  name: "Koramangala demo network",
  nodes: [
    { id: "N1", name: "Central Depot", lat: 12.9352, lng: 77.6245 },
    { id: "N2", name: "Junction A", lat: 12.9371, lng: 77.6290 },
    { id: "N3", name: "Junction B", lat: 12.9395, lng: 77.6341 },
    { id: "N4", name: "Junction C", lat: 12.9318, lng: 77.6212 },
    { id: "N5", name: "Junction D", lat: 12.9341, lng: 77.6310 },
    { id: "N6", name: "Junction E", lat: 12.9362, lng: 77.6382 },
    { id: "N7", name: "Junction F", lat: 12.9302, lng: 77.6335 },
    { id: "N8", name: "Junction G", lat: 12.9318, lng: 77.6401 },
    { id: "N9", name: "Junction H", lat: 12.9281, lng: 77.6258 },
  ],
  roads: [
    { id: "R1", name: "Depot Link", from: "N1", to: "N2", minutes: 4, km: 1.2, status: "open" },
    { id: "R2", name: "Northern Cross", from: "N2", to: "N3", minutes: 5, km: 1.5, status: "open" },
    { id: "R3", name: "Western Link", from: "N1", to: "N4", minutes: 6, km: 1.8, status: "open" },
    { id: "R4", name: "Southern Spur", from: "N4", to: "N5", minutes: 5, km: 1.4, status: "open" },
    { id: "R5", name: "Central Connector", from: "N2", to: "N5", minutes: 7, km: 2.0, status: "open" },
    { id: "R6", name: "East Rise", from: "N3", to: "N6", minutes: 4, km: 1.1, status: "open" },
    { id: "R7", name: "Middle Ring", from: "N5", to: "N6", minutes: 6, km: 1.7, status: "open" },
    { id: "R8", name: "Lower Ring", from: "N5", to: "N7", minutes: 5, km: 1.3, status: "open" },
    { id: "R9", name: "Far East Road", from: "N6", to: "N8", minutes: 5, km: 1.4, status: "open" },
    { id: "R10", name: "South East Road", from: "N7", to: "N8", minutes: 4, km: 1.0, status: "open" },
    { id: "R11", name: "South West Road", from: "N4", to: "N9", minutes: 7, km: 2.1, status: "open" },
    { id: "R12", name: "Bottom Link", from: "N9", to: "N7", minutes: 6, km: 1.6, status: "open" },
  ],
};

export const depotNodeId = "N1";

export const vehicles = [
  { vehicleId: "V1", vehicleType: "van", capacity: 25, available: true },
  { vehicleId: "V2", vehicleType: "mini-truck", capacity: 20, available: true },
];

// deadlineMinutes = minutes after dispatch by which the delivery should arrive.
export const deliveries = [
  { deliveryId: "D1", nodeId: "N3", demand: 8, priority: "high", deadlineMinutes: 20 },
  { deliveryId: "D2", nodeId: "N6", demand: 6, priority: "medium", deadlineMinutes: 30 },
  { deliveryId: "D3", nodeId: "N5", demand: 7, priority: "high", deadlineMinutes: 25 },
  { deliveryId: "D4", nodeId: "N8", demand: 5, priority: "low", deadlineMinutes: 45 },
  { deliveryId: "D5", nodeId: "N7", demand: 9, priority: "medium", deadlineMinutes: 40 },
  { deliveryId: "D6", nodeId: "N9", demand: 4, priority: "low", deadlineMinutes: 50 },
];