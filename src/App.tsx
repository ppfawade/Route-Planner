/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import { Location, RouteData } from './services/routeService';
import { POI } from './services/poiService';

export default function App() {
  const [start, setStart] = useState<Location | null>(null);
  const [end, setEnd] = useState<Location | null>(null);
  const [route, setRoute] = useState<RouteData | null>(null);
  const [pois, setPois] = useState<POI[]>([]);

  const handleRouteCalculated = (
    startLoc: Location,
    endLoc: Location,
    routeData: RouteData,
    poiData: POI[]
  ) => {
    setStart(startLoc);
    setEnd(endLoc);
    setRoute(routeData);
    setPois(poiData);
  };

  const handleReset = () => {
    setStart(null);
    setEnd(null);
    setRoute(null);
    setPois([]);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-gray-100 overflow-hidden">
      {/* Sidebar - Fixed width on desktop, half height on mobile */}
      <div className="w-full md:w-96 h-[50vh] md:h-full flex-shrink-0 z-20 shadow-xl order-2 md:order-1 relative">
        <Sidebar onRouteCalculated={handleRouteCalculated} onReset={handleReset} />
      </div>

      {/* Map Area - Flexible */}
      <div className="flex-1 h-[50vh] md:h-full relative z-0 order-1 md:order-2">
        <MapView start={start} end={end} route={route} pois={pois} />
        
        {/* Overlay Stats Card (Visible when route exists) */}
        {route && (
          <div className="absolute top-4 right-4 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-200 max-w-xs hidden md:block">
            <h3 className="font-semibold text-gray-900 mb-2">Trip Summary</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Distance:</span>
                <span className="font-medium text-gray-900">{(route.distance / 1000).toFixed(1)} km</span>
              </div>
              <div className="flex justify-between">
                <span>Est. Time:</span>
                <span className="font-medium text-gray-900">{(route.duration / 60).toFixed(0)} min</span>
              </div>
              <div className="flex justify-between">
                <span>Stations Found:</span>
                <span className="font-medium text-gray-900">{pois.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


