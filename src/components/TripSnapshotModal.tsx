import { useRef, useState, useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, useMap } from 'react-leaflet';
import html2canvas from 'html2canvas';
import { X, Download, Share2, Map as MapIcon, Mountain, Compass, Clock, Gauge, Navigation } from 'lucide-react';
import { Location, RouteData } from '../services/routeService';
import { POI } from '../services/poiService';
import L from 'leaflet';

// Minimal icons for the snapshot
const createDotIcon = (color: string) => {
  return new L.DivIcon({
    className: 'bg-transparent',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
  });
};

interface TripSnapshotModalProps {
  isOpen: boolean;
  onClose: () => void;
  start: Location;
  end: Location;
  route: RouteData;
  pois: POI[];
}

// Component to handle map fitting and resizing
function MapController({ route }: { route: RouteData }) {
  const map = useMap();

  useEffect(() => {
    // Invalidate size to ensure map renders correctly in modal
    map.invalidateSize();
    
    if (route && route.coordinates.length > 0) {
      const bounds = L.latLngBounds(route.coordinates);
      map.fitBounds(bounds, { padding: [40, 40], animate: false });
    }
  }, [route, map]);

  return null;
}

export default function TripSnapshotModal({
  isOpen,
  onClose,
  start,
  end,
  route,
  pois
}: TripSnapshotModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  if (!isOpen) return null;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setCapturing(true);
    try {
      // Wait a moment for map tiles to settle
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const canvas = await html2canvas(cardRef.current, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `trip-snapshot-${start.display_name.split(',')[0]}-to-${end.display_name.split(',')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("Snapshot failed:", err);
      alert("Could not generate image. Please try taking a screenshot manually.");
    } finally {
      setCapturing(false);
    }
  };

  const distanceKm = (route.distance / 1000).toFixed(1);
  const durationHrs = Math.floor(route.duration / 3600);
  const durationMins = Math.round((route.duration % 3600) / 60);
  const avgSpeed = Math.round((route.distance / 1000) / (route.duration / 3600));

  return (
    <div className="fixed inset-0 z-[2000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-indigo-600" />
            Trip Snapshot
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-gray-100 flex justify-center items-start">
          {/* The Card to Capture */}
          <div 
            ref={cardRef} 
            className="w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border flex flex-col"
            style={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb' }}
          >
            {/* Map Section (Hero) */}
            <div className="h-64 w-full relative" style={{ backgroundColor: '#f3f4f6' }}>
               <MapContainer 
                 zoomControl={false} 
                 attributionControl={false}
                 dragging={false}
                 scrollWheelZoom={false}
                 doubleClickZoom={false}
                 touchZoom={false}
                 zoomAnimation={false}
                 fadeAnimation={false}
                 markerZoomAnimation={false}
                 preferCanvas={true}
                 style={{ height: '100%', width: '100%' }}
               >
                 <TileLayer
                   url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                   crossOrigin="anonymous"
                 />
                 <Polyline positions={route.coordinates} color="#4f46e5" weight={5} opacity={0.8} />
                 <Marker position={[start.lat, start.lon]} icon={createDotIcon('#2563eb')} />
                 <Marker position={[end.lat, end.lon]} icon={createDotIcon('#dc2626')} />
                 {pois.slice(0, 15).map(p => (
                   <Marker key={p.id} position={[p.lat, p.lon]} icon={createDotIcon('#10b981')} />
                 ))}
                 <MapController route={route} />
               </MapContainer>
               
               {/* Compass Overlay */}
               <div className="absolute top-4 right-4 backdrop-blur rounded-full shadow-md z-[1000]" style={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', padding: '6px' }}>
                 <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <circle cx="16" cy="16" r="14" stroke="#e5e7eb" strokeWidth="1" fill="white" />
                   <text x="16" y="9" textAnchor="middle" fontSize="8" fontWeight="900" fill="#ef4444" style={{ fontFamily: 'sans-serif' }}>N</text>
                   <path d="M16 10L19 16H13L16 10Z" fill="#ef4444" />
                   <path d="M16 22L13 16H19L16 22Z" fill="#9ca3af" />
                   <circle cx="16" cy="16" r="1.5" fill="white" />
                 </svg>
               </div>

               {/* Brand Overlay */}
               <div className="absolute bottom-4 left-4 backdrop-blur px-3 py-1.5 rounded-lg shadow-md z-[1000] flex items-center gap-2" style={{ backgroundColor: 'rgba(79, 70, 229, 0.9)' }}>
                 <Navigation className="w-4 h-4" style={{ color: '#ffffff' }} />
                 <span className="text-xs font-bold tracking-wide uppercase" style={{ color: '#ffffff' }}>EcoRoute</span>
               </div>
            </div>

            {/* Content Section */}
            <div className="p-6">
              {/* Route Summary Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
                  <div className="flex justify-center mb-1" style={{ color: '#9ca3af' }}>
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold" style={{ color: '#111827' }}>{distanceKm}</div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: '#6b7280' }}>Kilometers</div>
                </div>
                <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
                  <div className="flex justify-center mb-1" style={{ color: '#9ca3af' }}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold" style={{ color: '#111827' }}>{durationHrs}h {durationMins}m</div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: '#6b7280' }}>Duration</div>
                </div>
                <div className="p-3 rounded-xl border text-center" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6' }}>
                  <div className="flex justify-center mb-1" style={{ color: '#9ca3af' }}>
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div className="text-lg font-bold" style={{ color: '#111827' }}>{avgSpeed}</div>
                  <div className="text-[10px] uppercase font-semibold tracking-wider" style={{ color: '#6b7280' }}>km/h Avg</div>
                </div>
              </div>

              {/* Timeline / Stops */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full ring-4" style={{ backgroundColor: '#2563eb', '--tw-ring-color': '#eff6ff' } as any} />
                    <div className="w-0.5 h-full my-1" style={{ backgroundColor: '#f3f4f6' }} />
                  </div>
                  <div className="pb-4">
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#2563eb' }}>Start</p>
                    <p className="font-medium text-lg leading-tight" style={{ color: '#111827' }}>{start.display_name.split(',')[0]}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{start.display_name.split(',').slice(1, 3).join(',')}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full ring-4" style={{ backgroundColor: '#dc2626', '--tw-ring-color': '#fef2f2' } as any} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#dc2626' }}>Destination</p>
                    <p className="font-medium text-lg leading-tight" style={{ color: '#111827' }}>{end.display_name.split(',')[0]}</p>
                    <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{end.display_name.split(',').slice(1, 3).join(',')}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t flex justify-between items-center text-[10px] font-mono uppercase tracking-wide" style={{ backgroundColor: '#f9fafb', borderColor: '#f3f4f6', color: '#9ca3af' }}>
               <span>Generated on {new Date().toLocaleDateString()}</span>
               <span>EcoRoute Planner</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
          <button 
            onClick={handleDownload}
            disabled={capturing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            {capturing ? (
              <>Processing...</>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Image
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

