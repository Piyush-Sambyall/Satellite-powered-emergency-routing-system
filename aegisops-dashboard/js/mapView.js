/* =========================================================================
   Map rendering, nearby-facility search, and turn-by-turn navigation.
   ========================================================================= */
import { OFFLINE_FACILITIES, ENDPOINTS } from './config.js';
import { haversineKm } from './utils.js';
import { overpassQuery, placeLatLon, fetchRoute } from './api.js';
import { escapeHtml } from './utils.js';
import { state } from './state.js';
import { showLoadingNote, showEmptyNote, switchTab } from './ui.js';

export function initMap() {
  const container = document.getElementById('map');
  if (typeof L === 'undefined') {
    // Leaflet's <script> tag (loaded from unpkg.com) didn't execute — most
    // often because an external CDN is blocked on this network. Show a
    // clear, actionable message rather than leaving a blank box.
    if (container) {
      container.innerHTML =
        '<div class="empty-note" style="padding:24px;">' +
        'The map library could not be loaded (usually because this network blocks external CDN scripts like unpkg.com). ' +
        'Facility search and navigation need this connection to work — please check with your network administrator about allow-listing unpkg.com, or run this on an unrestricted connection.' +
        '</div>';
    }
    throw new Error("Leaflet (window.L) is not available — map cannot initialize");
  }

  state.map = L.map('map', { worldCopyJump: true }).setView([32.73, 74.85], 2);
  L.tileLayer(ENDPOINTS.tileLayer, { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(state.map);
  state.hospLayer = L.layerGroup().addTo(state.map);
  state.safeLayer = L.layerGroup().addTo(state.map);
  state.routeLayer = L.layerGroup().addTo(state.map);
}

/** Creates the user's arrow marker on first fix, or moves/rotates it on later updates. */
export function updateUserMarker(lat, lon, heading) {
  if (!state.map) return; // map failed to load (e.g. blocked CDN) — nothing to draw on
  if (!state.userMarker) {
    const arrowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="var(--blue)" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L22 21L12 17L2 21L12 2Z"></path></svg>`;
    const arrowIcon = L.divIcon({ className: 'user-location-icon', html: `<div id="user-arrow-wrapper" class="user-arrow">${arrowSvg}</div>`, iconSize: [28, 28], iconAnchor: [14, 14] });
    state.userMarker = L.marker([lat, lon], { icon: arrowIcon }).bindPopup("Your Location").addTo(state.map);
    state.map.setView([lat, lon], 12);
  } else {
    state.userMarker.setLatLng([lat, lon]);
    if (heading !== null && heading !== undefined) {
      const arrowElement = document.getElementById('user-arrow-wrapper');
      if (arrowElement) arrowElement.style.transform = `rotate(${heading}deg)`;
    }
  }

  if (state.routingControl && state.activeTarget) {
    state.routingControl.setWaypoints([L.latLng(lat, lon), L.latLng(state.activeTarget.lat, state.activeTarget.lon)]);
  }
}

export function startNavigation(toLat, toLon) {
  if (!state.currentLoc || !state.map) return;
  state.activeTarget = { lat: toLat, lon: toLon };
  if (state.routingControl) state.map.removeControl(state.routingControl);
  state.routeLayer.clearLayers();
  state.routingControl = L.Routing.control({
    waypoints: [L.latLng(state.currentLoc.lat, state.currentLoc.lon), L.latLng(toLat, toLon)],
    routeWhileDragging: false, show: true,
    lineOptions: { styles: [{ color: 'var(--blue)', opacity: 0.8, weight: 6 }] },
    createMarker: () => null
  }).addTo(state.map);
  switchTab('ops');
}

export function clearNavigation() {
  if (!state.map) return;
  if (state.routingControl) {
    state.map.removeControl(state.routingControl);
    state.routingControl = null;
  }
  state.activeTarget = null;
  state.routeLayer.clearLayers();
}

export async function findNearby(lat, lon) {
  if (!state.map) return; // map failed to load — facility layers don't exist
  showLoadingNote('hospList', 'Scanning sector for medical facilities...');
  showLoadingNote('safeList', 'Scanning sector for designated safe zones...');
  state.hospLayer.clearLayers();
  state.safeLayer.clearLayers();
  clearNavigation();

  const radius = 60000;
  const OFFLINE_RELEVANCE_KM = 150; // beyond this, the offline cache isn't a useful substitute
  const hospQ = `[out:json][timeout:20];(nwr["amenity"="hospital"](around:${radius},${lat},${lon});nwr["healthcare"="hospital"](around:${radius},${lat},${lon});nwr["amenity"="clinic"](around:${radius},${lat},${lon});nwr["amenity"="doctors"](around:${radius},${lat},${lon}););out center 40;`;
  const safeQ = `[out:json][timeout:20];(nwr["emergency"="assembly_point"](around:${radius},${lat},${lon});nwr["amenity"="shelter"](around:${radius},${lat},${lon});nwr["amenity"="community_centre"](around:${radius},${lat},${lon}););out center 40;`;

  try {
    const hospData = await overpassQuery(hospQ, 20000);
    const hospitals = (hospData.elements || [])
      .map(el => ({ name: (el.tags && el.tags.name) || "Medical Facility", pos: placeLatLon(el), tags: el.tags || {} }))
      .filter(h => h.pos)
      .map(h => ({ ...h, dist: haversineKm(lat, lon, h.pos[0], h.pos[1]) }))
      .sort((a, b) => a.dist - b.dist);
    if (hospitals.length === 0) throw new Error("Empty");
    document.getElementById('hospBadge').textContent = hospitals.length + " live results";
    await renderPlaces(hospitals, "hospList", state.hospLayer, "var(--red)", lat, lon, "Medical Facility");
  } catch (e) {
    const offlineHospitals = OFFLINE_FACILITIES.hospitals
      .map(h => ({ ...h, dist: haversineKm(lat, lon, h.pos[0], h.pos[1]) }))
      .sort((a, b) => a.dist - b.dist);
    if (offlineHospitals.length > 0 && offlineHospitals[0].dist <= OFFLINE_RELEVANCE_KM) {
      document.getElementById('hospBadge').textContent = "Offline Mode Active";
      await renderPlaces(offlineHospitals, "hospList", state.hospLayer, "var(--red)", lat, lon, "Medical Facility (Offline)");
    } else {
      document.getElementById('hospBadge').textContent = "No data available";
      showEmptyNote('hospList', 'No live facility data could be retrieved for this area, and the offline cache only covers the Jammu region — too far away to be useful here. Try again once you have a network connection, or check the area name is correct.');
    }
  }

  try {
    const safeData = await overpassQuery(safeQ, 20000);
    const safe = (safeData.elements || [])
      .map(el => ({ name: (el.tags && el.tags.name) || "Safe Zone", pos: placeLatLon(el), tags: el.tags || {} }))
      .filter(s => s.pos)
      .map(s => ({ ...s, dist: haversineKm(lat, lon, s.pos[0], s.pos[1]) }))
      .sort((a, b) => a.dist - b.dist);
    if (safe.length === 0) throw new Error("Empty");
    document.getElementById('safeBadge').textContent = safe.length + " live results";
    await renderPlaces(safe, "safeList", state.safeLayer, "var(--green)", lat, lon, "Safe Zone");
  } catch (e) {
    const offlineSafeZones = OFFLINE_FACILITIES.safepoints
      .map(s => ({ ...s, dist: haversineKm(lat, lon, s.pos[0], s.pos[1]) }))
      .sort((a, b) => a.dist - b.dist);
    if (offlineSafeZones.length > 0 && offlineSafeZones[0].dist <= OFFLINE_RELEVANCE_KM) {
      document.getElementById('safeBadge').textContent = "Offline Mode Active";
      await renderPlaces(offlineSafeZones, "safeList", state.safeLayer, "var(--green)", lat, lon, "Safe Zone (Offline)");
    } else {
      document.getElementById('safeBadge').textContent = "No data available";
      showEmptyNote('safeList', 'No live safe-zone data could be retrieved for this area, and the offline cache only covers the Jammu region — too far away to be useful here. Try again once you have a network connection, or check the area name is correct.');
    }
  }
}

/** Builds a readable address from whatever OSM addr:* tags a facility has,
 * falling back to the country of the location that was searched (most
 * facilities returned by a radius search share that country, and many OSM
 * entries lack their own addr:country tag even when everything else is
 * tagged). */
function buildAddress(tags, fallbackCountry) {
  const houseStreet = [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' ');
  const parts = [
    houseStreet,
    tags['addr:city'] || tags['addr:suburb'],
    tags['addr:state'],
  ].filter(Boolean);

  const country = tags['addr:country'] || fallbackCountry;
  if (country) parts.push(country.length === 2 ? country.toUpperCase() : country);

  return parts.length > 0 ? parts.join(', ') : 'Geographic coordinates only';
}

async function renderPlaces(places, listId, layerGroup, color, fromLat, fromLon, kindLabel) {
  const listEl = document.getElementById(listId);
  if (places.length === 0) {
    showEmptyNote(listId, "No data available in live or offline caches.");
    return;
  }

  listEl.innerHTML = places.map((p, i) => `
    <div class="place-item" id="${listId}-${i}">
      <div class="name">${escapeHtml(p.name)}</div>
      <div class="addr">${escapeHtml(buildAddress(p.tags, state.currentCountry))}</div>
      <div class="metrics"><span><span class="spinner" aria-hidden="true"></span>Computing routing vector...</span></div>
    </div>`).join("");

  for (let i = 0; i < places.length; i++) {
    const p = places[i];
    L.circleMarker(p.pos, { radius: 6, color: "#fff", weight: 1.5, fillColor: color, fillOpacity: 0.9 })
      .bindPopup(`<b>${escapeHtml(p.name)}</b><br>${escapeHtml(kindLabel)}`)
      .addTo(layerGroup);

    const route = await fetchRoute(fromLat, fromLon, p.pos[0], p.pos[1]);
    const row = document.getElementById(`${listId}-${i}`);
    if (row) {
      const isOffline = route.source === 'offline_vector';
      row.querySelector('.metrics').innerHTML =
        `<span class="dist">${route.km.toFixed(1)} km</span>` +
        `<span class="eta" style="color:${isOffline ? 'var(--amber)' : 'var(--green)'}">~${Math.round(route.minutes)} min ${isOffline ? '(Vector)' : ''}</span>`;
      row.insertAdjacentHTML('beforeend',
        `<div class="place-actions"><button type="button" data-lat="${p.pos[0]}" data-lon="${p.pos[1]}" class="js-navigate-btn">Navigate Here</button></div>`);
    }
  }
}

// Event delegation for the dynamically-inserted "Navigate Here" buttons —
// avoids inline onclick="" handlers (which the original markup relied on)
// so this keeps working even with a strict Content-Security-Policy.
document.addEventListener('click', (e) => {
  const btn = e.target.closest('.js-navigate-btn');
  if (!btn) return;
  startNavigation(parseFloat(btn.dataset.lat), parseFloat(btn.dataset.lon));
});
