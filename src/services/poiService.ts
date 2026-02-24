import axios from 'axios';

export interface POI {
  id: number;
  lat: number;
  lon: number;
  name: string;
  type: 'ev_charging' | 'fuel' | 'other';
  tags: Record<string, string>;
}

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

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

function sampleRoutePoints(coordinates: [number, number][], intervalKm: number): [number, number][] {
  const sampled: [number, number][] = [];
  if (coordinates.length === 0) return sampled;

  sampled.push(coordinates[0]);
  let lastPoint = coordinates[0];

  for (let i = 1; i < coordinates.length; i++) {
    const currentPoint = coordinates[i];
    const dist = getDistanceFromLatLonInKm(lastPoint[0], lastPoint[1], currentPoint[0], currentPoint[1]);
    
    if (dist >= intervalKm) {
      sampled.push(currentPoint);
      lastPoint = currentPoint;
    }
  }
  
  // Always include the end point
  sampled.push(coordinates[coordinates.length - 1]);
  return sampled;
}

export async function getPOIsAlongRoute(coordinates: [number, number][], vehicleType: 'EV' | 'ICE'): Promise<POI[]> {
  // Sample points every 25km to avoid massive queries
  // For short routes, this might result in few points, so we ensure a minimum number of samples if needed,
  // but the loop above handles it naturally (start + end always included).
  const sampledPoints = sampleRoutePoints(coordinates, 25);
  
  // Construct Overpass query using 'around' filter for each point
  // Limit to 5000m (5km) radius
  const radius = 5000;
  const amenity = vehicleType === 'EV' ? 'charging_station' : 'fuel';
  
  // Build the query parts
  // We batch them to avoid query string length limits if necessary, but for ~20-30 points it's fine.
  // If the route is very long (1000km / 25km = 40 points), it's okay.
  
  let queryParts = '';
  sampledPoints.forEach(pt => {
    queryParts += `node["amenity"="${amenity}"](around:${radius},${pt[0]},${pt[1]});`;
  });

  const query = `
    [out:json][timeout:25];
    (
      ${queryParts}
    );
    out body;
    >;
    out skel qt;
  `;

  try {
    const response = await axios.post(OVERPASS_API_URL, query, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
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
    console.error('Error fetching POIs:', error);
    return [];
  }
}

