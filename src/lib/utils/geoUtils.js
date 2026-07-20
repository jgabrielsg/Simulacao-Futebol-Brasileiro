/**
 * Geographical and Logistics Utilities
 */

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 === undefined || lon1 === undefined || lat2 === undefined || lon2 === undefined) return 0;
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates road-adjusted travel distance (Haversine * 1.3 road factor)
 */
export function estimatedRoadDistance(lat1, lon1, lat2, lon2) {
  return haversineDistance(lat1, lon1, lat2, lon2) * 1.3;
}

/**
 * Calculates the geographic centroid (mean lat, lon) of a list of teams.
 */
export function calculateCentroid(teams) {
  if (!teams || teams.length === 0) return { lat: -14.235, lon: -51.925 };
  let totalLat = 0;
  let totalLon = 0;
  let count = 0;

  for (const team of teams) {
    if (team && typeof team.lat === 'number' && typeof team.lon === 'number') {
      totalLat += team.lat;
      totalLon += team.lon;
      count++;
    }
  }

  if (count === 0) return { lat: -14.235, lon: -51.925 };
  return {
    lat: totalLat / count,
    lon: totalLon / count
  };
}

/**
 * Computes 2D Convex Hull polygon boundary points of a list of [lat, lon] coordinates.
 */
export function computeConvexHull(points) {
  if (!points || points.length < 3) return points || [];

  // Sort by lat, then lon
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  function cross(o, a, b) {
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  }

  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

/**
 * Generates curved intermediate points (Bézier arc) for flight paths between two airports
 */
export function generateCurvedPath(startLat, startLon, endLat, endLon, numPoints = 25) {
  const points = [];
  
  const midLat = (startLat + endLat) / 2;
  const midLon = (startLon + endLon) / 2;
  
  const dLat = endLat - startLat;
  const dLon = endLon - startLon;
  const distance = Math.sqrt(dLat * dLat + dLon * dLon);
  
  const curvature = 0.2 * distance;
  const ctrlLat = midLat + (dLon / (distance || 1)) * curvature;
  const ctrlLon = midLon - (dLat / (distance || 1)) * curvature;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const lat = (1 - t) * (1 - t) * startLat + 2 * (1 - t) * t * ctrlLat + t * t * endLat;
    const lon = (1 - t) * (1 - t) * startLon + 2 * (1 - t) * t * ctrlLon + t * t * endLon;
    points.push([lat, lon]);
  }

  return points;
}

/**
 * Multimodal Transport Route Builder (Animation Level 3)
 */
export function buildTransportRoute(awayTeam, homeTeam, awayHub, homeHub) {
  if (!awayTeam || !homeTeam) return null;

  const straightDist = haversineDistance(awayTeam.lat, awayTeam.lon, homeTeam.lat, homeTeam.lon);
  const roadDist = straightDist * 1.3;

  if (roadDist < 800 || !awayHub || !homeHub) {
    return {
      modal: 'BUS',
      totalDistanceKm: Math.round(roadDist),
      segments: [
        {
          type: 'BUS',
          color: '#3b82f6',
          dashArray: '5, 5',
          points: [
            [awayTeam.lat, awayTeam.lon],
            [homeTeam.lat, homeTeam.lon]
          ],
          label: `Ônibus: ${Math.round(roadDist)} km`
        }
      ]
    };
  } else {
    const leg1Dist = awayHub.dist_ate_aero_km || haversineDistance(awayTeam.lat, awayTeam.lon, awayHub.hub_aero_lat, awayHub.hub_aero_lon);
    const leg2Dist = haversineDistance(awayHub.hub_aero_lat, awayHub.hub_aero_lon, homeHub.hub_aero_lat, homeHub.hub_aero_lon);
    const leg3Dist = homeHub.dist_ate_aero_km || haversineDistance(homeHub.hub_aero_lat, homeHub.hub_aero_lon, homeTeam.lat, homeTeam.lon);
    const totalFlightTripDist = Math.round(leg1Dist + leg2Dist + leg3Dist);

    const flightArcPoints = generateCurvedPath(
      awayHub.hub_aero_lat,
      awayHub.hub_aero_lon,
      homeHub.hub_aero_lat,
      homeHub.hub_aero_lon
    );

    return {
      modal: 'FLIGHT',
      totalDistanceKm: totalFlightTripDist,
      segments: [
        {
          type: 'TRANSFER_OUT',
          color: '#eab308',
          dashArray: '3, 3',
          points: [
            [awayTeam.lat, awayTeam.lon],
            [awayHub.hub_aero_lat, awayHub.hub_aero_lon]
          ],
          label: `Translado p/ Aeroporto ${awayHub.hub_aero_iata}: ${Math.round(leg1Dist)} km`
        },
        {
          type: 'FLIGHT',
          color: '#ef4444',
          dashArray: null,
          points: flightArcPoints,
          label: `Voo (${awayHub.hub_aero_iata} ➔ ${homeHub.hub_aero_iata}): ${Math.round(leg2Dist)} km`
        },
        {
          type: 'TRANSFER_IN',
          color: '#10b981',
          dashArray: '3, 3',
          points: [
            [homeHub.hub_aero_lat, homeHub.hub_aero_lon],
            [homeTeam.lat, homeTeam.lon]
          ],
          label: `Translado p/ Estádio: ${Math.round(leg3Dist)} km`
        }
      ]
    };
  }
}
