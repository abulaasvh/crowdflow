interface Node {
  id: string;
  name: string;
}

interface Edge {
  from: string;
  to: string;
  distance: number; // base weight
}

// Map of the stadium nodes (matching shared-types and map layout)
export const STADIUM_NODES: Node[] = [
  { id: 'gate-north', name: 'North Gate' },
  { id: 'gate-south', name: 'South Gate' },
  { id: 'gate-east', name: 'East Gate' },
  { id: 'gate-west', name: 'West Gate' },
  { id: 'section-a', name: 'Section A' },
  { id: 'section-b', name: 'Section B' },
  { id: 'section-c', name: 'Section C' },
  { id: 'section-d', name: 'Section D' },
  { id: 'concession-n', name: 'Food North' },
  { id: 'concession-s', name: 'Food South' },
  { id: 'walkway-north', name: 'North Concourse' },
  { id: 'walkway-south', name: 'South Concourse' },
  { id: 'walkway-east', name: 'East Concourse' },
  { id: 'walkway-west', name: 'West Concourse' },
];

export const STADIUM_EDGES: Edge[] = [
  // North Gate connections
  { from: 'gate-north', to: 'walkway-north', distance: 10 },
  // Walkway North connections
  { from: 'walkway-north', to: 'section-a', distance: 15 },
  { from: 'walkway-north', to: 'concession-n', distance: 5 },
  { from: 'walkway-north', to: 'walkway-east', distance: 20 },
  { from: 'walkway-north', to: 'walkway-west', distance: 20 },
  // Walkway South connections
  { from: 'walkway-south', to: 'gate-south', distance: 10 },
  { from: 'walkway-south', to: 'section-d', distance: 15 },
  { from: 'walkway-south', to: 'concession-s', distance: 5 },
  { from: 'walkway-south', to: 'walkway-east', distance: 20 },
  { from: 'walkway-south', to: 'walkway-west', distance: 20 },
  // More links
  { from: 'walkway-east', to: 'gate-east', distance: 10 },
  { from: 'walkway-east', to: 'section-b', distance: 15 },
  { from: 'walkway-west', to: 'gate-west', distance: 10 },
  { from: 'walkway-west', to: 'section-c', distance: 15 },
];
