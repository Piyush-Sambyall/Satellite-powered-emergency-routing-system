/* =========================================================================
   "Our Activity" band. Static content, but rendered from config so it's
   easy to add/edit cards without touching markup.
   ========================================================================= */
import { OUR_ACTIVITIES } from './config.js';
import { escapeHtml } from './utils.js';

// Small inline-SVG icon set (stroke-only, matches the app's existing line-icon
// style) — avoids pulling in an icon font/library for five glyphs.
const ICONS = {
  shield: '<path d="M12 2l8 3v7c0 6-8 10-8 10s-8-4-8-10V5l8-3z"/><path d="M9 12l2 2 4-4"/>',
  person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 21c0-4 3-6.5 7-6.5s7 2.5 7 6.5"/>',
  book: '<path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5c-.8 0-1.5-.7-1.5-1.5v-13z"/><path d="M20 5.5C20 4.7 19.3 4 18.5 4H12v16h6.5c.8 0 1.5-.7 1.5-1.5v-13z"/>',
  chip: '<rect x="7" y="7" width="10" height="10" rx="1.5"/><path d="M9 3v3M12 3v3M15 3v3M9 18v3M12 18v3M15 18v3M3 9h3M3 12h3M3 15h3M18 9h3M18 12h3M18 15h3"/>',
  bulb: '<path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4 1 1.1 1 1.9v.2h5v-.2c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3z"/>'
};

function renderCard(activity) {
  const icon = ICONS[activity.icon] || ICONS.bulb;
  return `
    <div class="activity-card">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icon}</svg>
      <h3>${escapeHtml(activity.title)}</h3>
      <p>${escapeHtml(activity.desc)}</p>
    </div>`;
}

/** Mounts into `activityGrid{suffix}`. */
export function initActivityBand(suffix = '') {
  const grid = document.getElementById(`activityGrid${suffix}`);
  if (!grid) return;
  grid.innerHTML = OUR_ACTIVITIES.map(renderCard).join("");
}
