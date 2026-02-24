import axios from 'axios';

export interface POI {
  id: number;
  lat: number;
  lon: number;
  name: string;
  type: 'ev_charging' | 'fuel' | 'other';
  tags: Record<string, string>;
}

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter'
];

function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

function sampleRoutePoints(coordinates: [number, number][], maxPoints: number = 15): [number, number][] {
  if (coordinates.length === 0) return [];
  if (coordinates.length <= maxPoints) return coordinates;

  const sampled: [number, number][] = [];
  const step = Math.ceil(coordinates.length / maxPoints);

  for (let i = 0; i < coordinates.length; i += step) {
    sampled.push(coordinates[i]);
  }

  // Always include the end point if not already included
  if (sampled[sampled.length - 1] !== coordinates[coordinates.length - 1]) {
    sampled.push(coordinates[coordinates.length - 1]);
  }
  
  return sampled;
}

export async function getPOIsAlongRoute(coordinates: [number, number][], vehicleType: 'EV' | 'ICE'): Promise<POI[]> {
  // Limit to 15 points to keep query light
  const sampledPoints = sampleRoutePoints(coordinates, 15);
  
  // Reduced radius to 3000m (3km) to find POIs closer to the route
  const radius = 3000;
  const amenity = vehicleType === 'EV' ? 'charging_station' : 'fuel';
  
  let queryParts = '';
  sampledPoints.forEach(pt => {
    queryParts += `node["amenity"="${amenity}"](around:${radius},${pt[0]},${pt[1]});`;
  });

  // Increased timeout to 45s
  const query = `
    [out:json][timeout:45];
    (
      ${queryParts}
    );
    out body;
    >;
    out skel qt;
  `;

  let lastError;

  // Try each server until one works
  for (const server of OVERPASS_SERVERS) {
    try {
      const response = await axios.post(server, query, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 50000 // Client-side timeout slightly larger than query timeout
      });

      // Deduplicate results based on ID
      const seenIds = new Set();
      const uniquePOIs: POI[] = [];

      response.data.elements.forEach((el: any) => {
        if (!seenIds.has(el.id)) {
          seenIds.add(el.id);
          uniquePOIs.push({
            id: el.id,
            lat: el.lat,
            lon: el.lon,
            name: el.tags.name || (vehicleType === 'EV' ? 'Charging Station' : 'Gas Station'),
            type: vehicleType === 'EV' ? 'ev_charging' : 'fuel',
            tags: el.tags,
          });
        }
      });

      return uniquePOIs;
    } catch (error) {
      console.warn(`Failed to fetch POIs from ${server}:`, error);
      lastError = error;
      // Continue to next server
    }
  }

  console.error('All Overpass servers failed:', lastError);
  return [];
}


