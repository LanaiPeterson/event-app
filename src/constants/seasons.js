export const SEASONS = {
  winter: {
    key: "winter",
    label: "Winter",
    icon: "❄️",
    color: "#4a90d9",
    bg: "#eef6ff",
    tagline: "Skiing, ice skating & cozy indoor fun",
    months: [12, 1, 2],
    placeTypes: [
      "ski_resort", "bowling_alley", "amusement_center",
      "museum", "aquarium", "escape_room", "movie_theater",
      "performing_arts_theater", "casino", "ice_skating_rink",
    ],
    aiHint:
      "It is WINTER. Prioritize cold-weather activities: skiing, snowboarding, snow tubing, ice skating, sledding hills, and cozy indoor venues (escape rooms, bowling, arcades, museums, aquariums, movie theaters). " +
      "Avoid water parks, outdoor pools, and summer-only amusement parks. " +
      "Note that many outdoor amusement parks are CLOSED in winter — do not suggest them unless they have a winter event. " +
      "Winter festivals, holiday markets, and hot-cocoa spots are excellent additions.",
    placeholder: "A cozy winter day with skiing and hot cocoa, budget $150",
  },
  spring: {
    key: "spring",
    label: "Spring",
    icon: "🌸",
    color: "#c0392b",
    bg: "#fff0f8",
    tagline: "Gardens, hiking & outdoor markets",
    months: [3, 4, 5],
    placeTypes: [
      "park", "botanical_garden", "zoo", "tourist_attraction",
      "hiking_area", "golf_course", "art_gallery", "museum",
      "amusement_park", "farmers_market",
    ],
    aiHint:
      "It is SPRING. Focus on outdoor activities as nature blooms: botanical gardens, parks, zoos, light hiking, and outdoor markets. " +
      "Amusement parks are reopening for the season — great to include. " +
      "Weather is mild but can be unpredictable, so include at least one indoor option. " +
      "Spring festivals, cherry blossom viewings, and farmer's markets are seasonally perfect.",
    placeholder: "A relaxing spring afternoon visiting gardens and local spots",
  },
  summer: {
    key: "summer",
    label: "Summer",
    icon: "☀️",
    color: "#e67e22",
    bg: "#fffbef",
    tagline: "Water parks, beaches & amusement parks",
    months: [6, 7, 8],
    placeTypes: [
      "water_park", "amusement_park", "beach", "park", "zoo",
      "aquarium", "amusement_center", "tourist_attraction",
      "golf_course", "sports_complex",
    ],
    aiHint:
      "It is SUMMER. Prioritize outdoor summer attractions that are only open or ideal in summer: water parks, amusement parks, beaches, outdoor concerts, and festivals. " +
      "Heat is a real factor — suggest an early morning start, a midday indoor break (aquarium, museum, arcade), then back outside in the evening. " +
      "Water-based activities and shaded venues are highly recommended. " +
      "Avoid ski resorts and ice-skating rinks.",
    placeholder: "Full family summer day with water park and outdoor fun, $200 budget",
  },
  fall: {
    key: "fall",
    label: "Fall",
    icon: "🍂",
    color: "#d35400",
    bg: "#fff8f0",
    tagline: "Pumpkin patches, apple orchards & harvest festivals",
    months: [9, 10, 11],
    placeTypes: [
      "park", "tourist_attraction", "amusement_park", "museum",
      "art_gallery", "bowling_alley", "escape_room", "movie_theater",
      "zoo", "botanical_garden",
    ],
    aiHint:
      "It is FALL/AUTUMN. Suggest highly seasonal activities: pumpkin patches, corn mazes, apple orchards, fall foliage hikes, and harvest festivals. " +
      "If the date is in October, Halloween-themed venues and haunted attractions are perfect. " +
      "Hayrides, cider mills, and scenic overlooks for leaf-peeping are excellent additions. " +
      "Many amusement parks run special fall/Halloween events — note those if available. " +
      "Evenings get cool — suggest a warm indoor dinner or bonfire to end the day.",
    placeholder: "Fall day with pumpkin picking, apple orchard, and a haunted house",
  },
};

export function detectSeason(dateStr) {
  const month = new Date(dateStr + "T12:00:00").getMonth() + 1;
  for (const [, s] of Object.entries(SEASONS)) {
    if (s.months.includes(month)) return s.key;
  }
  return "fall";
}
