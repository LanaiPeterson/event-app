const TM_KEY = import.meta.env.VITE_TICKETMASTER_KEY;
const BASE_URL = "https://app.ticketmaster.com/discovery/v2/events.json";

// Maps Ticketmaster segment/genre names to our app's category list
function mapToCategory(segment = "", genre = "") {
  const s = segment.toLowerCase();
  const g = genre.toLowerCase();
  if (s === "music") return "Music";
  if (s === "sports") return "Sports";
  if (s.includes("arts") || s.includes("theatre") || s.includes("theater")) return "Arts";
  if (s === "family") return "Kids";
  if (g.includes("comedy") || g.includes("stand-up")) return "Arts";
  if (g.includes("food") || g.includes("drink")) return "Food & Drink";
  if (g.includes("outdoor") || g.includes("nature") || g.includes("adventure")) return "Outdoors";
  if (g.includes("tech") || g.includes("science") || g.includes("education")) return "Tech";
  return "Community";
}

export function isConfigured() {
  return Boolean(TM_KEY && TM_KEY !== "your_ticketmaster_consumer_key_here");
}

export async function fetchTicketmasterEvents({
  userLat,
  userLng,
  radius = 25,
  date = "",
  time = "",
  categories = [],
}) {
  if (!isConfigured()) return [];

  const today = new Date().toISOString().split("T")[0];
  const startDate = date || today;

  const params = new URLSearchParams({
    apikey: TM_KEY,
    latlong: `${userLat},${userLng}`,
    radius: String(Math.ceil(radius)),
    unit: "miles",
    size: "50",
    sort: "date,asc",
    startDateTime: `${startDate}T00:00:00Z`,
  });

  if (date) {
    params.set("endDateTime", `${date}T23:59:59Z`);
  }

  const res = await fetch(`${BASE_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Ticketmaster returned ${res.status}. Check your API key.`);
  }
  const json = await res.json();
  const rawEvents = json._embedded?.events ?? [];

  const mapped = rawEvents.map((ev) => {
    const venue = ev._embedded?.venues?.[0];
    const classification = ev.classifications?.[0];
    const segment = classification?.segment?.name ?? "";
    const genre = classification?.genre?.name ?? "";
    const category = mapToCategory(segment, genre);

    // Apply category filter
    if (categories.length > 0 && !categories.includes(category)) return null;

    const lat = parseFloat(venue?.location?.latitude);
    const lng = parseFloat(venue?.location?.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

    const timeTBA =
      ev.dates?.start?.timeTBA || ev.dates?.start?.noSpecificTime;
    const rawTime = ev.dates?.start?.localTime ?? "";
    const eventTime = timeTBA ? "TBA" : rawTime.slice(0, 5);

    // Apply after-time filter client-side
    if (time && !timeTBA && eventTime < time) return null;

    const addressParts = [
      venue?.address?.line1,
      venue?.name,
      venue?.city?.name,
      venue?.state?.stateCode,
      venue?.postalCode,
    ].filter(Boolean);

    // Pick the best 16:9 image available
    const bestImage = (ev.images ?? [])
      .filter((img) => img.ratio === "16_9")
      .sort((a, b) => (b.width ?? 0) - (a.width ?? 0))[0]?.url ?? "";

    const description =
      ev.info ||
      ev.pleaseNote ||
      `${genre || segment} event at ${venue?.name ?? "a local venue"} in ${venue?.city?.name ?? "your area"}.`;

    return {
      id: `tm_${ev.id}`,
      title: ev.name,
      category,
      date: ev.dates?.start?.localDate ?? "",
      time: eventTime,
      lat,
      lng,
      address: addressParts.join(", "),
      description,
      image: bestImage,
      url: ev.url,
      source: "Ticketmaster",
    };
  });

  return mapped.filter(Boolean);
}
