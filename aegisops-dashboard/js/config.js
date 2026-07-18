/* =========================================================================
   Offline Fallback Database & Emergency Numbers
   Coordinates default to the Jammu region (used only if geolocation/search
   never resolves and the live Overpass API is unreachable).
   ========================================================================= */

export const OFFLINE_FACILITIES = {
  hospitals: [
    { name: "Govt Medical College Jammu (Offline Cache)", pos: [32.735, 74.855], tags: { 'addr:street': "Maheshpura Chowk", 'addr:city': "Jammu", 'addr:state': "Jammu and Kashmir", 'addr:country': "IN" } },
    { name: "Super Specialty Hospital (Offline Cache)", pos: [32.730, 74.860], tags: { 'addr:street': "Resham Ghar Colony", 'addr:city': "Jammu", 'addr:state': "Jammu and Kashmir", 'addr:country': "IN" } }
  ],
  safepoints: [
    { name: "Jammu University Grounds (Offline Cache)", pos: [32.718, 74.868], tags: { 'addr:street': "University Road", 'addr:city': "Jammu", 'addr:state': "Jammu and Kashmir", 'addr:country': "IN" } }
  ]
};

export const EMERGENCY_NUMBERS = {
  us: { general: "911", note: "Police/Fire/Ambulance" },
  ca: { general: "911", note: "Police/Fire/Ambulance" },
  in: { general: "112", police: "100", ambulance: "108", fire: "101", note: "Unified: 112" },
  gb: { general: "999", alt: "112", note: "Police/Fire/Ambulance" },
  au: { general: "000", alt: "112", note: "Police/Fire/Ambulance" },
  default: { general: "112", note: "112 works on most GSM networks worldwide" },
};

export function getEmergencyNumbers(countryCode) {
  return (countryCode && EMERGENCY_NUMBERS[countryCode.toLowerCase()]) || EMERGENCY_NUMBERS.default;
}

export const WMO_CODES = {
  0: { txt: "Clear Sky", icon: "sun" }, 1: { txt: "Mainly Clear", icon: "sun" }, 2: { txt: "Partly Cloudy", icon: "partly" }, 3: { txt: "Overcast", icon: "cloud" },
  45: { txt: "Fog", icon: "fog" }, 48: { txt: "Rime Fog", icon: "fog" }, 51: { txt: "Light Drizzle", icon: "drizzle" }, 53: { txt: "Mod Drizzle", icon: "drizzle" },
  55: { txt: "Dense Drizzle", icon: "drizzle" }, 61: { txt: "Light Rain", icon: "rain" }, 63: { txt: "Mod Rain", icon: "rain" }, 65: { txt: "Heavy Rain", icon: "rain", alert: "Heavy Rain Warning" },
  71: { txt: "Light Snow", icon: "snow" }, 73: { txt: "Mod Snow", icon: "snow" }, 75: { txt: "Heavy Snow", icon: "snow", alert: "Heavy Snowfall Warning" },
  80: { txt: "Light Showers", icon: "showers" }, 81: { txt: "Mod Showers", icon: "showers" }, 82: { txt: "Violent Showers", icon: "rain", alert: "Violent Rain Showers" },
  95: { txt: "Thunderstorm", icon: "storm", alert: "Active Thunderstorm Warning" }, 96: { txt: "Storm w/ Hail", icon: "storm", alert: "Severe Thunderstorm with Hail" }, 99: { txt: "Heavy Hail Storm", icon: "storm", alert: "Severe Hail Storm Warning" }
};

