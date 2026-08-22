import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

interface RouteMapVisualizerProps {
  pickupLocation: {
    city: string;
    state?: string;
    locality?: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  };
  dropLocation: {
    city: string;
    state?: string;
    locality?: string;
    pincode: string;
    latitude?: number;
    longitude?: number;
  };
  pickupZone: string;
  dropZone: string;
  distanceKm: number;
  rateType: string;
  estimatedDurationMinutes?: number;
  routingEngine?: string;
  routeGeometry?: Array<[number, number]>;
}

export default function RouteMapVisualizer({
  pickupLocation,
  dropLocation,
  pickupZone,
  dropZone,
  distanceKm,
  rateType,
  estimatedDurationMinutes,
  routingEngine = 'OSRM Routing Machine',
  routeGeometry,
}: RouteMapVisualizerProps) {
  const isIntraZone = rateType === 'INTRA_ZONE';
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const defaultOrigin = { lat: 28.6139, lng: 77.2090 };
  const defaultDrop = { lat: 23.2599, lng: 77.4126 };

  const originLat = pickupLocation.latitude || defaultOrigin.lat;
  const originLng = pickupLocation.longitude || defaultOrigin.lng;
  const dropLat = dropLocation.latitude || defaultDrop.lat;
  const dropLng = dropLocation.longitude || defaultDrop.lng;

  const estMinutes = estimatedDurationMinutes || (isIntraZone ? Math.round(distanceKm * 2.2) : Math.round(distanceKm * 1.5));
  const etaFormatted = isIntraZone
    ? `${Math.max(1, Math.round(estMinutes / 60))} to ${Math.max(2, Math.round(estMinutes / 60) + 1)} Hours (Express Same-Day)`
    : `${Math.ceil(distanceKm / 400)} to ${Math.ceil(distanceKm / 400) + 1} Business Days (Regional Freight)`;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    });
    mapInstanceRef.current = map;

    // CartoDB Positron high-resolution tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    // Custom Origin Pin
    const originIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="background-color: #10b981; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; box-shadow: 0 4px 10px rgba(16,185,129,0.5); border: 2px solid white;">
          📍
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    // Custom Drop Pin
    const dropIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
        <div style="background-color: #5046e4; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: bold; box-shadow: 0 4px 10px rgba(80,70,228,0.5); border: 2px solid white;">
          🏁
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const m1 = L.marker([originLat, originLng], { icon: originIcon }).addTo(map);
    m1.bindPopup(`<b>Origin (${pickupZone}):</b> ${pickupLocation.city} (${pickupLocation.pincode})`);

    const m2 = L.marker([dropLat, dropLng], { icon: dropIcon }).addTo(map);
    m2.bindPopup(`<b>Destination (${dropZone}):</b> ${dropLocation.city} (${dropLocation.pincode})`);

    let polylineCoords: L.LatLngExpression[] = [
      [originLat, originLng],
      [dropLat, dropLng],
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

    // Inner dashed route line
    L.polyline(polylineCoords, {
      color: '#5046e4',
      weight: 3.5,
      dashArray: '6, 6',
      opacity: 0.9,
    }).addTo(map);

    const bounds = L.latLngBounds([originLat, originLng], [dropLat, dropLng]);
    map.fitBounds(bounds, { padding: [40, 40] });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [originLat, originLng, dropLat, dropLng, routeGeometry, pickupLocation, dropLocation, pickupZone, dropZone]);

  return (
    <div className="delivero-card p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
            <span className="text-emerald-500">🌐</span> Live OpenStreetMap Routing & Spatial Corridor
          </h4>
          <p className="text-3xs text-slate-500 font-medium">Real road network distance calculated via {routingEngine}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-black px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
            📍 {distanceKm} km Road Distance
          </span>
          <span className="text-xs font-bold px-3 py-1 rounded-xl bg-indigo-50 text-[#5046e4] border border-indigo-100">
            {isIntraZone ? '⚡ Intra-Zone Direct' : '✈️ Inter-Zone Freight'}
          </span>
        </div>
      </div>

      {/* Real Interactive Map View */}
      <div className="h-64 rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
        <div ref={mapContainerRef} className="w-full h-full z-0" />
      </div>

      {/* Corridor Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-3xs uppercase font-bold">Transit Estimate</span>
          <p className="font-bold text-slate-900 mt-0.5">{etaFormatted}</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-3xs uppercase font-bold">Origin & Drop Zones</span>
          <p className="font-bold text-[#5046e4] mt-0.5">
            {pickupZone} ➔ {dropZone}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-slate-500 text-3xs uppercase font-bold">Routing Algorithm</span>
          <p className="font-bold text-emerald-700 mt-0.5">📡 {routingEngine}</p>
        </div>
      </div>
    </div>
  );
}
