import { fetchTicketmasterEvents, isConfigured as tmConfigured } from "./ticketmaster";

// ─── Mock / demo events ──────────────────────────────────────────────────────
// Stored as offsets from the NYC center so they relocate to any searched city.
const NYC_LAT = 40.7128;
const NYC_LNG = -74.006;

const MOCK_BASE = [
  { id: "m1",  title: "Family Fun Day in the Park",    category: "Kids",         date: "2026-05-10", time: "10:00", lat: 40.7829, lng: -73.9654, description: "A fun-filled day for families with games, face painting, and food trucks.",          image: "https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?w=400" },
  { id: "m2",  title: "Jazz in the Park",              category: "Music",        date: "2026-05-11", time: "18:00", lat: 40.7614, lng: -73.9776, description: "Live jazz performances under the stars featuring local musicians.",                   image: "https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400" },
  { id: "m3",  title: "5K Community Run",              category: "Sports",       date: "2026-05-12", time: "07:30", lat: 40.6892, lng: -73.9442, description: "Community 5K run through scenic park trails. All skill levels welcome.",             image: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=400" },
  { id: "m4",  title: "Street Food Festival",          category: "Food & Drink", date: "2026-05-13", time: "12:00", lat: 40.7527, lng: -73.9772, description: "30+ vendors serving cuisines from around the world. Free admission.",                image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400" },
  { id: "m5",  title: "Modern Art Exhibition",         category: "Arts",         date: "2026-05-14", time: "09:00", lat: 40.7794, lng: -73.9632, description: "Exclusive opening of a contemporary art installation from global artists.",          image: "https://images.unsplash.com/photo-1531243269054-5ebf6f34081e?w=400" },
  { id: "m6",  title: "React & Node.js Workshop",      category: "Tech",         date: "2026-05-15", time: "14:00", lat: 40.7488, lng: -73.9856, description: "Hands-on full-day workshop for beginner to intermediate web developers.",             image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400" },
  { id: "m7",  title: "Neighborhood Cleanup Drive",    category: "Community",    date: "2026-05-16", time: "08:00", lat: 40.7282, lng: -73.7949, description: "Help keep our community clean. Supplies provided. Refreshments after.",             image: "https://images.unsplash.com/photo-1527525443983-6e60c75fff46?w=400" },
  { id: "m8",  title: "Waterfront Hike",               category: "Outdoors",     date: "2026-05-17", time: "06:00", lat: 40.7081, lng: -74.0060, description: "Guided scenic hike along the waterfront with breathtaking views.",                  image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=400" },
  { id: "m9",  title: "Kids Coding Camp",              category: "Kids",         date: "2026-05-18", time: "09:00", lat: 40.7033, lng: -73.9896, description: "Weekend coding camp for kids ages 8–14. Build your first website!",                 image: "https://images.unsplash.com/photo-1587620962725-abab19836100?w=400" },
  { id: "m10", title: "Rooftop Electronic Night",      category: "Music",        date: "2026-05-18", time: "20:00", lat: 40.7451, lng: -73.9912, description: "Three DJs, panoramic city views, and great vibes all night long.",                  image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400" },
  { id: "m11", title: "Yoga in the Garden",            category: "Outdoors",     date: "2026-05-19", time: "07:00", lat: 40.7579, lng: -73.9855, description: "Morning flow yoga open to all levels. Mats provided, just bring yourself.",         image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400" },
  { id: "m12", title: "Startup Pitch Night",           category: "Tech",         date: "2026-05-20", time: "19:00", lat: 40.7193, lng: -74.0021, description: "Watch 10 early-stage startups pitch to a panel of local investors.",               image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400" },
];

// Pre-compute each event's offset from the NYC center once at module load.
const MOCK_EVENTS = MOCK_BASE.map((e) => ({
  ...e,
  _latOffset: e.lat - NYC_LAT,
  _lngOffset: e.lng - NYC_LNG,
  source: "Demo",
  url: null,
}));

function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getMockEvents({ userLat, userLng, radius, date, time, categories, locationLabel }) {
  const cityDisplay = locationLabel
    ? locationLabel.split(",").slice(0, 2).join(", ").trim()
    : "New York, NY";

  return MOCK_EVENTS
    .map((e) => ({
      ...e,
      lat: userLat + e._latOffset,
      lng: userLng + e._lngOffset,
      address: `Local Venue, ${cityDisplay}`,
    }))
    .filter((e) => {
      const dist = haversineDistance(userLat, userLng, e.lat, e.lng);
      if (dist > radius) return false;
      if (date && e.date !== date) return false;
      if (time && e.time < time) return false;
      if (categories.length > 0 && !categories.includes(e.category)) return false;
      return true;
    });
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function fetchEvents({
  radius = 25,
  date = "",
  time = "",
  categories = [],
  userLat = NYC_LAT,
  userLng = NYC_LNG,
  locationLabel = null,
} = {}) {
  // Use Ticketmaster when an API key is configured.
  if (tmConfigured()) {
    try {
      const events = await fetchTicketmasterEvents({
        userLat,
        userLng,
        radius,
        date,
        time,
        categories,
      });
      // Return real events even if the array is empty (so "no results" is honest).
      return events;
    } catch (err) {
      console.warn("Ticketmaster error — falling back to demo data:", err.message);
    }
  }

  // No API key or network error → translated mock data.
  return new Promise((resolve) =>
    setTimeout(
      () => resolve(getMockEvents({ userLat, userLng, radius, date, time, categories, locationLabel })),
      300
    )
  );
}

export { tmConfigured };
