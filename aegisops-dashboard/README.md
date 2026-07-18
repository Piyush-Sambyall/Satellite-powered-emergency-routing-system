# AegisOps Dashboard

Real-time disaster-response dashboard: live GPS tracking, nearest hospital/safe-zone
routing, local emergency numbers, and a live weather + severe-alert panel.

This started life as a single `index.html` file (~600 lines, everything inline) and
has been split into a small, maintainable project structure with some functional
and quality-of-life enhancements layered on top.

## Project structure

```
aegisops-dashboard/
├── index.html            Markup only — no inline <style> or business logic
├── css/
│   └── style.css         All styling, extracted from the original <style> block
├── js/
│   ├── config.js         Static data: offline fallback facilities, emergency
│   │                      numbers by country, WMO weather-code lookup, API
│   │                      endpoints, Do's & Don'ts guides, Our Activity cards,
│   │                      survival-video list, EONET category display map
│   ├── utils.js           Pure helpers: haversine distance, bearing, debounce,
│   │                      HTML-escaping, fetch-with-timeout
│   ├── api.js             All external network calls (Nominatim, Overpass, OSRM,
│   │                      Open-Meteo) — no DOM access, fails soft
│   ├── state.js           Single shared mutable state object (map, layers,
│   │                      current location, GPS watch id, etc.)
│   ├── ui.js               Small DOM helpers: status text, tab switching,
│   │                      emergency-number rendering, loading/empty states
│   ├── mapView.js         Leaflet map, nearby-facility search & rendering,
│   │                      turn-by-turn navigation
│   ├── weatherPanel.js    Live radar embed + current/hourly/7-day rendering
│   ├── locationController.js
│   │                      Orchestrates GPS tracking / manual search and fans
│   │                      the resulting "fix" out to the map + weather panels
│   ├── guidesCarousel.js  NEW — Do's & Don'ts slider (8 disaster-type cards)
│   ├── activityBand.js    NEW — "Our Activity" static info cards
│   ├── videoGrid.js       NEW — Survival Videos grid, click-to-embed
│   ├── disasterNews.js    NEW — Latest Disaster News, live via NASA EONET
│   └── main.js            Entry point — wires up DOM event listeners, boots
│                          the map on load
└── README.md
```

`index.html` loads `js/main.js` as an ES module (`<script type="module">`), which in
turn `import`s the other files — no bundler required, it runs directly from a static
file server.

## Running it

Because it uses ES modules, opening `index.html` directly via `file://` will be
blocked by the browser's CORS rules for modules. Serve it over HTTP instead, e.g.:

```bash
cd aegisops-dashboard
python3 -m http.server 8080
# then open http://localhost:8080
```

Any static file server works (`npx serve`, VS Code "Live Server", etc.).

## What changed vs. the original single file

**Structure**
- Inline `<style>` moved to `css/style.css`; inline `<script>` split into eight
  focused ES modules instead of one 350-line block of global functions/`let`s.
- Replaced scattered top-level `let` globals with one `state` object imported
  wherever needed, so it's obvious what pieces of mutable state exist.
- Replaced inline `onclick="startNavigation(...)"` attributes (which required
  functions to live on `window`) with a single delegated `click` listener —
  works cleanly even under a strict Content-Security-Policy.

**Correctness / robustness**
- All text pulled from third-party APIs (place names, addresses, area labels,
  country codes) is now HTML-escaped before being inserted via `innerHTML`,
  closing a minor XSS-via-map-data hole in the original.
- Hourly/daily forecast loops now bound-check against the actual API response
  length instead of assuming exactly 24 hours / 7 days are always returned.
- Nearby-facility fetch and weather fetch now run concurrently
  (`Promise.all`) instead of sequentially, shaving noticeable time off the
  first location fix.
- A dedicated `clearNavigation()` helper replaces duplicated
  "remove control + clear layer + null out target" logic that was repeated
  inline in two places.

**UX / accessibility**
- Proper ARIA tab/tabpanel roles on the nav tabs and views, an `aria-live`
  region on the status line, a "skip to main content" link, and a visible
  focus ring (`:focus-visible`) for keyboard users.
- Inline loading spinners on the hospital/safe-zone lists and route metrics
  instead of static "Computing..." text.
- A "last updated" timestamp on the weather panel.
- Search input clears a stale error state once the person starts typing
  again, instead of leaving a red error message on screen indefinitely.
