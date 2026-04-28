// Open-Meteo — free, no API key required
const BASE = "https://api.open-meteo.com/v1/forecast";

const WMO = {
  0:  { label: "Clear sky",              icon: "☀️",  rainy: false },
  1:  { label: "Mainly clear",           icon: "🌤️",  rainy: false },
  2:  { label: "Partly cloudy",          icon: "⛅",  rainy: false },
  3:  { label: "Overcast",               icon: "☁️",  rainy: false },
  45: { label: "Foggy",                  icon: "🌫️",  rainy: false },
  48: { label: "Freezing fog",           icon: "🌫️",  rainy: false },
  51: { label: "Light drizzle",          icon: "🌦️",  rainy: true  },
  53: { label: "Drizzle",               icon: "🌦️",  rainy: true  },
  55: { label: "Heavy drizzle",          icon: "🌧️",  rainy: true  },
  61: { label: "Light rain",             icon: "🌧️",  rainy: true  },
  63: { label: "Rain",                   icon: "🌧️",  rainy: true  },
  65: { label: "Heavy rain",             icon: "🌧️",  rainy: true  },
  71: { label: "Light snow",             icon: "🌨️",  rainy: false },
  73: { label: "Snow",                   icon: "❄️",  rainy: false },
  75: { label: "Heavy snow",             icon: "❄️",  rainy: false },
  77: { label: "Snow grains",            icon: "🌨️",  rainy: false },
  80: { label: "Rain showers",           icon: "🌦️",  rainy: true  },
  81: { label: "Heavy rain showers",     icon: "🌧️",  rainy: true  },
  82: { label: "Violent rain showers",   icon: "⛈️",  rainy: true  },
  85: { label: "Snow showers",           icon: "🌨️",  rainy: false },
  86: { label: "Heavy snow showers",     icon: "❄️",  rainy: false },
  95: { label: "Thunderstorm",           icon: "⛈️",  rainy: true  },
  96: { label: "Thunderstorm w/ hail",   icon: "⛈️",  rainy: true  },
  99: { label: "Heavy thunderstorm",     icon: "⛈️",  rainy: true  },
};

export async function fetchWeather({ lat, lng, date }) {
  try {
    const url = `${BASE}?latitude=${lat}&longitude=${lng}` +
      `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max` +
      `&timezone=auto&start_date=${date}&end_date=${date}`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();

    const code     = data.daily?.weathercode?.[0] ?? 0;
    const tempMaxC = data.daily?.temperature_2m_max?.[0] ?? null;
    const tempMinC = data.daily?.temperature_2m_min?.[0] ?? null;
    const precip   = data.daily?.precipitation_probability_max?.[0] ?? 0;

    const info = WMO[code] ?? { label: "Unknown", icon: "🌡️", rainy: false };
    const toF  = (c) => (c != null ? Math.round(c * 9 / 5 + 32) : null);

    const suggestIndoor = info.rainy || precip >= 50;

    return {
      icon:              info.icon,
      label:             info.label,
      isSnowy:           [71, 73, 75, 77, 85, 86].includes(code),
      isRainy:           info.rainy,
      precipProbability: precip,
      tempMaxF:          toF(tempMaxC),
      tempMinF:          toF(tempMinC),
      tempMaxC:          tempMaxC != null ? Math.round(tempMaxC) : null,
      suggestIndoor,
      aiNote: suggestIndoor
        ? `Rain is likely (${precip}% chance, ${info.label}). CRITICAL: include a mix of indoor and outdoor stops so the group has covered backup options if weather worsens. Label weather-sensitive stops.`
        : `Weather looks good: ${info.label}. Outdoor activities are fine.`,
    };
  } catch {
    return null;
  }
}
