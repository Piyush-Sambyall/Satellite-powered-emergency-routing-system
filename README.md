# 🚨 Aegisops – Disaster Response & Situational Awareness Dashboard

![Language](https://img.shields.io/badge/Language-JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black) ![Mapping](https://img.shields.io/badge/Mapping-Leaflet_&_OSM-199900?style=flat-square&logo=leaflet&logoColor=white) ![Routing](https://img.shields.io/badge/Routing-OSRM-FF4500?style=flat-square) ![Weather APIs](https://img.shields.io/badge/Weather-Open--Meteo-0078D7?style=flat-square) ![Disaster Data](https://img.shields.io/badge/Data-GDACS_&_NASA-0B3D91?style=flat-square) ![Architecture](https://img.shields.io/badge/Architecture-ES_Modules-FF69B4?style=flat-square)

> **Real-time disaster-response dashboard:** Features live GPS tracking, nearest hospital and safe-zone routing, local emergency numbers, and a live weather + severe-alert panel.

This project started life as a single `index.html` file (~600 lines, everything inline) and has been successfully refactored into a modular, maintainable architecture with substantial functional, accessibility, and quality-of-life enhancements.

---

## 1. Project Structure

The application is built using native ES modules without the need for a complex build step. `index.html` loads `js/main.js` (`<script type="module">`), which imports the necessary dependencies.

```text
 Aegisops-dashboard/
├── index.html             Markup only — no inline <style> or business logic
├── css/
│   └── style.css          All styling, extracted from the original <style> block
├── js/
│   ├── config.js          Static data: offline fallback facilities, emergency numbers, API endpoints, Do's & Don'ts, etc.
│   ├── utils.js           Pure helpers: haversine distance, bearing, debounce, HTML-escaping
│   ├── api.js             All external network calls (Nominatim, Overpass, OSRM, Open-Meteo) — fails soft
│   ├── state.js           Single shared mutable state object (map, layers, current location)
│   ├── ui.js              Small DOM helpers: status text, tab switching, rendering states
│   ├── mapView.js         Leaflet map, nearby-facility search & rendering, turn-by-turn navigation
│   ├── weatherPanel.js    Live radar embed + current/hourly/7-day rendering
│   ├── locationController.js Orchestrates GPS tracking / manual search to update map and weather
│   ├── guidesCarousel.js  NEW — Do's & Don'ts slider (8 disaster-type cards)
│   ├── activityBand.js    NEW — "Our Activity" static info cards
│   ├── videoGrid.js       NEW — Survival Videos grid, click-to-embed
│   ├── disasterNews.js    NEW — Latest Disaster News, live via NASA EONET / GDACS
│   └── main.js            Entry point — wires up DOM event listeners, boots the map
└── README.md