/** Map + routing tile / API endpoints, centralised so they're easy to swap later. */
export const ENDPOINTS = {
  tileLayer: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  nominatimReverse: (lat, lon) => `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`,
  nominatimSearch: (query) => `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}&addressdetails=1`,
  overpass: ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.openstreetmap.ru/cgi/interpreter"],
  osrmRoute: (fromLat, fromLon, toLat, toLon) => `https://router.project-osrm.org/route/v1/driving/${fromLon},${fromLat};${toLon},${toLat}?overview=false`,
  openMeteo: (lat, lon) => `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`,
  windyRadar: (lat, lon) => `https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=7&overlay=rain&product=ecmwf&level=surface&lat=${lat}&lon=${lon}&detailLat=${lat}&detailLon=${lon}`,
  // NASA EONET — free, public, no API key or registration required, and
  // documented for direct client-side (browser) use. Returns real, actively
  // tracked natural-disaster events (wildfires, storms, floods, quakes, etc.)
  // each with a link back to the original reporting source. Used as an
  // automatic fallback if GDACS (the primary news source below) is
  // unreachable.
  eonetEvents: (limit = 9) => `https://eonet.gsfc.nasa.gov/api/v3/events?status=open&limit=${limit}`,
  // GDACS (Global Disaster Alert and Coordination System) — a joint
  // initiative of the UN and the European Commission. Free, no key, no
  // registration. Chosen as the primary "Latest Disaster News" source
  // because it naturally spans every major disaster type (earthquakes,
  // cyclones, floods, volcanoes, droughts, wildfires) with a real severity
  // rating (Green/Orange/Red), rather than being dominated by whichever
  // single category happens to have the most open events at the moment.
  gdacsEvents: () => `https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?`
};

/** GDACS event-type codes -> readable label + accent color. */
export const GDACS_EVENT_TYPES = {
  EQ: { label: "Earthquake", color: "#b91c1c" },
  TC: { label: "Cyclone", color: "#7c3aed" },
  FL: { label: "Flood", color: "#0891b2" },
  VO: { label: "Volcano", color: "#dc2626" },
  WF: { label: "Wildfire", color: "#ea580c" },
  DR: { label: "Drought", color: "#d97706" },
};

/** GDACS alert levels -> accent color, used for the severity badge. */
export const GDACS_ALERT_COLORS = {
  Green: "#15803d",
  Orange: "#b45309",
  Red: "#b91c1c",
};

/* =========================================================================
   NEW SECTION DATA — Do's & Don'ts guides, "Our Activity", survival videos,
   and the disaster-news category display map. Purely additive: none of the
   config/exports above are modified.
   ========================================================================= */

/** One card per disaster type for the "Do's & Don'ts" carousel. */
export const DISASTER_GUIDES = [
  {
    id: "heatwave", title: "Summer (Heat Wave)", color: "#d97706",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Extreme_heat_warning_sign_in_Death_Valley,_California,_USA_(9281).jpg?width=800",
    dos: [
      "Wear lightweight, light-coloured, loose cotton clothing.",
      "Get trained in basic first aid.",
      "Stay indoors during extreme heat; use fans or coolers safely."
    ],
    donts: [
      "Avoid going out in direct sun, especially between noon and 3 p.m.",
      "Avoid strenuous activity outdoors in the afternoon."
    ]
  },
  {
    id: "coldwave", title: "Winter (Cold Wave)", color: "#2563eb",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Ground_Blizzard_-_Flickr_-_Ted_LaBar.jpg?width=800",
    dos: [
      "Keep dry — change out of wet clothes quickly to prevent heat loss.",
      "Drink warm fluids and eat hot food regularly.",
      "Follow radio/TV/newspaper updates for cold-wave warnings."
    ],
    donts: [
      "Don't step outside early morning or late night unless necessary.",
      "Don't drink alcohol — it lowers your core body temperature."
    ]
  },
  {
    id: "earthquake", title: "Earthquakes", color: "#dc2626",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Collapsed_freeway_interchange,_1994_Northridge_Earthquake.jpg?width=800",
    dos: [
      "Repair deep plaster or foundation cracks; get expert advice on structural defects.",
      "Anchor overhead light fixtures securely to the ceiling.",
      "Follow local building codes (e.g. BIS codes in India) for your area."
    ],
    donts: [
      "Do not move from where you are during active shaking — drop, cover, hold on.",
      "Do not light a match or flame — check for gas leaks first."
    ]
  },
  {
    id: "landslide", title: "Landslide", color: "#16a34a",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Landslide_in_Mameyes,_Ponce,_Puerto_Rico,_in_1985,_photographed_by_USGS_Jibson.jpg?width=800",
    dos: [
      "Plan travel to hilly regions around official weather-department advisories.",
      "Move away from the slide path or downstream valleys immediately."
    ],
    donts: [
      "Avoid building or staying in known vulnerable/high-risk zones.",
      "Don't panic or waste energy — move calmly and quickly to safety."
    ]
  },
  {
    id: "tsunami", title: "Tsunami", color: "#0891b2",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Nang_Thong_Beach_Tsunami_2004_Khao_Lak.jpg?width=800",
    dos: [
      "Know your street's elevation and distance from the coast or open water.",
      "Plan and practice evacuation routes from home, school, and work."
    ],
    donts: [
      "Do not wait for an official tsunami warning — move to higher ground immediately if the ground shakes near the coast."
    ]
  },
  {
    id: "cyclone", title: "Cyclone", color: "#7c3aed",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Katrina_2005-08-28_2245Z.jpg?width=800",
    dos: [
      "Secure loose tiles and repair doors/windows ahead of the season.",
      "Keep boards ready to cover glass windows if needed.",
      "Keep a battery lantern, torches, and spare dry cells on hand."
    ],
    donts: [
      "Do not go outside even once winds appear to calm — the eye may pass and winds can return."
    ]
  },
  {
    id: "forestfire", title: "Forest Fire", color: "#ea580c",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/Huge_forest_fire_and_smoke.jpg?width=800",
    dos: [
      "Keep local fire-service and forest-authority contact numbers handy.",
      "Report any unattended or out-of-control fire immediately."
    ],
    donts: [
      "Do not burn stubble or municipal waste near forest areas.",
      "Do not burn dry farm waste close to forest land."
    ]
  },
  {
    id: "floods", title: "Rainy Season (Floods)", color: "#0d9488",
    image: "https://commons.wikimedia.org/wiki/Special:FilePath/FEMA_downtown_Cedar_Rapids_Iowa_flood_2008.jpg?width=800",
    dos: [
      "Listen to radio/TV/newspapers for ongoing weather updates.",
      "Stay well away from electric poles and fallen power lines."
    ],
    donts: [
      "Do not allow children to play in or near flood water.",
      "Don't use any electrical appliance that's been water-damaged until it's checked."
    ]
  }
];

