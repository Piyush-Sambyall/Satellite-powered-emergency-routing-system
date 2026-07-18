/* =========================================================================
   Entry point. Loaded as <script type="module"> from index.html.
   ========================================================================= */
import { state } from './state.js';
import { debounce } from './utils.js';
import { switchTab, setLocStatus } from './ui.js';
import { initMap } from './mapView.js';
import { setLocation, startGpsTracking, stopGpsTracking, searchLocation } from './locationController.js';
import { initGuidesCarousel } from './guidesCarousel.js';
import { initActivityBand } from './activityBand.js';
import { initVideoGrid } from './videoGrid.js';
import { initDisasterNews } from './disasterNews.js';

function wireTabs() {
  document.getElementById('tab-ops').addEventListener('click', () => switchTab('ops'));
  document.getElementById('tab-weather').addEventListener('click', () => switchTab('weather'));
}

/** Boots the "Preparedness & News" content (Do's & Don'ts, Our Activity,
 * Survival Videos, Latest Disaster News), which lives directly on the
 * Tactical Map Ops tab. */
function initLearnTab() {
  initGuidesCarousel();
  initActivityBand();
  initVideoGrid();
  initDisasterNews();
}

function wireGpsButton() {
  const btn = document.getElementById('gpsBtn');
  btn.addEventListener('click', () => {
    if (state.gpsWatchId !== null) {
      stopGpsTracking();
      btn.classList.remove('active-pulse');
      btn.textContent = "Start Live GPS Tracking";
      setLocStatus("Live tracking paused.", "ok");
      return;
    }
    startGpsTracking(
      () => { btn.classList.add('active-pulse'); btn.textContent = "Tracking Live... (Click to stop)"; },
      () => { btn.classList.remove('active-pulse'); btn.textContent = "Start Live GPS Tracking"; },
      () => { btn.classList.remove('active-pulse'); btn.textContent = "Start Live GPS Tracking"; }
    );
  });
}

function wireSearch() {
  const input = document.getElementById('manualLoc');
  const searchBtn = document.getElementById('searchBtn');

  const runSearch = () => {
    // Manual search always supersedes live GPS tracking.
    if (state.gpsWatchId !== null) document.getElementById('gpsBtn').click();
    searchLocation(input.value.trim());
  };

  searchBtn.addEventListener('click', runSearch);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });

  // Lightweight "as you type" affordance: once someone pauses typing for a
  // beat, we don't auto-search (that would spam Nominatim) but we do clear
  // any stale error state so the field doesn't look permanently broken.
  input.addEventListener('input', debounce(() => {
    if (document.getElementById('locStatus').classList.contains('err')) {
      setLocStatus("Awaiting geographic lock to retrieve local intelligence and routing.");
    }
  }, 600));
}

/** Standard government-portal accessibility controls: text size steps and a
 * high-contrast mode toggle. Both are real, working features (not just
 * decorative buttons) — font size adjusts the root element, and high
 * contrast swaps the whole palette via the `high-contrast` body class
 * defined in style.css. */
function wireAccessibilityBar() {
  const root = document.documentElement;
  const steps = [87.5, 100, 112.5, 125, 137.5];
  let stepIndex = 1;

  const applyFontStep = () => { root.style.fontSize = `${steps[stepIndex]}%`; };

  document.getElementById('fontDecreaseBtn').addEventListener('click', () => {
    stepIndex = Math.max(0, stepIndex - 1);
    applyFontStep();
  });
  document.getElementById('fontIncreaseBtn').addEventListener('click', () => {
    stepIndex = Math.min(steps.length - 1, stepIndex + 1);
    applyFontStep();
  });
  document.getElementById('fontResetBtn').addEventListener('click', () => {
    stepIndex = 1;
    applyFontStep();
  });

  const contrastBtn = document.getElementById('contrastToggleBtn');
  contrastBtn.addEventListener('click', () => {
    const isOn = document.body.classList.toggle('high-contrast');
    contrastBtn.setAttribute('aria-pressed', String(isOn));
  });
}

function init() {
  // Each step is isolated: on a locked-down network (many government/intranet
  // setups block external CDNs), the Leaflet map or a CDN script can fail to
  // load. Previously that threw inside initMap() and silently skipped every
  // step after it — tabs, GPS, search, and all of "Preparedness & News"
  // included. Wrapping each step means one failure only disables that one
  // feature; everything else on the page still works.
  const steps = [
    ['map', initMap],
    ['tabs', wireTabs],
    ['gps button', wireGpsButton],
    ['search', wireSearch],
    ['preparedness & news content', initLearnTab],
    ['accessibility toolbar', wireAccessibilityBar],
  ];
  for (const [label, fn] of steps) {
    try {
      fn();
    } catch (err) {
      console.error(`AegisOps: "${label}" failed to initialize —`, err);
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
