import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface DeliveroMapProps {
  pickupCoords?: { lat: number; lng: number };
  dropCoords?: { lat: number; lng: number };
  pickupAddress?: string;
  dropAddress?: string;
  routeGeometry?: Array<[number, number]>;
  etaMinutes?: number;
  className?: string;
  showControls?: boolean;
}

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'gurugram': { lat: 28.4595, lng: 77.0266 },
  'gurgaon': { lat: 28.4595, lng: 77.0266 },
  'noida': { lat: 28.5355, lng: 77.3910 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'lucknow': { lat: 26.8467, lng: 80.9462 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'pune': { lat: 18.5204, lng: 73.8567 },
  'kolkata': { lat: 22.5726, lng: 88.3539 },
  'ahmedabad': { lat: 23.0225, lng: 72.5714 },
  'bhopal': { lat: 23.2599, lng: 77.4126 },
  'indore': { lat: 22.7196, lng: 75.8577 },
  'sehore': { lat: 23.2033, lng: 77.0844 },
  'jhansi': { lat: 25.4484, lng: 78.5685 },
};

function resolveCoordinate(
  coords?: { lat?: number; lng?: number },
  address?: string,
  fallback = { lat: 28.6139, lng: 77.2090 }
): { lat: number; lng: number } {
  if (coords?.lat && coords?.lng && (coords.lat !== 0 || coords.lng !== 0)) {
    return { lat: Number(coords.lat), lng: Number(coords.lng) };
  }
  if (address) {
    const lower = address.toLowerCase();
    for (const [cityName, point] of Object.entries(CITY_COORDINATES)) {
      if (lower.includes(cityName)) {
        return point;
      }
    }
  }
  return fallback;
}

export default function DeliveroMap({
  pickupCoords,
  dropCoords,
  pickupAddress = 'Origin Hub',
  dropAddress = 'Destination Address',
  routeGeometry,
  etaMinutes = 15,
  className = 'h-72',
  showControls = true,
}: DeliveroMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const origin = resolveCoordinate(pickupCoords, pickupAddress, { lat: 28.6139, lng: 77.2090 });
  const dest = resolveCoordinate(dropCoords, dropAddress, { lat: 28.4595, lng: 77.0266 });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Destroy existing instance if any
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // High quality OpenStreetMap tiles (CartoDB Positron for clean SaaS look)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Origin Icon
    const originIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="background-color: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; box-shadow: 0 4px 10px rgba(16,185,129,0.5); border: 2px solid white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    // Destination Icon
    const destIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="background-color: #5046e4; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: bold; box-shadow: 0 4px 10px rgba(80,70,228,0.5); border: 2px solid white;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/></svg>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const m1 = L.marker([origin.lat, origin.lng], { icon: originIcon }).addTo(map);
    m1.bindPopup(`<b>Pickup:</b> ${pickupAddress}`);

    const m2 = L.marker([dest.lat, dest.lng], { icon: destIcon }).addTo(map);
    m2.bindPopup(`<b>Destination:</b> ${dropAddress}`);

    // Route Polyline
    let polylineCoords: L.LatLngExpression[] = [
      [origin.lat, origin.lng],
      [dest.lat, dest.lng],
    ];

    if (routeGeometry && routeGeometry.length > 0) {
      polylineCoords = routeGeometry.map((pt) => [pt[0], pt[1]]);
    }

    // Outer glow polyline
    L.polyline(polylineCoords, {
      color: '#818cf8',
      weight: 6,
      opacity: 0.5,
    }).addTo(map);

    // Inner route polyline
    L.polyline(polylineCoords, {
      color: '#5046e4',
      weight: 3.5,
      dashArray: '6, 6',
      opacity: 0.9,
    }).addTo(map);

    // Fit map bounds
    const bounds = L.latLngBounds([origin.lat, origin.lng], [dest.lat, dest.lng]);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [origin.lat, origin.lng, dest.lat, dest.lng, routeGeometry, pickupAddress, dropAddress]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-inner ${className}`}>
      {/* Real Leaflet Map Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Floating Info Overlay */}
      {showControls && (
        <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-md flex items-center gap-2 text-2xs font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-slate-800 font-bold">OpenStreetMap Live Radar</span>
          <span className="text-slate-300">•</span>
          <span className="text-[#5046e4] font-extrabold">ETA ~{etaMinutes} mins</span>
        </div>
      )}
    </div>
  );
}
