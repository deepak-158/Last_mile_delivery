/**
 * Haversine formula: calculates distance in km between two lat/long points.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Calculate volumetric weight from dimensions (in cm).
 * Formula: (L × B × H) / 5000
 */
export function calculateVolumetricWeight(
  lengthCm: number,
  breadthCm: number,
  heightCm: number
): number {
  return (lengthCm * breadthCm * heightCm) / 5000;
}

/**
 * Billable weight is the greater of actual weight and volumetric weight.
 */
export function calculateBillableWeight(
  actualWeightKg: number,
  volumetricWeightKg: number
): number {
  return Math.max(actualWeightKg, volumetricWeightKg);
}

export interface RoutingResult {
  distanceKm: number;
  durationMinutes: number;
  source: 'OSRM_ROUTING_ENGINE' | 'GEODESIC_HAVERSINE';
  geometry?: Array<[number, number]>;
}

/**
 * Real Road & Route Distance Calculator
 * Queries the Open Source Routing Machine (OSRM) driving API with fallback to winding Haversine.
 */
export async function calculateRoadDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): Promise<RoutingResult> {
  if (lat1 === lat2 && lon1 === lon2) {
    return {
      distanceKm: 0,
      durationMinutes: 0,
      source: 'GEODESIC_HAVERSINE',
      geometry: [[lat1, lon1]],
    };
  }

  // 1. Try real OpenStreetMap OSRM routing API
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (response.ok) {
      const data: any = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const distKm = Math.round((route.distance / 1000) * 10) / 10;
        const durMin = Math.round(route.duration / 60);

        let coords: Array<[number, number]> = [];
        if (route.geometry && Array.isArray(route.geometry.coordinates)) {
          coords = route.geometry.coordinates.map((pt: [number, number]) => [pt[1], pt[0]]);
        }

        return {
          distanceKm: distKm < 1 ? 1.0 : distKm,
          durationMinutes: durMin < 5 ? 5 : durMin,
          source: 'OSRM_ROUTING_ENGINE',
          geometry: coords,
        };
      }
    }
  } catch {
    // Network fallback
  }

  // 2. High-precision Geodesic fallback with road winding factor (1.28x for Indian terrain)
  const aerialDist = haversineDistance(lat1, lon1, lat2, lon2);
  const roadDist = Math.round(Math.max(1.0, aerialDist * 1.28) * 10) / 10;
  const estDuration = Math.max(5, Math.round(roadDist * 2.2));

  return {
    distanceKm: roadDist,
    durationMinutes: estDuration,
    source: 'GEODESIC_HAVERSINE',
    geometry: [
      [lat1, lon1],
      [(lat1 + lat2) / 2, (lon1 + lon2) / 2],
      [lat2, lon2],
    ],
  };
}

export interface ETABreakdown {
  transitDistanceKm: number;
  pureDrivingMinutes: number;
  preparationBufferMinutes: number;
  doorstepHandoverMinutes: number;
  totalEstimatedMinutes: number;
  serviceLevelAgreement: 'HYPERLOCAL_SAME_DAY' | 'REGIONAL_EXPRESS' | 'NATIONAL_FREIGHT';
  promisedDeliveryWindow: {
    earliest: string;
    latest: string;
    displayString: string;
  };
}

/**
 * Multi-Stage Logistics SLA & Delivery Window Calculator
 */
export function computeLogisticsETA(
  distanceKm: number,
  drivingMinutes: number,
  rateType: string
): ETABreakdown {
  const isIntra = rateType === 'INTRA_ZONE';
  const prepBuffer = isIntra ? 15 : 60;
  const handoverBuffer = isIntra ? 10 : 20;

  const now = new Date();

  if (isIntra) {
    const totalMinutes = prepBuffer + Math.max(drivingMinutes, Math.round(distanceKm * 2.2)) + handoverBuffer;
    const earliest = new Date(now.getTime() + Math.max(15, totalMinutes - 15) * 60000);
    const latest = new Date(now.getTime() + (totalMinutes + 30) * 60000);

    const formatTime = (d: Date) =>
      d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    return {
      transitDistanceKm: distanceKm,
      pureDrivingMinutes: drivingMinutes,
      preparationBufferMinutes: prepBuffer,
      doorstepHandoverMinutes: handoverBuffer,
      totalEstimatedMinutes: totalMinutes,
      serviceLevelAgreement: 'HYPERLOCAL_SAME_DAY',
      promisedDeliveryWindow: {
        earliest: earliest.toISOString(),
        latest: latest.toISOString(),
        displayString: `Today, between ${formatTime(earliest)} - ${formatTime(latest)}`,
      },
    };
  } else {
    const transitHours = Math.max(18, Math.round(distanceKm / 45) + 8);
    const totalMinutes = transitHours * 60;
    const sla = distanceKm > 800 ? 'NATIONAL_FREIGHT' : 'REGIONAL_EXPRESS';
    const days = Math.max(1, Math.ceil(transitHours / 24));

    const earliest = new Date(now.getTime() + days * 24 * 3600000);
    const latest = new Date(now.getTime() + (days + 1) * 24 * 3600000);

    const formatDate = (d: Date) =>
      d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

    return {
      transitDistanceKm: distanceKm,
      pureDrivingMinutes: drivingMinutes,
      preparationBufferMinutes: prepBuffer,
      doorstepHandoverMinutes: handoverBuffer,
      totalEstimatedMinutes: totalMinutes,
      serviceLevelAgreement: sla,
      promisedDeliveryWindow: {
        earliest: earliest.toISOString(),
        latest: latest.toISOString(),
        displayString: `${formatDate(earliest)} – ${formatDate(latest)} (${days} to ${days + 1} business days)`,
      },
    };
  }
}
