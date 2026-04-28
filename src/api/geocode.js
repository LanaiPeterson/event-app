const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const BASE = "https://maps.googleapis.com/maps/api/geocode/json";

// Build a clean "City, ST" label from Google's address_components array.
function buildLabel(components = [], formatted = "") {
  const get = (...types) =>
    components.find((c) => types.some((t) => c.types.includes(t)));

  const city = get("locality", "sublocality_level_1", "postal_town", "neighborhood");
  const state = get("administrative_area_level_1");
  const country = get("country");

  if (city && state) return `${city.long_name}, ${state.short_name}`;
  if (state && country?.short_name === "US") return state.long_name;
  if (city && country) return `${city.long_name}, ${country.short_name}`;

  // Strip trailing ", USA" / ", United States" from Google's formatted_address
  return formatted.replace(/, (USA|United States)$/, "").trim();
}

function friendlyError(status, query) {
  if (status === "ZERO_RESULTS")
    return `No location found for "${query}". Try a city name or ZIP code.`;
  if (status === "REQUEST_DENIED")
    return "Geocoding API not enabled — go to Google Cloud Console and enable the Geocoding API for your key.";
  if (status === "OVER_DAILY_LIMIT" || status === "OVER_QUERY_LIMIT")
    return "Google Maps quota reached. Try again later.";
  return `Location search failed (${status}). Please try again.`;
}

/**
 * Forward-geocode any query (city, ZIP, "Florida", full address).
 * Uses region=us to bias toward US results without hard-blocking other countries.
 */
export async function geocodeQuery(query) {
  const q = query.trim();
  if (!q) throw new Error("Please enter a city or ZIP code.");

  const url =
    `${BASE}?address=${encodeURIComponent(q)}&region=us&key=${KEY}`;

  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Network error — check your connection and try again.");
  }

  if (!res.ok) throw new Error(`Geocoding request failed (HTTP ${res.status}).`);

  const data = await res.json();

  if (data.status !== "OK") throw new Error(friendlyError(data.status, q));

  const top = data.results[0];
  const { lat, lng } = top.geometry.location;
  const label = buildLabel(top.address_components, top.formatted_address);
  return { lat, lng, label };
}

/**
 * Reverse-geocode GPS coordinates → { lat, lng, label }.
 * Falls back to "Your Location" on any error so the app never breaks.
 */
export async function reverseGeocode(lat, lng) {
  try {
    const url = `${BASE}?latlng=${lat},${lng}&key=${KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error();
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) throw new Error();
    const top = data.results[0];
    const label = buildLabel(top.address_components, top.formatted_address);
    return { lat, lng, label };
  } catch {
    return { lat, lng, label: "Your Location" };
  }
}
