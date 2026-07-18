/* =========================================================================
   "Latest Disaster News" — primary source is GDACS (Global Disaster Alert
   and Coordination System, a joint UN/European Commission initiative),
   which naturally spans every major disaster type with a real severity
   rating instead of being dominated by whichever category currently has
   the most open events. NASA's EONET is used as an automatic fallback if
   GDACS can't be reached.

   Fetched once and rendered into every mounted grid.
   ========================================================================= */
import { ENDPOINTS, GDACS_EVENT_TYPES, GDACS_ALERT_COLORS, EONET_CATEGORY_DISPLAY } from './config.js';
import { escapeHtml, fetchWithTimeout } from './utils.js';
import { showEmptyNote } from './ui.js';

const mountedTargets = [];
const MAX_ITEMS = 12;

/* ---------------------------- GDACS (primary) ---------------------------- */

function renderGdacsCard(feature) {
  const p = feature.properties || {};
  const typeInfo = GDACS_EVENT_TYPES[p.eventtype] || { label: p.eventtype || "Disaster", color: "#6b7580" };
  const alertColor = GDACS_ALERT_COLORS[p.alertlevel] || typeInfo.color;
  const dateStr = p.fromdate || p.todate;
  const dateLabel = dateStr ? new Date(dateStr).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : "";
  const sourceUrl = (p.url && p.url.report) || "https://www.gdacs.org/";

  return `
    <div class="news-item">
      <div class="news-cat" style="background:${alertColor}22;color:${alertColor}">
        ${p.icon ? `<img class="news-icon" src="${p.icon}" alt="" loading="lazy" onerror="this.remove()">` : ""}
        ${escapeHtml(typeInfo.label)}${p.alertlevel ? ` · ${escapeHtml(p.alertlevel)}` : ""}
      </div>
      <div class="news-title">${escapeHtml(p.name || "Disaster Event")}</div>
      ${p.country ? `<div class="news-location" title="${escapeHtml(p.country)}">${escapeHtml(p.country)}</div>` : ""}
      <div class="news-meta">
        ${dateLabel ? `<span>${escapeHtml(dateLabel)}</span>` : ""}
        <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">Read more ›</a>
      </div>
    </div>`;
}

async function fetchGdacs() {
  const res = await fetchWithTimeout(ENDPOINTS.gdacsEvents(), {}, 10000);
  if (!res.ok) throw new Error("GDACS request failed");
  const data = await res.json();
  const features = (data.features || []).slice(0, MAX_ITEMS);
  if (features.length === 0) throw new Error("GDACS returned no events");
  return { html: features.map(renderGdacsCard).join(""), count: features.length, label: "GDACS" };
}

/* ---------------------------- EONET (fallback) ---------------------------- */

function categoryDisplay(event) {
  const catId = event.categories && event.categories[0] ? event.categories[0].id : null;
  return EONET_CATEGORY_DISPLAY[catId] || EONET_CATEGORY_DISPLAY.default;
}

function latestDate(event) {
  const geoms = event.geometry || [];
  const dates = geoms.map(g => g.date).filter(Boolean).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

function renderEonetCard(event) {
  const disp = categoryDisplay(event);
  const catTitle = event.categories && event.categories[0] ? event.categories[0].title : "Disaster Event";
  const dateStr = latestDate(event);
  const dateLabel = dateStr ? new Date(dateStr).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' }) : "";
  const sourceUrl = (event.sources && event.sources[0] && event.sources[0].url) || event.link;

  return `
    <div class="news-item">
      <div class="news-cat" style="background:${disp.color}22;color:${disp.color}">
        ${escapeHtml(catTitle)}
      </div>
      <div class="news-title">${escapeHtml(event.title)}</div>
      <div class="news-meta">
        ${dateLabel ? `<span>${escapeHtml(dateLabel)}</span>` : ""}
        <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">Read more ›</a>
      </div>
    </div>`;
}

async function fetchEonet() {
  const res = await fetchWithTimeout(ENDPOINTS.eonetEvents(MAX_ITEMS), {}, 10000);
  if (!res.ok) throw new Error("EONET request failed");
  const data = await res.json();
  const events = data.events || [];
  if (events.length === 0) throw new Error("EONET returned no events");
  return { html: events.map(renderEonetCard).join(""), count: events.length, label: "NASA EONET (fallback)" };
}

/* ---------------------------- shared plumbing ---------------------------- */

function renderInto(target, result) {
  const grid = document.getElementById(target.gridId);
  const badge = target.badgeId ? document.getElementById(target.badgeId) : null;
  if (!grid) return;
  grid.innerHTML = result.html;
  if (badge) badge.textContent = `Live · ${result.count} events · ${result.label}`;
}

function showErrorOn(target) {
  showEmptyNote(target.gridId, 'Live disaster-news feeds are unavailable right now — please try refreshing.');
  const badge = target.badgeId ? document.getElementById(target.badgeId) : null;
  if (badge) badge.textContent = "Offline";
}

export async function loadDisasterNews() {
  let result;
  try {
    result = await fetchGdacs();
  } catch (e) {
    try {
      result = await fetchEonet();
    } catch (e2) {
      mountedTargets.forEach(showErrorOn);
      return;
    }
  }
  mountedTargets.forEach(target => renderInto(target, result));
}

/** Mounts into `newsGrid{suffix}` / `newsBadge{suffix}` / `newsRefreshBtn{suffix}`.
 * Every mounted target shares one underlying fetch. */
export function initDisasterNews(suffix = '') {
  const gridId = `newsGrid${suffix}`;
  if (!document.getElementById(gridId)) return;

  mountedTargets.push({ gridId, badgeId: `newsBadge${suffix}` });

  const refreshBtn = document.getElementById(`newsRefreshBtn${suffix}`);
  if (refreshBtn) refreshBtn.addEventListener('click', loadDisasterNews);

  // Re-fetch so this mount is populated immediately rather than waiting for
  // the next manual refresh.
  loadDisasterNews();
}
