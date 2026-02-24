import { useState } from 'react';
import { Search, MapPin, Navigation, Zap, Fuel, Loader2, Sparkles, Image as ImageIcon, Clock, Gauge } from 'lucide-react';
import { searchLocation, Location, getRoute, RouteData } from '../services/routeService';
import { getPOIsAlongRoute, POI } from '../services/poiService';
import { getGeographicalFeatures } from '../services/aiService';
import { cn } from '../lib/utils';
import TripSnapshotModal from './TripSnapshotModal';

interface SidebarProps {
  onRouteCalculated: (start: Location, end: Location, route: RouteData, pois: POI[]) => void;
  onReset: () => void;
}

export default function Sidebar({ onRouteCalculated, onReset }: SidebarProps) {
  const [startQuery, setStartQuery] = useState('');
  const [endQuery, setEndQuery] = useState('');
  const [vehicleType, setVehicleType] = useState<'EV' | 'ICE'>('EV');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [endLocation, setEndLocation] = useState<Location | null>(null);
  const [suggestions, setSuggestions] = useState<{ type: 'start' | 'end', data: Location[] } | null>(null);
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null);
  const [currentPois, setCurrentPois] = useState<POI[]>([]);

  // Snapshot Modal State
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const [geoFeatures, setGeoFeatures] = useState<string[]>([]);
  const [snapshotLoading, setSnapshotLoading] = useState(false);

  const handleSearch = async (type: 'start' | 'end', query: string) => {
    if (query.length < 3) return;
    const results = await searchLocation(query);
    setSuggestions({ type, data: results });
  };

  const selectLocation = (type: 'start' | 'end', loc: Location) => {
    if (type === 'start') {
      setStartLocation(loc);
      setStartQuery(loc.display_name);
    } else {
      setEndLocation(loc);
      setEndQuery(loc.display_name);
    }
    setSuggestions(null);
  };

  const calculateRoute = async () => {
    if (!startLocation || !endLocation) {
      setError('Please select both start and end locations.');
      return;
    }
    setError('');
    setLoading(true);
    setCurrentRoute(null);
    setCurrentPois([]);

    try {
      const route = await getRoute(startLocation, endLocation);
      if (!route) {
        setError('Could not find a route between these locations.');
        setLoading(false);
        return;
      }
      setCurrentRoute(route);

      const pois = await getPOIsAlongRoute(route.coordinates, vehicleType);
      setCurrentPois(pois);
      
      onRouteCalculated(startLocation, endLocation, route, pois);
    } catch (err) {
      setError('An error occurred while calculating the route.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSnapshot = async () => {
    if (!startLocation || !endLocation) return;
    
    setSnapshotLoading(true);
    try {
      // Fetch geo features before opening
      const features = await getGeographicalFeatures(
        startLocation.display_name,
        endLocation.display_name
      );
      setGeoFeatures(features);
      setIsSnapshotOpen(true);
    } catch (err) {
      console.error(err);
      // Open anyway even if AI fails
      setGeoFeatures([]);
      setIsSnapshotOpen(true);
    } finally {
      setSnapshotLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const calculateAvgSpeed = (distanceMeters: number, durationSeconds: number) => {
    if (durationSeconds === 0) return 0;
    const km = distanceMeters / 1000;
    const hours = durationSeconds / 3600;
    return Math.round(km / hours);
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white shadow-xl z-10 relative">
        <div className="p-6 border-b border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Navigation className="w-6 h-6 text-indigo-600" />
            EcoRoute
          </h1>
          <p className="text-sm text-gray-500 mt-1">Plan your journey with smart stops.</p>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Vehicle Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Vehicle Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setVehicleType('EV')}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                  vehicleType === 'EV' 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-200" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Zap className="w-4 h-4" />
                <span>Electric</span>
              </button>
              <button
                onClick={() => setVehicleType('ICE')}
                className={cn(
                  "flex items-center justify-center gap-2 p-3 rounded-xl border transition-all",
                  vehicleType === 'ICE' 
                    ? "bg-orange-50 border-orange-200 text-orange-700 ring-1 ring-orange-200" 
                    : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                )}
              >
                <Fuel className="w-4 h-4" />
                <span>Combustion</span>
              </button>
            </div>
          </div>

          {/* Route Inputs */}
          <div className="space-y-4 relative">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Start Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={startQuery}
                  onChange={(e) => {
                    setStartQuery(e.target.value);
                    handleSearch('start', e.target.value);
                  }}
                  placeholder="Enter start location..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              {suggestions?.type === 'start' && suggestions.data.length > 0 && (
                <div className="absolute z-50 w-full bg-white mt-1 rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                  {suggestions.data.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectLocation('start', loc)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-50 last:border-0"
                    >
                      {loc.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Destination</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={endQuery}
                  onChange={(e) => {
                    setEndQuery(e.target.value);
                    handleSearch('end', e.target.value);
                  }}
                  placeholder="Enter destination..."
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                />
              </div>
              {suggestions?.type === 'end' && suggestions.data.length > 0 && (
                <div className="absolute z-50 w-full bg-white mt-1 rounded-lg shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                  {suggestions.data.map((loc, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectLocation('end', loc)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 border-b border-gray-50 last:border-0"
                    >
                      {loc.display_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={calculateRoute}
              disabled={loading || !startLocation || !endLocation}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Navigation className="w-5 h-5" />
                  Find Route
                </>
              )}
            </button>
            
            <button
              onClick={() => {
                setStartQuery('');
                setEndQuery('');
                setStartLocation(null);
                setEndLocation(null);
                setCurrentRoute(null);
                setCurrentPois([]);
                onReset();
              }}
              className="px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
              title="Reset"
            >
              Reset
            </button>
          </div>

          {/* Detailed Route Stats Section */}
          {currentRoute && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-indigo-500" />
                  Route Details
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Gauge className="w-3 h-3" />
                      Distance
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {(currentRoute.distance / 1000).toFixed(1)} <span className="text-xs font-normal text-gray-500">km</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm">
                    <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                      <Clock className="w-3 h-3" />
                      Duration
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {formatDuration(currentRoute.duration)}
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-sm col-span-2 flex justify-between items-center">
                    <div className="flex items-center gap-2 text-gray-500 text-xs">
                      <Zap className="w-3 h-3" />
                      Avg. Speed
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                      {calculateAvgSpeed(currentRoute.distance, currentRoute.duration)} <span className="text-xs font-normal text-gray-500">km/h</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Snapshot Button */}
              <button
                onClick={handleOpenSnapshot}
                disabled={snapshotLoading}
                className="w-full py-3 bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white font-medium rounded-xl shadow-sm transition-all flex items-center justify-center gap-2"
              >
                {snapshotLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating Snapshot...
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-5 h-5" />
                    Generate Trip Snapshot
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-center text-gray-400">
            Powered by OpenStreetMap & Overpass API
          </p>
        </div>
      </div>

      {/* Snapshot Modal */}
      {startLocation && endLocation && currentRoute && (
        <TripSnapshotModal
          isOpen={isSnapshotOpen}
          onClose={() => setIsSnapshotOpen(false)}
          start={startLocation}
          end={endLocation}
          route={currentRoute}
          pois={currentPois}
          geoFeatures={geoFeatures}
        />
      )}
    </>
  );
}


