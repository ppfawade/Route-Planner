import axios from 'axios';
import polyline from 'polyline';

export interface Location {
  lat: number;
  lon: number;
  display_name: string;
}

export interface RouteData {
  coordinates: [number, number][];
  distance: number; // in meters
  duration: number; // in seconds
}

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';
const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

export async function searchLocation(query: string): Promise<Location[]> {
  try {
    const response = await axios.get(NOMINATIM_BASE_URL, {
      params: {
        q: query,
        format: 'json',
        limit: 5,
      },
    });
    return response.data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
      display_name: item.display_name,
    }));
  } catch (error) {
    console.error('Error searching location:', error);
    return [];
  }
}

export async function getRoute(start: Location, end: Location): Promise<RouteData | null> {
  try {
    const url = `${OSRM_BASE_URL}/${start.lon},${start.lat};${end.lon},${end.lat}?overview=full&geometries=polyline`;
    const response = await axios.get(url);
    
    if (response.data.routes && response.data.routes.length > 0) {
      const route = response.data.routes[0];
      const decoded = polyline.decode(route.geometry);
      return {
        coordinates: decoded, // [lat, lon]
        distance: route.distance,
        duration: route.duration,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting route:', error);
    return null;
  }
}