- `prefers-reduced-motion` is respected (pulse/fade/spin animations are
  disabled for users who've asked for that).
- Minor responsive tweaks for narrow phone screens (scrollable tab bar,
  tighter forecast grid, smaller hero temperature).

**Docs**
- This README, plus a short module-level comment block at the top of every
  file explaining its single responsibility.

## Fixes: news card images, uneven card heights, misleading offline hospital results, search box

- **News cards now show a real image again.** GDACS returns a small icon
  image per event (event type + severity color baked into one PNG, e.g.
  "Orange/DR.png" for an orange-level drought). That URL was being thrown
  away; each card now shows it next to the category label, with an
  `onerror` fallback that just drops the image if a particular icon URL
  ever 404s, rather than showing a broken-image icon.
- **Fixed a real layout bug causing large empty gaps in news cards.** CSS
  Grid rows stretch every item in a row to match the tallest one by
  default. A GDACS event covering ~25 European countries in one drought
  listing produced a very tall card, and every other card in that row was
  stretched to match — leaving big blank gaps under their shorter content.
  Fixed two ways: `.news-grid` now uses `align-items:start` so rows no
  longer force-stretch, and both the title and the country/region line are
  now clamped (2 lines and 1 line respectively, with a `title` tooltip on
  the country line for the full text) so one unusually long entry can't
  balloon the whole grid.
- **Fixed hospitals/safe-zones showing wildly wrong locations.** Searching
  a real place (e.g. Shimla) with no live OSM hospital data nearby used to
  silently fall back to the offline cache — which only covers Jammu, ~450km
  and 6 hours away — and show it as if it were a normal result. That offline
  cache now only displays if it's within 150km of the searched location;
  otherwise you get a clear message explaining that no live data could be
  retrieved and the offline cache doesn't cover that region, instead of a
  "Navigate Here" button to a hospital that's actually hours away. The live
  Overpass search itself was also made a bit more resilient: search radius
  widened from 40km to 60km, timeout raised from 15s to 20s, and a third
  Overpass mirror was added.
- **Search box now reflects what was actually found.** After establishing a
  fix, the box used to keep showing whatever raw text you typed (e.g.
  "shimla"). It now updates to the resolved place name (e.g. "Shimla,
  Himachal Pradesh, India") once the lock is established, so it's clear
  exactly what location the rest of the dashboard is now showing data for.

## Different news source (GDACS) + country-aware facility addresses

- **Latest Disaster News now pulls from GDACS first**, not NASA EONET. GDACS
  (Global Disaster Alert and Coordination System) is a joint UN/European
  Commission system that reports every major disaster type — earthquakes,
  cyclones, floods, volcanoes, droughts, wildfires — each with a real
  Green/Orange/Red severity rating, rather than showing whichever single
  category (in practice, usually wildfires) happens to have the most
  currently-open events. It's free, requires no key or registration, and
  each event links to GDACS's own report page.
  - **Automatic fallback:** if GDACS can't be reached, `disasterNews.js`
    transparently retries against NASA EONET (the previous source) before
    giving up, so the feature degrades gracefully instead of just breaking.
    The badge text says which source actually served the data.
  - Cards now also show the affected **country/region** as its own line,
    since GDACS reports that separately from the event title (unlike EONET).
- **Hospital/safe-zone addresses now include city, state, and country**
  instead of just the street. Most facilities returned by the live OSM
  search don't carry a country tag of their own, so `mapView.js` now falls
  back to the country of whatever location was searched — every listing is
  shown "as per the location and the country" rather than just a street
  name with no broader context. The two offline fallback facilities got the
  same treatment (now tagged with city/state/country, not just a street).

## Cleanup pass: removed the duplicate tab, fixed layout, autoplay, no emoji

- **Removed the separate "Preparedness & News" tab.** Its content (Do's &
  Don'ts, Our Activity, Survival Videos, Latest Disaster News) already also
  lived on "Tactical Map Ops" from the previous pass, so the standalone tab
  was pure duplication. It's gone now — the app is back to two tabs (Tactical
  Map Ops, Weather & Geo-Alerts), and all four Preparedness & News sections
  live only on Tactical Map Ops, with their original (non-suffixed) element
  ids. `guidesCarousel.js` / `activityBand.js` / `videoGrid.js` /
  `disasterNews.js` still accept an optional id `suffix` for mounting more
  than once, in case this ever needs to be split again, but only one mount
  is wired up now.
- **Side column now matches the map's height and scrolls as one unit.**
  Dispatch Numbers, All Medical Facilities, and Designated Safe Zones used
  to be three independently-growing cards that could add up to taller than
  the map next to them. `.ops-side-col` now has a fixed height matching the
  map card and one scrollbar for all three cards together, instead of each
  list also having its own nested scrollbar.
- **Carousel arrows are smaller** (26px instead of 40px) and the **Do's &
  Don'ts carousel now auto-advances** every 4.5s, looping back to the start,
  pausing while a pointer or keyboard focus is on it, and skipping autoplay
  entirely if the browser reports `prefers-reduced-motion`.
- **No more emoji anywhere in the app.** The disaster-guide card icons, the
  Latest Disaster News category badges, and the current/hourly/daily weather
  condition icons were all emoji before; they're now either dropped (the
  guide cards already show a real photo, so the icon was redundant) or
  replaced with a small inline-SVG icon set in `weatherPanel.js` drawn in
  the same stroke style as the rest of the app.
- **Clearer images.** The Do's & Don'ts photos now request `?width=800` from
  Wikimedia (was 500), and the Survival Video thumbnails use YouTube's
  `sddefault.jpg` (640×480) instead of `hqdefault.jpg` (480×360), falling
  back to `hqdefault` automatically via `onerror` if a given video doesn't
  have an `sddefault` thumbnail.
- **Fixed the empty trailing space** in the Survival Videos and Latest
  Disaster News grids: both switched from CSS Grid's `auto-fill` to
  `auto-fit`, so existing cards stretch to fill the row instead of leaving a
  blank column-sized gap when the count doesn't divide evenly.

## Bug fix: one failed step was silently disabling the whole page

**Symptom reported:** map blank, Do's & Don'ts empty, Our Activity empty —
basically everything except the header/tabs looked broken.

**Root cause:** `main.js`'s `init()` ran every setup step back-to-back with no
error isolation: `initMap(); wireTabs(); wireGpsButton(); wireSearch();
initLearnTab();`. On a locked-down network (common for government/intranet
deployments) that blocks external CDNs like `unpkg.com`, the Leaflet
`<script>` tag never executes, so `window.L` is undefined. `initMap()` then
threw a `ReferenceError`, which — since nothing caught it — aborted `init()`
entirely partway through. Every step after `initMap()` in that list, tabs,
GPS, search, and all of the Do's & Don'ts/Activity/Videos/News content,
never ran.

**Fix:** each step now runs independently in `main.js`:
```js
const steps = [['map', initMap], ['tabs', wireTabs], /* … */];
for (const [label, fn] of steps) {
  try { fn(); } catch (err) { console.error(`AegisOps: "${label}" failed —`, err); }
}
```
`initMap()` in `mapView.js` also now checks for `window.L` up front and, if
it's missing, shows a clear message directly in the map card instead of
throwing silently (naming the likely cause — a blocked CDN — and what to do
about it). The map-dependent helpers (`updateUserMarker`, `findNearby`,
`startNavigation`, `clearNavigation`) all guard against `state.map` being
`null` too, so using GPS/search still works without throwing even if the map
itself couldn't load — you'll just be missing the visual map, not the whole
app.

## Re-theme: government-portal look

The dark "tactical ops" theme was replaced with a light, formal palette more
in line with an official government portal (navy/white/gold, similar to the
NDMA/gov.in-style references from earlier in this conversation):
- `css/style.css` → `:root` now defines light backgrounds, dark navy text,
  and slightly darker/more saturated status colors (green/amber/red) for
  better contrast against white.
- A thin **saffron/white/green ribbon** was added above the header (a
  detail common on Indian government sites).
- A working **accessibility toolbar** was added above the header:
  - `A- / A / A+` — three real text-size steps (87.5% / 100% / 137.5%),
    applied to the root font size.
  - **High Contrast** — toggles a `high-contrast` class on `<body>` that
    swaps the whole palette to a black/yellow high-contrast scheme (a
    pattern common on GIGW-compliant Indian government portals), rather
    than being a decorative, non-functional button.
  Both are wired up in `main.js` → `wireAccessibilityBar()`.

Almost everything else in the CSS references the `--bg`/`--panel`/`--text`/
etc. custom properties rather than hardcoded colors, so this was mostly a
matter of redefining those variables in one place; only a couple of
already-intentionally-dark elements (video thumbnails, the navy "Our
Activity" band) were left as-is since they're supposed to stay dark
regardless of the overall theme.

## New in a previous pass: real photos + content duplicated onto Tactical Map Ops

Two follow-up changes on top of the "Preparedness & News" tab above:

1. **Real photos on the Do's & Don'ts cards.** Each of the 8 cards now has an
   actual photo (not just a gradient + emoji) behind a readable text overlay,
   matching the reference design. Every image is a specific, individually
   verified file from **Wikimedia Commons** — public domain or Creative
   Commons licensed (several are official NOAA/FEMA/USGS photos, which are
   U.S. government works and therefore public domain) — loaded via Commons'
   `Special:FilePath` endpoint, which is the standard, stable way to hotlink
   a Commons file from an external site. If a given file ever gets renamed
   or removed, the `<img onerror="this.remove()">` on each card quietly
   drops back to the plain gradient-and-icon look instead of showing a
   broken image. The exact file used for each disaster type is listed in
   `config.js` → `DISASTER_GUIDES[].image` if you want to swap any of them.

2. **All of "Preparedness & News" also appears on "Tactical Map Ops".** The
   Do's & Don'ts carousel, Our Activity band, Survival Videos grid, and
   Latest Disaster News feed are now rendered twice: once on their own tab
   (unchanged ids) and once more at the bottom of the Tactical Map Ops tab
   (same content, `-ops`-suffixed element ids so nothing collides). This
   was done by parameterizing each module's `init...()` function to take an
   optional id suffix and mounting it twice from `main.js`, rather than
   copy-pasting the modules — so the two copies always show identical data
   and there's exactly one place to edit each. The disaster-news feed is
   fetched from NASA once and rendered into both copies rather than hitting
   the API twice.

## New in this pass: "Preparedness & News" tab

A third tab was added alongside the existing "Tactical Map Ops" and "Weather &
Geo-Alerts" tabs — nothing in either of those two was modified. The new tab
has four sections:

1. **Do's & Don'ts carousel** — a slider over 8 disaster types (Heat Wave,
   Cold Wave, Earthquake, Landslide, Tsunami, Cyclone, Forest Fire, Floods),
   each with concise do/don't guidance. Shows 4/3/2/1 cards at a time
   depending on screen width, with prev/next controls. Content lives in
   `config.js` → `DISASTER_GUIDES`, so adding a 9th disaster type is a matter
   of adding one object, not touching any markup or carousel logic.
2. **Our Activity** — a static band of 5 cards (Disaster Risk Reduction,
   Capacity Building, Awareness & Education, Research & Innovation,
   Coordination & Collaboration), each with a small inline-SVG icon in the
   same line-icon style as the rest of the app.
3. **Survival Videos** — a grid of real, publicly published "how to survive"
   videos (American Red Cross, National Geographic's 101 series covering
   earthquakes, tsunamis, hurricanes, wildfires, and floods). Thumbnails come
   from YouTube's public thumbnail image endpoint (no key needed); nothing is
   embedded from YouTube until a person clicks play, at which point it swaps
   in a privacy-enhanced (`youtube-nocookie.com`) embed for just that video.
4. **Latest Disaster News** — a live feed of currently-open natural disaster
   events pulled from **NASA's EONET API** (`eonet.gsfc.nasa.gov`), which is
   free, requires no API key or registration, and is NASA's own
   documented-for-client-side-use disaster event tracker. Each card shows the
   event's category, the most recent date NASA has geometry for, and a
   "Read more" link to the original reporting source NASA cites for that
   event. A "Refresh" button re-fetches on demand.
   - *Why EONET and not ReliefWeb:* ReliefWeb's API is arguably closer to a
     classic "disaster news" feed, but as of November 2025 it requires a
     pre-approved `appname` (an approval step outside this project's
     control), so it isn't something that works out of the box for every
     visitor. EONET needs no approval and is built for exactly this kind of
     client-side use, so it was used here instead. If you get a ReliefWeb
     appname approved, `ENDPOINTS.eonetEvents` in `config.js` is the one
     place to swap in a ReliefWeb query instead.

## Notes / known limitations (carried over from the original)

- Uses free, unauthenticated public endpoints (Nominatim, Overpass, OSRM,
  Open-Meteo, Windy embed) — all are rate-limited and not guaranteed uptime;
  the offline fallback data is a small hardcoded sample near Jammu, India and
  is not a substitute for real local knowledge during an actual emergency.
- No build step/bundler by design, to keep this easy to host anywhere
  (static hosting, a single Nginx `location /`, etc.). If the project grows
  much further, consider adding a bundler (Vite/esbuild) and a test runner
  for `utils.js`/`api.js`, which are already pure enough to unit test as-is.