/** Five cards for the "Our Activity" band. */
export const OUR_ACTIVITIES = [
  { title: "Disaster Risk Reduction", desc: "Creating national guidelines, promoting safe infrastructure, and reducing vulnerability." },
  { title: "Capacity Building", desc: "Training first responders, organizing mock drills, and strengthening disaster response." },
  { title: "Awareness & Education", desc: "Spreading knowledge through campaigns, workshops, and digital outreach." },
  { title: "Research & Innovation", desc: "Integrating technology and data for early-warning systems and efficient disaster response." },
  { title: "Coordination & Collaboration", desc: "Aligning agencies, partners, and communities so relief efforts move faster and reach further." }
];

/** Curated real, publicly published "how to survive" videos (YouTube IDs). */
export const SURVIVAL_VIDEOS = [
  { id: "r5EbbrVXoQw", title: "How to Survive an Earthquake", channel: "American Red Cross" },
  { id: "_oPb_9gOdn4", title: "Tsunamis 101", channel: "National Geographic" },
  { id: "LlXVikDkyTg", title: "Hurricanes 101", channel: "National Geographic" },
  { id: "5hghT1W33cY", title: "Wildfires 101", channel: "National Geographic" },
  { id: "4PXj7bOD7IY", title: "Floods 101", channel: "National Geographic" }
];

/** Display styling for NASA EONET's disaster event categories. */
export const EONET_CATEGORY_DISPLAY = {
  wildfires: { color: "#ea580c" },
  severeStorms: { color: "#7c3aed" },
  floods: { color: "#0891b2" },
  volcanoes: { color: "#dc2626" },
  earthquakes: { color: "#b91c1c" },
  landslides: { color: "#16a34a" },
  drought: { color: "#d97706" },
  snow: { color: "#2563eb" },
  tempExtremes: { color: "#d97706" },
  seaLakeIce: { color: "#0284c7" },
  waterColor: { color: "#0891b2" },
  dustHaze: { color: "#6b7580" },
  manmade: { color: "#dc2626" },
  default: { color: "#6b7580" }
};
