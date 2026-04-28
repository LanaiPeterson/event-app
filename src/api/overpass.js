const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

export const PLACE_CATEGORIES = [
  { id: "museums",      name: "Museums",         icon: "🏛️",  color: "#8e44ad", tags: [["tourism","museum"]] },
  { id: "zoos",         name: "Zoos",            icon: "🦁",  color: "#e67e22", tags: [["tourism","zoo"]] },
  { id: "aquariums",    name: "Aquariums",        icon: "🐠",  color: "#2980b9", tags: [["tourism","aquarium"]] },
  { id: "theme_parks",  name: "Amusement Parks",  icon: "🎢",  color: "#e74c3c", tags: [["tourism","theme_park"],["leisure","amusement_park"]] },
  { id: "cinemas",      name: "Movie Theaters",   icon: "🎬",  color: "#c0392b", tags: [["amenity","cinema"]] },
  { id: "theatres",     name: "Theatres",         icon: "🎭",  color: "#6c63ff", tags: [["amenity","theatre"]] },
  { id: "music_venues", name: "Music Venues",     icon: "🎵",  color: "#1abc9c", tags: [["amenity","music_venue"],["amenity","concert_hall"]] },
  { id: "bowling",      name: "Bowling Alleys",   icon: "🎳",  color: "#f39c12", tags: [["leisure","bowling_alley"]] },
  { id: "mini_golf",    name: "Mini Golf",        icon: "⛳",  color: "#27ae60", tags: [["leisure","miniature_golf"]] },
  { id: "arcades",      name: "Arcades",          icon: "🕹️",  color: "#9b59b6", tags: [["leisure","amusement_arcade"]] },
  { id: "parks",        name: "Parks",            icon: "🌳",  color: "#2ecc71", tags: [["leisure","park"]] },
  { id: "libraries",    name: "Libraries",        icon: "📚",  color: "#34495e", tags: [["amenity","library"]] },
];

export async function fetchNearbyPlaces({ lat, lng, radiusMeters = 10000, category }) {
  const cat = PLACE_CATEGORIES.find((c) => c.id === category);
  if (!cat) throw new Error("Unknown category");

  const tagFilters = cat.tags
    .map(([k, v]) =>
      `node["${k}"="${v}"](around:${radiusMeters},${lat},${lng});\n` +
      `way["${k}"="${v}"](around:${radiusMeters},${lat},${lng});\n` +
      `relation["${k}"="${v}"](around:${radiusMeters},${lat},${lng});`
    )
    .join("\n");

  const query = `[out:json][timeout:25];\n(\n${tagFilters}\n);\nout center;`;

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    body: `data=${encodeURIComponent(query)}`,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  if (!res.ok) throw new Error("Overpass API error");
  const data = await res.json();

  return data.elements
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat;
      const elLng = el.lon ?? el.center?.lon;
      if (!elLat || !elLng) return null;
      const name = el.tags?.name;
      if (!name) return null;
      const addrParts = [
        el.tags?.["addr:housenumber"],
        el.tags?.["addr:street"],
        el.tags?.["addr:city"],
        el.tags?.["addr:state"],
      ].filter(Boolean);
      return {
        id: `place_${el.type}_${el.id}`,
        name,
        lat: elLat,
        lng: elLng,
        address: addrParts.length ? addrParts.join(", ") : null,
        phone: el.tags?.phone || null,
        website: el.tags?.website || null,
        hours: el.tags?.["opening_hours"] || null,
      };
    })
    .filter(Boolean);
}
