/* =========================================================================
   External API calls (Nominatim, Overpass, OSRM, Open-Meteo).
   Each function fails soft (returns null / throws a clean Error) so callers
   can fall back to offline/cached data without try/catch sprawl everywhere.
   ========================================================================= */
import { ENDPOINTS } from './config.js';
import { haversineKm, fetchWithTimeout } from './utils.js';

export async function reverseGeocode(lat, lon) {
  try {
    const res = await fetchWithTimeout(ENDPOINTS.nominatimReverse(lat, lon), {}, 8000);
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function geocodeSearch(query) {
  try {
    const res = await fetchWithTimeout(ENDPOINTS.nominatimSearch(query), {}, 8000);
    if (!res.ok) return null;
    const arr = await res.json();
    return arr && arr.length > 0 ? arr[0] : null;
  } catch (e) {
    return null;
  }
}

/** Queries the Overpass API, racing two mirrors and using whichever responds first. */
export async function overpassQuery(query, timeoutMs = 15000) {
  const attempts = ENDPOINTS.overpass.map(async (base) => {
    const res = await fetchWithTimeout(base, { method: "POST", body: "data=" + encodeURIComponent(query) }, timeoutMs);
    if (!res.ok) throw new Error(`Overpass mirror responded ${res.status}`);
    return res.json();
  });
  try {
    return await Promise.any(attempts);
  } catch (e) {
    throw new Error("Overpass API unreachable — offline mode will be used");
  }
}

/** Turns an Overpass element (node/way/relation) into a plain [lat, lon] pair. */
export function placeLatLon(el) {
  return el.type === "node" ? [el.lat, el.lon] : (el.center ? [el.center.lat, el.center.lon] : null);
}

/** Real road-network route via OSRM; falls back to a straight-line vector estimate. */
export async function fetchRoute(fromLat, fromLon, toLat, toLon) {
  try {
    const res = await fetchWithTimeout(ENDPOINTS.osrmRoute(fromLat, fromLon, toLat, toLon), {}, 4000);
    if (res.ok) {
      const j = await res.json();
      if (j.routes && j.routes.length > 0) {
        return { km: j.routes[0].distance / 1000, minutes: j.routes[0].duration / 60, source: "routed" };
      }
    }
  } catch (e) { /* fall through to offline estimate */ }
  const km = haversineKm(fromLat, fromLon, toLat, toLon);
  return { km, minutes: (km / 35) * 60, source: "offline_vector" };
}

export async function fetchWeatherData(lat, lon) {
  const res = await fetchWithTimeout(ENDPOINTS.openMeteo(lat, lon), {}, 10000);
  if (!res.ok) throw new Error("Weather API failed");
  return res.json();
}
