export async function geocodeQuery(query) {
  // Note: User-Agent is a forbidden browser header and is silently dropped,
  // so we omit custom headers and let the browser send its own.
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  let res;
  try {
    res = await fetch(url);
  } catch {
    throw new Error("Network error. Check your connection and try again.");
  }
  if (!res.ok) throw new Error("Location search failed. Please try again.");
  const data = await res.json();
  if (!data.length) {
    throw new Error(`No location found for "${query}". Try a city name or ZIP code.`);
  }
  const { lat, lon, display_name } = data[0];
  return { lat: parseFloat(lat), lng: parseFloat(lon), label: display_name };
}
