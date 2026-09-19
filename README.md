# 🚨 Aegisops – Disaster Response & Situational Awareness Dashboard

![Language](https://img.shields.io/badge/Language-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) ![Mapping](https://img.shields.io/badge/Mapping-Leaflet_&_OSM-199900?style=flat-square&logo=leaflet&logoColor=white) ![Routing](https://img.shields.io/badge/Routing-OSRM-FF4500?style=flat-square) ![Weather APIs](https://img.shields.io/badge/Weather-Open--Meteo-0078D7?style=flat-square) ![Disaster Data](https://img.shields.io/badge/Data-GDACS_&_NASA-0B3D91?style=flat-square) ![Architecture](https://img.shields.io/badge/Architecture-ES_Modules-FF69B4?style=flat-square)

1. Description

Aegiops is a robust, real-time disaster-response dashboard designed for critical situational awareness. Originating as a monolithic HTML file (~600 lines, everything inline), it has been engineered into a highly maintainable, modular architecture. It provides live GPS tracking, dynamic routing to the nearest hospitals and safe zones, local emergency dispatch numbers, and a comprehensive weather and severe-alert panel.

Key Capabilities:

Tactical Map Ops: Real-time location tracking with concurrent nearest-facility queries via Overpass API, featuring smart offline-caching fallback.
Global Disaster Intelligence: Live disaster feeds aggregated from GDACS (Global Disaster Alert and Coordination System) and NASA EONET.
Weather & Geo-Alerts: Integrated live weather radar, hourly forecasts, and localized warnings.
Preparedness Center: Automated Do's & Don'ts carousels with verified Wikimedia imagery, and a privacy-enhanced survival video grid.
Accessibility First: GIGW-compliant portal theme (navy/white/gold) featuring an active accessibility toolbar (High Contrast mode, text scaling), ARIA labels, and prefers-reduced-motion support.
2. Project Structure

The project is built entirely on native ES Modules — requiring no bundler — and is engineered for rapid deployment on any static file server.

text
Aegisops-dashboard/
├── index.html                  # Clean markup only — no inline <style> or business logic
├── css/
│   └── style.css               # All styling, centralized theming and responsive design
├── js/
│   ├── config.js                # Static data: offline fallbacks, emergency numbers, APIs, guides
│   ├── utils.js                 # Pure helpers: haversine, bearing, debounce, HTML-escaping
│   ├── api.js                   # All external network calls — no DOM access, fails soft
│   ├── state.js                 # Single shared mutable state object (map, layers, GPS watch)
│   ├── ui.js                    # DOM helpers: status text, tab switching, empty states
│   ├── mapView.js                # Leaflet map, nearby-facility search, turn-by-turn navigation
│   ├── weatherPanel.js           # Live radar embed + current/hourly/7-day rendering
│   ├── locationController.js     # Orchestrates GPS tracking / manual search and syncing
│   ├── guidesCarousel.js         # Do's & Don'ts slider (8 disaster-type cards)
│   ├── activityBand.js           # "Our Activity" static info cards
│   ├── videoGrid.js              # Survival Videos grid, click-to-embed
│   ├── disasterNews.js           # Latest Disaster News, live via GDACS & NASA EONET
│   └── main.js                   # Entry point — wires up DOM listeners, boots map on load
└── README.md
3. Prerequisites & Installation

Because it uses ES modules (<script type="module">), opening index.html directly via file:// will be blocked by the browser's CORS rules. Serve it over HTTP instead.

Clone the Repository:

bash
git clone https://github.com/Piyush-Sambyall/Aegiops-Dashboard.git
cd Aegiops-Dashboard

Serve the Application:

bash
# Using Python 3
python3 -m http.server 8080

# OR using Node.js
npx serve .

Access the Dashboard: Open http://localhost:8080 in your web browser.

4. Technical Enhancements & Architecture Updates
Structural & State Management
Modular ES6: Inline <script> and <style> tags were stripped out. The logic is now split across focused ES modules instead of one massive block of global functions.
Shared State: Replaced scattered top-level global variables with a single state object imported wherever needed.
Event Delegation: Replaced inline onclick attributes with centralized delegated click listeners in main.js, functioning cleanly under strict Content-Security-Policies.
Error Isolation: main.js now boots each module independently. If a firewall blocks a CDN (like Leaflet), the app degrades gracefully — showing a map error while keeping the rest of the dashboard (News, Weather, Guides) fully functional.

Correctness & Robustness
Security: All text pulled from third-party APIs (place names, addresses, country codes) is now strictly HTML-escaped before DOM insertion, closing XSS vulnerabilities.
Concurrency: Nearby-facility fetches and weather fetches now run concurrently (Promise.all), significantly reducing time-to-first-fix.
Smarter Offline Fallbacks: Searching a remote area with no live OSM data no longer silently falls back to offline cache from a completely different region. The offline cache now only displays if it's within 150km of the searched location; otherwise, it provides a transparent "no data available" warning.
Resilient Queries: The live Overpass search radius was widened (40km to 60km), timeout raised to 20s, and a third Overpass mirror was added for redundancy.

Data & Intelligence Pipelines
GDACS Integration: Disaster news now prioritizes GDACS (Global Disaster Alert and Coordination System) for severity-rated (Green/Orange/Red) reporting across all major disaster types.
Fallback Strategy: If GDACS is unreachable, disasterNews.js transparently falls back to NASA EONET.
Layout Fixes: Grid alignment issues caused by excessively long GDACS country strings ballooning card heights were fixed using align-items: start and text clamping.
Contextual Addresses: Hospital/safe-zone results now include City, State, and Country context inherited from the searched location, rather than just isolated street names.

UX, Accessibility & Theming
Government Portal Theme: Transitioned from a dark "tactical ops" theme to a light, formal palette (navy/white/gold) reminiscent of official government portals (e.g., NDMA/gov.in). Features a saffron/white/green ribbon detail.
Accessibility Toolbar: An active toolbar allows users to scale text (A- / A / A+) and toggle a high-contrast (black/yellow) GIGW-compliant mode.
Screen Readers & Keyboard Nav: Added proper ARIA roles (tab/tabpanel), an aria-live status region, a "skip to main content" link, and visible focus rings (:focus-visible).
Animation Control: Respects prefers-reduced-motion to disable spinners, pulses, and the auto-advancing carousel for users who request it.

Preparedness & News Hub
Do's & Don'ts Carousel: Auto-advancing slider covering 8 disaster types. Uses verified, high-quality public domain/Creative Commons imagery dynamically loaded from Wikimedia Commons.
Survival Videos: A grid of real "how to survive" videos (Red Cross, NatGeo). Uses YouTube's public thumbnail endpoint and only loads a privacy-enhanced youtube-nocookie.com embed when a user actively clicks play.
Unified Views: All Preparedness content is rendered twice — once on its dedicated tab, and once embedded at the bottom of the "Tactical Map Ops" tab — powered by parameterized rendering so APIs are only hit once.

5. Notes & Limitations
Public Endpoints: Uses free, unauthenticated public endpoints (Nominatim, Overpass, OSRM, Open-Meteo, Windy embed). These are rate-limited and not guaranteed 100% uptime during catastrophic regional outages.
Offline Data Scope: The hardcoded offline fallback data is a small sample centered near Jammu, India, and is not a substitute for real local knowledge during an emergency.
No Build Step: By design, to keep hosting simple. If the project grows significantly, adding a bundler (Vite/esbuild) and a test runner for utils.js/api.js is recommended.

Author
Piyush Sambyal
