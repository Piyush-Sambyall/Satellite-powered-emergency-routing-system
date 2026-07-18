/* =========================================================================
   "Survival Videos" grid — real, publicly published disaster-survival videos
   (Red Cross / National Geographic). Renders a thumbnail (YouTube's public
   thumbnail image, no API key needed) and swaps it for a privacy-enhanced
   embed only once someone clicks play, so nothing loads from YouTube until
   the person actually wants to watch.
   ========================================================================= */
import { SURVIVAL_VIDEOS } from './config.js';
import { escapeHtml } from './utils.js';

function renderCard(video, i, suffix) {
  return `
    <div class="video-card" id="video-${suffix}-${i}">
      <button type="button" class="video-thumb-btn" data-index="${i}" aria-label="Play: ${escapeHtml(video.title)}">
        <img src="https://img.youtube.com/vi/${video.id}/sddefault.jpg" alt="" loading="lazy" width="320" height="180"
             onerror="this.onerror=null;this.src='https://img.youtube.com/vi/${video.id}/hqdefault.jpg'">
        <span class="video-play" aria-hidden="true">▶</span>
      </button>
      <div class="video-meta">
        <div class="video-title">${escapeHtml(video.title)}</div>
        <div class="video-channel">${escapeHtml(video.channel)}</div>
      </div>
    </div>`;
}

/** Mounts into `videoGrid{suffix}`. */
export function initVideoGrid(suffix = '') {
  const grid = document.getElementById(`videoGrid${suffix}`);
  if (!grid) return;
  grid.innerHTML = SURVIVAL_VIDEOS.map((v, i) => renderCard(v, i, suffix)).join("");

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.video-thumb-btn');
    if (!btn) return;
    const i = Number(btn.dataset.index);
    const video = SURVIVAL_VIDEOS[i];
    if (!video) return;
    const card = document.getElementById(`video-${suffix}-${i}`);
    card.querySelector('.video-thumb-btn').outerHTML =
      `<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1" title="${escapeHtml(video.title)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div>`;
  });
}
