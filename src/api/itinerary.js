const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY;

export function isConfigured() {
  return Boolean(ANTHROPIC_KEY && ANTHROPIC_KEY !== "your_anthropic_key_here");
}

// ─── Intent detection ────────────────────────────────────────────────────────

const VACATION_KEYWORDS = [
  "vacation", "holiday", "getaway", "escape", "retreat", "honeymoon",
  "trip to ", "travel to ", "fly to ", "flying to ", "visit ",
  "flight", "flights", "cruise",
  "anywhere in", "around the world", "in the world", "best country",
  "recommend a ", "suggest a ", "where should i go", "where can i go",
  "best place to", "best destination", "place to travel",
  "abroad", "overseas", "international travel",
  "beach anywhere", "beach destination", "resort",
  "per person", "per night", "all inclusive",
];

export function detectVacationIntent(prompt) {
  const lower = prompt.toLowerCase();
  return VACATION_KEYWORDS.some((k) => lower.includes(k));
}

// ─── Shared helpers ──────────────────────────────────────────────────────────

function distKm(aLat, aLng, bLat, bLng) {
  const R = 6371;
  const dLat = (bLat - aLat) * (Math.PI / 180);
  const dLng = (bLng - aLng) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aLat * (Math.PI / 180)) *
      Math.cos(bLat * (Math.PI / 180)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function trafficMultiplier(hour) {
  if (hour >= 7 && hour <= 9) return 1.6;
  if (hour >= 16 && hour <= 19) return 2.0;
  if (hour >= 22 || hour <= 5) return 0.8;
  return 1.1;
}

async function callClaude(system, userMessage, maxTokens = 2048) {
  if (!isConfigured()) {
    throw new Error("Add VITE_ANTHROPIC_KEY to .env.local to enable AI planning.");
  }
  const res = await fetch("/api/anthropic/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  const text = data.content?.[0]?.text ?? "";
  const stripped = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  try {
    return JSON.parse(stripped);
  } catch {
    const match = text.match(/\{[\s\S]+\}/);
    if (!match) throw new Error("Could not parse AI response. Try again.");
    return JSON.parse(match[0]);
  }
}

// ─── Vacation planner ────────────────────────────────────────────────────────

export async function planVacation({ prompt, location, date, budget, groupType }) {
  const month = new Date(date + "T12:00:00").toLocaleString("en-US", { month: "long" });
  const year  = new Date(date + "T12:00:00").getFullYear();

  const system = `You are an expert global travel advisor with deep knowledge of destinations, seasonal travel patterns, flight routes, and accommodation costs worldwide.

When recommending vacations:
- Factor in the current season and month at the DESTINATION (not just the departure city)
- Avoid recommending destinations during their monsoon, hurricane, or extreme heat seasons unless the user specifically requests it
- Account for flight distances and typical pricing from the departure city
- Be realistic with cost estimates — include all-in figures (flights + hotel + food + activities)
- For beach destinations specifically: note whether the beach season aligns with the travel date
- For snow/ski destinations: confirm snow conditions match the travel period

Return ONLY valid JSON — no markdown, no code fences, no extra text.

JSON schema:
{
  "type": "vacation",
  "destination": "City/Region, Country",
  "country": "Country name",
  "tagline": "One compelling sentence about this destination",
  "departureCity": "City the traveler is flying from",
  "travelMonth": "Month name + year",
  "seasonAtDestination": "What the weather/season is like there in that month",
  "bestMonthsToVisit": "e.g. November–April",
  "recommendedDuration": "e.g. 7–10 days",
  "perPersonBudget": 0,
  "budgetBreakdown": [
    { "icon": "✈️", "category": "Round-trip flights", "estimate": "$X–$Y", "notes": "Booking tips or airline suggestions" },
    { "icon": "🏨", "category": "Accommodation", "estimate": "$X–$Y", "notes": "Type of lodging recommended" },
    { "icon": "🍽️", "category": "Food & Drinks", "estimate": "$X–$Y", "notes": "Dining context" },
    { "icon": "🎯", "category": "Activities", "estimate": "$X–$Y", "notes": "Key activities included" },
    { "icon": "🎒", "category": "Misc & Transport", "estimate": "$X–$Y", "notes": "Local transport, tips, souvenirs" }
  ],
  "highlights": ["string", "string", "string", "string"],
  "sampleItinerary": [
    { "day": 1, "title": "Day title", "activities": ["activity 1", "activity 2", "activity 3"] }
  ],
  "bookingTips": ["tip 1", "tip 2", "tip 3"],
  "alternatives": [
    {
      "destination": "City, Country",
      "tagline": "Why this is a good alternative",
      "flightEstimate": "$X–$Y from departure city",
      "totalPerPerson": "$X–$Y all-in",
      "bestFor": "Type of traveler this suits"
    }
  ]
}`;

  const msg = `User request: "${prompt}"

Travel details:
- Departing from: ${location.label}
- Travel month: ${month} ${year}
- Budget per person: $${budget}
- Group: ${groupType}

Recommend the single BEST destination that fits this request. Include a realistic 5–7 day sample itinerary and exactly 3 alternative destinations.`;

  return callClaude(system, msg, 3000);
}

// ─── Local day planner ────────────────────────────────────────────────────────

export async function buildItinerary({
  prompt, places, events, location, date,
  startTime = "10:00", budget = 100, groupType = "solo",
  season = null, weather = null, seasonHint = "",
}) {
  const enrichedPlaces = places.slice(0, 30).map((p) => {
    const distMi = p.lat && p.lng
      ? (distKm(location.lat, location.lng, p.lat, p.lng) * 0.621371).toFixed(1) : null;
    return {
      name: p.name, category: p.categoryName, address: p.address,
      rating: p.rating ? p.rating.toFixed(1) : null,
      openNow: p.openNow, distanceMiles: distMi,
    };
  });

  const enrichedEvents = events.slice(0, 20).map((e) => ({
    title: e.title, date: e.date, time: e.time !== "TBA" ? e.time : null,
    address: e.address, category: e.category, priceMin: e.priceMin,
    distanceMiles: e._distFromUser ? (e._distFromUser * 0.621371).toFixed(1) : null,
  }));

  const startHour = parseInt(startTime.split(":")[0], 10);
  const mult = trafficMultiplier(startHour);
  const trafficNote =
    mult >= 1.6 ? "Heavy traffic at start time — add 10–15 extra min between stops." :
    mult >= 1.4 ? "Moderately heavy traffic expected." :
    mult <= 0.9 ? "Light traffic — faster travel times." : "Normal traffic conditions.";

  const weatherSection = weather
    ? `\nWEATHER: ${weather.icon} ${weather.label}, ` +
      `${weather.tempMinF != null ? `${weather.tempMinF}–${weather.tempMaxF}°F, ` : ""}` +
      `${weather.precipProbability}% rain chance. ${weather.aiNote}`
    : "";

  const seasonSection = seasonHint ? `\nSEASON: ${seasonHint}` : "";

  const system = `You are an expert local day-trip planner. Create a realistic, enjoyable day plan from the provided nearby places and events.

Rules:
- Total cost must stay at or under the budget
- Travel time between stops: ~20–35 min driving
- Skip places marked openNow: false
- Respect the season — no water parks in winter, no ski resorts in summer
- If rain is likely, at least half the stops must be indoors or covered
- Include a meal stop for midday itineraries
- Select 4–7 stops
- Return ONLY valid JSON — no markdown, no code fences

JSON format:
{
  "type": "local",
  "title": "Short catchy title",
  "date": "YYYY-MM-DD",
  "totalEstimatedCost": 0,
  "stops": [
    {
      "order": 1, "startTime": "HH:MM", "endTime": "HH:MM",
      "name": "Place/event name", "type": "place",
      "category": "Category", "address": "Full address",
      "description": "What to do and why it fits",
      "estimatedCost": 0, "travelMinutesFromPrev": null, "travelMode": "driving"
    }
  ],
  "summary": "One paragraph overview",
  "tips": ["tip 1", "tip 2", "tip 3"]
}`;

  const msg = `User request: "${prompt}"

Details:
- Date: ${date} | Start: ${startTime} | Budget: $${budget}
- Group: ${groupType} | Season: ${season ?? "unknown"}
- Location: ${location.label}
- Traffic: ${trafficNote}${weatherSection}${seasonSection}

Nearby places (${enrichedPlaces.length}):
${JSON.stringify(enrichedPlaces, null, 2)}

Upcoming events (${enrichedEvents.length}):
${JSON.stringify(enrichedEvents, null, 2)}

Build the best itinerary using only the places and events listed above.`;

  return callClaude(system, msg, 2048);
}
