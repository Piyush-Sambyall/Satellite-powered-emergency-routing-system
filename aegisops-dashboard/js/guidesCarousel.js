/* =========================================================================
   "Do's & Don'ts" carousel — a lightweight, dependency-free slider over the
   DISASTER_GUIDES cards, each topped with a real photo. Shows several cards
   at once, pages through them with prev/next arrows, and auto-advances on
   a timer (looping back to the start), pausing while the pointer is over
   it or a person is actively using the arrows.
   ========================================================================= */
import { DISASTER_GUIDES } from './config.js';
import { escapeHtml, debounce } from './utils.js';

const AUTOPLAY_MS = 4500;

function cardsPerView() {
  const w = window.innerWidth;
  if (w < 640) return 1;
  if (w < 980) return 2;
  if (w < 1280) return 3;
  return 4;
}

function renderCard(guide) {
  const dos = guide.dos.map(d => `<li class="gd-yes">${escapeHtml(d)}</li>`).join("");
  const donts = guide.donts.map(d => `<li class="gd-no">${escapeHtml(d)}</li>`).join("");
  const imageHtml = guide.image
    ? `<img src="${guide.image}" alt="" loading="lazy" onerror="this.remove()">`
    : "";
  return `
    <div class="guide-card">
      <div class="guide-head" style="background:linear-gradient(160deg, ${guide.color}, ${guide.color}cc)">
        ${imageHtml}
        <div class="guide-head-overlay" style="background:linear-gradient(0deg, ${guide.color}f2, ${guide.color}66 55%, transparent)">
          <span class="guide-title">${escapeHtml(guide.title)}</span>
        </div>
      </div>
      <ul class="guide-list">${dos}</ul>
      <hr class="guide-divider">
      <ul class="guide-list">${donts}</ul>
    </div>`;
}

/** Mounts into elements `guidesTrack{suffix}` / `guidesPrev{suffix}` / `guidesNext{suffix}`. */
export function initGuidesCarousel(suffix = '') {
  const track = document.getElementById(`guidesTrack${suffix}`);
  const prevBtn = document.getElementById(`guidesPrev${suffix}`);
  const nextBtn = document.getElementById(`guidesNext${suffix}`);
  if (!track || !prevBtn || !nextBtn) return;

  track.innerHTML = DISASTER_GUIDES.map(renderCard).join("");

  const wrap = track.closest('.carousel');
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let index = 0;
  const maxIndex = () => Math.max(0, DISASTER_GUIDES.length - cardsPerView());

  function update() {
    const perView = cardsPerView();
    track.style.setProperty('--per-view', perView);
    track.style.transform = `translateX(-${index * (100 / perView)}%)`;
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index >= maxIndex();
  }

  function goTo(newIndex) {
    // Looping: past either end wraps around instead of stopping.
    const max = maxIndex();
    index = newIndex < 0 ? max : newIndex > max ? 0 : newIndex;
    update();
  }

  let timer = null;
  function stopAutoplay() { if (timer) { clearInterval(timer); timer = null; } }
  function startAutoplay() {
    if (reduceMotion || maxIndex() === 0) return; // nothing to page through, or motion disabled
    stopAutoplay();
    timer = setInterval(() => goTo(index + 1), AUTOPLAY_MS);
  }

  prevBtn.addEventListener('click', () => { goTo(index - 1); startAutoplay(); });
  nextBtn.addEventListener('click', () => { goTo(index + 1); startAutoplay(); });
  window.addEventListener('resize', debounce(() => { index = Math.min(index, maxIndex()); update(); startAutoplay(); }, 200));

  if (wrap) {
    wrap.addEventListener('mouseenter', stopAutoplay);
    wrap.addEventListener('mouseleave', startAutoplay);
    wrap.addEventListener('focusin', stopAutoplay);
    wrap.addEventListener('focusout', startAutoplay);
  }

  update();
  startAutoplay();
}
