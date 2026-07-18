/* =========================================================================
   Weather dashboard: live radar embed + Open-Meteo current/hourly/daily data.
   ========================================================================= */
import { WMO_CODES, ENDPOINTS } from './config.js';
import { fetchWeatherData } from './api.js';
import { escapeHtml } from './utils.js';
import { showEmptyNote } from './ui.js';

// Small line-icon set for weather conditions, in the same stroke style as
// the rest of the app (no emoji). `%%` is swapped for the requested size.
const WEATHER_ICON_PATHS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>',
  partly: '<circle cx="8" cy="9" r="3.2"/><path d="M8 3.5v1.3M3.5 9H4.8M8.9 4.6l-.9.9M3.6 13.4l.9-.9"/><path d="M9.5 20h7a3.5 3.5 0 0 0 .5-6.96A5 5 0 0 0 7.3 14.2 3.2 3.2 0 0 0 9.5 20z"/>',
  cloud: '<path d="M6.5 19h11a4 4 0 0 0 .4-8A6 6 0 0 0 6.2 9.6 4.2 4.2 0 0 0 6.5 19z"/>',
  fog: '<path d="M6.5 15h11a4 4 0 0 0 .4-8A6 6 0 0 0 6.2 5.6 4.2 4.2 0 0 0 6.5 15z"/><path d="M4 19h16M6 22h12"/>',
  drizzle: '<path d="M6.5 12h11a4 4 0 0 0 .4-8A6 6 0 0 0 6.2 2.6 4.2 4.2 0 0 0 6.5 12z" transform="translate(0,-1)"/><path d="M8 17v2M12 17v2M16 17v2"/>',
  rain: '<path d="M6.5 11h11a4 4 0 0 0 .4-8A6 6 0 0 0 6.2 1.6 4.2 4.2 0 0 0 6.5 11z" transform="translate(0,1)"/><path d="M7 16l-1.5 4M12 16l-1.5 4M17 16l-1.5 4"/>',
  showers: '<path d="M6.5 11h11a4 4 0 0 0 .4-8A6 6 0 0 0 6.2 1.6 4.2 4.2 0 0 0 6.5 11z" transform="translate(0,1)"/><path d="M8 16l-2 5M13 16l-2 5M18 16l-2 5"/>',
  snow: '<path d="M6.5 11h11a4 4 0 0 0 .4-8A6 6 0 0 0 6.2 1.6 4.2 4.2 0 0 0 6.5 11z" transform="translate(0,1)"/><path d="M8 17v4M6.3 18.5l3.4 2M10.3 18.5l-3.4 2"/><path d="M16 17v4M14.3 18.5l3.4 2M18.3 18.5l-3.4 2"/>',
  storm: '<path d="M6.5 10h11a4 4 0 0 0 .4-8A6 6 0 0 0 6.2 0.6 4.2 4.2 0 0 0 6.5 10z" transform="translate(0,2)"/><path d="M13 14l-3 5h3l-2 4"/>'
};

function weatherIconSvg(key, size = 22) {
  const paths = WEATHER_ICON_PATHS[key] || WEATHER_ICON_PATHS.cloud;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;
}

export async function loadWeatherDashboard(lat, lon, areaName) {
  // 1. Update the interactive radar iframe
  document.getElementById('weatherRadar').src = ENDPOINTS.windyRadar(lat, lon);

  try {
    // 2. Fetch live weather data
    const data = await fetchWeatherData(lat, lon);

    // Current conditions
    const cur = data.current;
    const wData = WMO_CODES[cur.weather_code] || { txt: "Unknown", icon: "cloud" };

    document.getElementById('w-city').textContent = areaName;
    document.getElementById('w-icon').innerHTML = weatherIconSvg(wData.icon, 44);
    document.getElementById('w-temp').textContent = `${Math.round(cur.temperature_2m)}°C`;
    document.getElementById('w-cond').textContent = wData.txt;
    document.getElementById('w-feels').textContent = `${Math.round(cur.apparent_temperature)}°C`;
    document.getElementById('w-wind').textContent = `${cur.wind_speed_10m} km/h`;
    document.getElementById('w-hum').textContent = `${cur.relative_humidity_2m}%`;
    document.getElementById('w-precip').textContent = `${cur.precipitation} mm`;

    const updatedEl = document.getElementById('w-updated');
    if (updatedEl) updatedEl.textContent = `Last updated ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    // Severe weather alert banner
    const alertBanner = document.getElementById('geoAlertBanner');
    if (wData.alert) {
      document.getElementById('geoAlertText').textContent = `CRITICAL: ${wData.alert} detected in your sector.`;
      alertBanner.classList.add('active');
    } else {
      alertBanner.classList.remove('active');
    }

    // Hourly outlook (next 24h)
    const hourlyHtml = [];
    for (let i = 0; i < 24 && i < data.hourly.time.length; i++) {
      const timeStr = new Date(data.hourly.time[i]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const hCode = WMO_CODES[data.hourly.weather_code[i]] || { icon: "cloud" };
      const hTemp = Math.round(data.hourly.temperature_2m[i]);
      hourlyHtml.push(`<div class="hour-card"><div class="time">${escapeHtml(timeStr)}</div><div class="icon">${weatherIconSvg(hCode.icon)}</div><div class="temp">${hTemp}°</div></div>`);
    }
    document.getElementById('hourlyList').innerHTML = hourlyHtml.join("");

    // 7-day extended forecast
    const dailyHtml = [];
    for (let i = 0; i < 7 && i < data.daily.time.length; i++) {
      const date = new Date(data.daily.time[i]);
      const dayName = i === 0 ? "Today" : date.toLocaleDateString([], { weekday: 'short' });
      const dCode = WMO_CODES[data.daily.weather_code[i]] || { icon: "cloud" };
      const maxT = Math.round(data.daily.temperature_2m_max[i]);
      const minT = Math.round(data.daily.temperature_2m_min[i]);
      const uv = data.daily.uv_index_max[i] || 0;

      dailyHtml.push(`
        <div class="day-row">
          <div class="day-name">${escapeHtml(dayName)}</div>
          <div class="icon">${weatherIconSvg(dCode.icon)}</div>
          <div class="uv">UV: ${uv}</div>
          <div class="temps">${maxT}° <span>${minT}°</span></div>
        </div>`);
    }
    document.getElementById('dailyList').innerHTML = dailyHtml.join("");

  } catch (e) {
    showEmptyNote('hourlyList', 'Weather data unavailable offline.');
    showEmptyNote('dailyList', 'Weather data unavailable offline.');
  }
}
