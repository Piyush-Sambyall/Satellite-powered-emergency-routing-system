/* =========================================================================
   Location acquisition: manual search + live GPS tracking. On every new
   "fix" this coordinates the map marker, emergency numbers, nearby
   facilities, and weather panel updates.
   ========================================================================= */
import { getEmergencyNumbers } from './config.js';
import { reverseGeocode, geocodeSearch } from './api.js';
import { haversineKm, calculateBearing } from './utils.js';
import { state } from './state.js';
import { setLocStatus, renderEmergencyNumbers } from './ui.js';
import { updateUserMarker, findNearby } from './mapView.js';
import { loadWeatherDashboard } from './weatherPanel.js';

/**
 * Registers (or moves) the user's position.
 * @param {number} lat
 * @param {number} lon
 * @param {string} label - human-readable label used only in status text
 * @param {boolean} isLiveUpdate - true for GPS ticks after the first fix;
 *   skips the expensive reverse-geocode/nearby/weather refresh so live
 *   tracking stays smooth.
 * @param {number|null} heading - compass heading in degrees, if known
 */
export async function setLocation(lat, lon, label, isLiveUpdate = false, heading = null) {
  state.currentLoc = { lat, lon };
  document.getElementById('liveClock').textContent = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

  updateUserMarker(lat, lon, heading);

  if (isLiveUpdate) return;

  setLocStatus(`Establishing fix on "${label || 'target coordinates'}"...`);
  const geo = await reverseGeocode(lat, lon);
  const addr = (geo && geo.address) ? geo.address : {};
  state.currentCountry = addr.country_code;
  state.currentAreaName = [addr.city || addr.town || addr.village || addr.county, addr.state, addr.country]
    .filter(Boolean).join(", ") || "Unknown Sector";

  document.getElementById('areaLabel').textContent = state.currentAreaName;
  setLocStatus(`Lock established near ${state.currentAreaName}`, "ok");

  renderEmergencyNumbers(getEmergencyNumbers(state.currentCountry));

  // These two can run concurrently — neither depends on the other's result.
  await Promise.all([
    findNearby(lat, lon),
    loadWeatherDashboard(lat, lon, state.currentAreaName)
  ]);
}

export function startGpsTracking(onStart, onStop, onError) {
  if (!navigator.geolocation) {
    setLocStatus("Hardware GPS unavailable on this device/browser.", "err");
    return;
  }

  setLocStatus("Negotiating live tracking stream...");
  onStart();

  let isFirstFix = true;
  state.gpsWatchId = navigator.geolocation.watchPosition(
    pos => {
      const lat = pos.coords.latitude, lon = pos.coords.longitude;
      let heading = pos.coords.heading;
      if (heading === null && state.lastLat !== null && state.lastLon !== null) {
        if (haversineKm(state.lastLat, state.lastLon, lat, lon) > 0.005) {
          heading = calculateBearing(state.lastLat, state.lastLon, lat, lon);
        }
      }
      setLocation(lat, lon, "Live Device GPS", !isFirstFix, heading);
      state.lastLat = lat; state.lastLon = lon; isFirstFix = false;
    },
    err => {
      setLocStatus("GPS lock failed or lost. Ensure location permissions are granted.", "err");
      onError();
      stopGpsTracking();
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
  );
}

export function stopGpsTracking() {
  if (state.gpsWatchId !== null) {
    navigator.geolocation.clearWatch(state.gpsWatchId);
    state.gpsWatchId = null;
  }
}

export async function searchLocation(query) {
  if (!query) return;
  setLocStatus(`Scanning for "${query}"...`);
  const result = await geocodeSearch(query);
  if (!result) {
    setLocStatus(`Target "${query}" not found. Try a broader sector or check spelling.`, "err");
    return;
  }
  await setLocation(parseFloat(result.lat), parseFloat(result.lon), result.display_name, false);

  // Reflect what was actually resolved (e.g. "Shimla, Himachal Pradesh, India")
  // in the search box, rather than leaving whatever raw text was typed.
  const input = document.getElementById('manualLoc');
  if (input && state.currentAreaName) input.value = state.currentAreaName;
}
