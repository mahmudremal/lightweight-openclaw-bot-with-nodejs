import axios from "axios";

export async function handleWeatherSkill({
  lat,
  lon,
  place,
  units = "metric",
}) {
  try {
    if (!lat || !lon) {
      if (!place || place === "current location") {
        return "Please provide coordinates for weather.";
      } else {
        return `I don't have coordinates for "${place}". Please provide lat/lon.`;
      }
    }

    const resp = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: lat,
        longitude: lon,
        hourly: "temperature_2m,relativehumidity_2m,precipitation",
        daily:
          "temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode",
        timezone: "auto",
      },
      timeout: 10000,
    });

    const data = resp.data;
    const daily = data.daily;
    const todayIndex = 0;
    const tmax = daily?.temperature_2m_max?.[todayIndex];
    const tmin = daily?.temperature_2m_min?.[todayIndex];
    const precip = daily?.precipitation_sum?.[todayIndex];

    return `Weather for (${lat},${lon}):
- Today: high ${tmax}°, low ${tmin}°
- Precipitation: ${precip} mm`;
  } catch (err) {
    return `Weather service error: ${err.message}`;
  }
}
