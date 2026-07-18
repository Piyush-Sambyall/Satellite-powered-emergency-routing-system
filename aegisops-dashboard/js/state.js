/* =========================================================================
   Centralised, mutable application state.
   Kept as one plain object (instead of scattered `let` globals) so every
   module imports the same source of truth instead of guessing about order
   of <script> tags, as the original single-file version relied on.
   ========================================================================= */
export const state = {
  map: null,
  userMarker: null,
  hospLayer: null,
  safeLayer: null,
  routeLayer: null,
  routingControl: null,

  currentLoc: null,       // { lat, lon }
  currentCountry: null,
  currentAreaName: "Unknown Sector",
  activeTarget: null,     // { lat, lon } currently navigated to

  gpsWatchId: null,
  lastLat: null,
  lastLon: null,
};
