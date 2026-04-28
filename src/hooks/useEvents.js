import { useState, useEffect, useCallback } from "react";
import { fetchEvents, tmConfigured } from "../api/events";
import { useFilters } from "../contexts/FilterContext";

// These are the category names that map to real event categories in the data.
// "Entertainment" and "Attractions" are place-only categories — passing them
// to the events fetch would filter out every event, so we exclude them.
const EVENT_CATEGORY_NAMES = new Set([
  "Kids", "Music", "Sports", "Food & Drink",
  "Arts", "Tech", "Community", "Outdoors",
]);

export function useEvents(userLocation) {
  const { filters } = useFilters();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Only pass event-relevant categories; place-only selections (Entertainment,
      // Attractions) would otherwise zero out all event results.
      const eventCategories = filters.categories.filter((c) =>
        EVENT_CATEGORY_NAMES.has(c)
      );
      const results = await fetchEvents({
        ...filters,
        categories: eventCategories,
        userLat: userLocation?.lat,
        userLng: userLocation?.lng,
        locationLabel: userLocation?.label,
      });
      setEvents(results);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters, userLocation]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, error, reload: load, usingRealData: tmConfigured() };
}
