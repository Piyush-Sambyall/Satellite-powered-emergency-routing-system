/* =========================================================================
   Small, reusable DOM helpers. Kept separate from business logic so the
   feature modules (location, map, weather) stay focused on *what* to show,
   not the mechanics of *how* to paint it.
   ========================================================================= */
import { escapeHtml } from './utils.js';
import { state } from './state.js';

const els = {
  locStatus: document.getElementById('locStatus'),
};

export function setLocStatus(msg, cls) {
  els.locStatus.textContent = msg;
  els.locStatus.className = cls || "";
}

export function renderEmergencyNumbers(nums) {
  const entries = Object.entries(nums).filter(([k]) => k !== "note");
  const grid = entries.map(([k, v]) =>
    `<div class="num-card"><div class="k">${escapeHtml(k)}</div><div class="v">${escapeHtml(v)}</div></div>`
  ).join("");
  document.getElementById('numGrid').innerHTML =
    grid + `<div class="disclaimer" style="grid-column:1/-1;margin-top:0;">${escapeHtml(nums.note)}</div>`;
}

const TAB_VIEWS = {
  ops: 'opsView',
  weather: 'weatherView'
};

/** Switches between the "Tactical Map Ops" and "Weather & Geo-Alerts" tabs. */
export function switchTab(tabId) {
  document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(el => el.setAttribute('aria-selected', 'false'));

  const viewId = TAB_VIEWS[tabId] || TAB_VIEWS.ops;
  document.getElementById(viewId).classList.add('active');
  document.getElementById(`tab-${tabId}`).setAttribute('aria-selected', 'true');

  if (tabId === 'ops' && state.map) {
    setTimeout(() => state.map.invalidateSize(), 150);
  }
}

export function showLoadingNote(elementId, message) {
  document.getElementById(elementId).innerHTML =
    `<div class="empty-note"><span class="spinner" aria-hidden="true"></span>${escapeHtml(message)}</div>`;
}

export function showEmptyNote(elementId, message) {
  document.getElementById(elementId).innerHTML = `<div class="empty-note">${escapeHtml(message)}</div>`;
}
