const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const NEARBY_URL = "https://places.googleapis.com/v1/places:searchNearby";
const TEXT_URL   = "https://places.googleapis.com/v1/places:searchText";

export function isConfigured() {
  return Boolean(KEY && KEY !== "your_google_maps_key_here");
}

export const PLACE_CATEGORIES = [
  // ── Entertainment ──────────────────────────────────────────
  { id: "amusement_park",  name: "Amusement Parks",  icon: "🎢", color: "#e74c3c", group: "entertainment", types: ["amusement_park"] },
  { id: "museum",          name: "Museums",           icon: "🏛️", color: "#8e44ad", group: "entertainment", types: ["museum"] },
  { id: "zoo",             name: "Zoos",              icon: "🦁", color: "#e67e22", group: "entertainment", types: ["zoo"] },
  { id: "aquarium",        name: "Aquariums",         icon: "🐠", color: "#2980b9", group: "entertainment", types: ["aquarium"] },
  { id: "movie_theater",   name: "Movie Theaters",    icon: "🎬", color: "#c0392b", group: "entertainment", types: ["movie_theater"] },
  { id: "theatre",         name: "Theatres",          icon: "🎭", color: "#6c63ff", group: "entertainment", types: ["performing_arts_theater"] },
  { id: "music_venue",     name: "Music Venues",      icon: "🎵", color: "#1abc9c", group: "entertainment", types: ["concert_hall", "night_club"] },
  { id: "bowling_alley",   name: "Bowling Alleys",    icon: "🎳", color: "#f39c12", group: "entertainment", types: ["bowling_alley"] },
  { id: "art_gallery",     name: "Art Galleries",     icon: "🎨", color: "#16a085", group: "entertainment", types: ["art_gallery"] },
  { id: "park",            name: "Parks",             icon: "🌳", color: "#27ae60", group: "entertainment", types: ["park"] },
  { id: "library",         name: "Libraries",         icon: "📚", color: "#34495e", group: "entertainment", types: ["library"] },
  { id: "casino",          name: "Casinos",           icon: "🎰", color: "#d35400", group: "entertainment", types: ["casino"] },

  // ── Attractions & Activities ────────────────────────────────
  // Tour buses, go-karts, ATVs, snorkeling tours, etc. appear here
  { id: "tourist_attraction", name: "Tours & Attractions", icon: "🎡", color: "#e91e63", group: "attractions", types: ["tourist_attraction"] },
  { id: "water_park",         name: "Water Parks",         icon: "💦", color: "#0288d1", group: "attractions", types: ["water_park"] },
  { id: "ferry",              name: "Ferries & Boat Tours",icon: "⛵", color: "#1565c0", group: "attractions", types: ["marina", "ferry_terminal"] },
  { id: "ski_resort",         name: "Ski Resorts",         icon: "⛷️", color: "#42a5f5", group: "attractions", types: ["ski_resort"] },
  { id: "golf_course",        name: "Golf Courses",        icon: "⛳", color: "#2e7d32", group: "attractions", types: ["golf_course"] },
  { id: "sports_venue",       name: "Sports Venues",       icon: "🏟️", color: "#bf360c", group: "attractions", types: ["sports_complex", "stadium"] },
  { id: "outdoor",            name: "Outdoor & Nature",    icon: "🥾", color: "#558b2f", group: "attractions", types: ["hiking_area", "campground", "national_park"] },
];

const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours",
  "places.websiteUri",
  "places.nationalPhoneNumber",
  "places.location",
].join(",");

// Fetch places using an explicit array of Google Places types.
// Used by the unified category system on the Events page.
export async function fetchPlacesByTypes({
  lat, lng, radiusMeters = 10000,
  types, categoryName, categoryColor, categoryIcon,
}) {
  if (!types || types.length === 0) return [];

  const res = await fetch(NEARBY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: types,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Google Places error ${res.status}`);
  }

  const data = await res.json();

  return (data.places || []).map((p) => ({
    id: p.id,
    name: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress ?? null,
    rating: p.rating ?? null,
    ratingCount: p.userRatingCount ?? null,
    openNow: p.regularOpeningHours?.openNow ?? null,
    website: p.websiteUri ?? null,
    phone: p.nationalPhoneNumber ?? null,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
    categoryName,
    categoryColor,
    categoryIcon,
  }));
}

const DETAIL_FIELDS = [
  "photos",
  "reviews",
  "displayName",
  "rating",
  "userRatingCount",
  "regularOpeningHours",
  "formattedAddress",
  "websiteUri",
  "nationalPhoneNumber",
].join(",");

export async function fetchPlaceDetails(placeId) {
  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}`,
    {
      headers: {
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask": DETAIL_FIELDS,
      },
    }
  );
  if (!res.ok) throw new Error(`Places detail error ${res.status}`);
  return res.json();
}

export function getPhotoUrl(photoName, maxWidth = 800) {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${maxWidth}&key=${KEY}`;
}

const TEXT_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.rating",
  "places.userRatingCount",
  "places.regularOpeningHours",
  "places.websiteUri",
].join(",");

export async function searchPlacesByText(textQuery, lat, lng) {
  const body = { textQuery, maxResultCount: 8 };
  if (lat != null && lng != null) {
    body.locationBias = {
      circle: { center: { latitude: lat, longitude: lng }, radius: 50000 },
    };
  }

  const res = await fetch(TEXT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": TEXT_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Google Places error ${res.status}`);
  }

  const data = await res.json();
  return (data.places || []).map((p) => ({
    id: p.id,
    name: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress ?? null,
    rating: p.rating ?? null,
    ratingCount: p.userRatingCount ?? null,
    openNow: p.regularOpeningHours?.openNow ?? null,
    website: p.websiteUri ?? null,
  }));
}

export async function fetchGooglePlaces({ lat, lng, radiusMeters = 10000, categoryId }) {
  const cat = PLACE_CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) throw new Error("Unknown category");

  const res = await fetch(NEARBY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify({
      includedTypes: cat.types,
      maxResultCount: 20,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: radiusMeters,
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Google Places error ${res.status}`);
  }

  const data = await res.json();

  return (data.places || []).map((p) => ({
    id: p.id,
    name: p.displayName?.text ?? "Unknown",
    address: p.formattedAddress ?? null,
    rating: p.rating ?? null,
    ratingCount: p.userRatingCount ?? null,
    openNow: p.regularOpeningHours?.openNow ?? null,
    website: p.websiteUri ?? null,
    phone: p.nationalPhoneNumber ?? null,
    lat: p.location?.latitude,
    lng: p.location?.longitude,
  }));
}
