import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Zap, Fuel, MapPin } from 'lucide-react';
import { Location, RouteData } from '../services/routeService';
import { POI } from '../services/poiService';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom DivIcons
const createCustomIcon = (type: 'ev' | 'gas' | 'start' | 'end') => {
  let iconComponent;
  let bgColor;
  
  switch (type) {
    case 'ev':
      iconComponent = <Zap className="w-5 h-5 text-white" fill="currentColor" />;
      bgColor = 'bg-green-500';
      break;
    case 'gas':
      iconComponent = <Fuel className="w-5 h-5 text-white" fill="currentColor" />;
      bgColor = 'bg-orange-500';
      break;
    case 'start':
      iconComponent = <MapPin className="w-5 h-5 text-white" fill="currentColor" />;
      bgColor = 'bg-blue-600';
      break;
    case 'end':
      iconComponent = <MapPin className="w-5 h-5 text-white" fill="currentColor" />;
      bgColor = 'bg-red-600';
      break;
  }

  const html = renderToStaticMarkup(
    <div className={`w-8 h-8 ${bgColor} rounded-full flex items-center justify-center shadow-lg border-2 border-white`}>
      {iconComponent}
    </div>
  );

  return new L.DivIcon({
    html: html,
    className: 'custom-marker-icon', // We need to reset default leaflet styles for divIcon
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const evIcon = createCustomIcon('ev');
const gasIcon = createCustomIcon('gas');
const startIcon = createCustomIcon('start');
const endIcon = createCustomIcon('end');

interface MapViewProps {
  start: Location | null;
  end: Location | null;
  route: RouteData | null;
  pois: POI[];
}

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

function FitBounds({ route }: { route: RouteData | null }) {
  const map = useMap();
  useEffect(() => {
    if (route && route.coordinates.length > 0) {
      const bounds = L.latLngBounds(route.coordinates);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);
  return null;
}

export default function MapView({ start, end, route, pois }: MapViewProps) {
  const center: [number, number] = start ? [start.lat, start.lon] : [37.7749, -122.4194]; // Default SF
  const zoom = 13;

  return (
    <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%', zIndex: 0 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {start && (
        <Marker position={[start.lat, start.lon]} icon={startIcon}>
          <Popup>
            <div className="font-sans font-bold">Start: {start.display_name}</div>
          </Popup>
        </Marker>
      )}
      
      {end && (
        <Marker position={[end.lat, end.lon]} icon={endIcon}>
          <Popup>
            <div className="font-sans font-bold">Destination: {end.display_name}</div>
          </Popup>
        </Marker>
      )}

      {route && <Polyline positions={route.coordinates} color="#4f46e5" weight={5} opacity={0.7} />}
      
      {route && <FitBounds route={route} />}

      {pois.map((poi) => (
        <Marker 
          key={poi.id} 
          position={[poi.lat, poi.lon]} 
          icon={poi.type === 'ev_charging' ? evIcon : gasIcon}
        >
          <Popup>
            <div className="font-sans min-w-[200px]">
              <h3 className="font-bold text-lg mb-1">{poi.name}</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded-full text-white ${poi.type === 'ev_charging' ? 'bg-green-500' : 'bg-orange-500'}`}>
                  {poi.type === 'ev_charging' ? 'EV Charging' : 'Gas Station'}
                </span>
                {/* Check for fast charging tags */}
                {poi.type === 'ev_charging' && (poi.tags['socket:ccs'] || poi.tags['socket:tesla_supercharger']) && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500 text-white">Fast</span>
                )}
              </div>
              
              <div className="space-y-1 text-sm text-gray-600">
                {poi.tags.operator && <p><strong>Operator:</strong> {poi.tags.operator}</p>}
                {poi.tags.capacity && <p><strong>Capacity:</strong> {poi.tags.capacity}</p>}
                {poi.tags.opening_hours && <p><strong>Hours:</strong> {poi.tags.opening_hours}</p>}
                {poi.tags.fee && <p><strong>Fee:</strong> {poi.tags.fee === 'yes' ? 'Paid' : poi.tags.fee}</p>}
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
      
      {!route && start && <ChangeView center={[start.lat, start.lon]} zoom={13} />}
    </MapContainer>
  );
}

