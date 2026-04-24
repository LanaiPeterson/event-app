import { useState, useEffect, useCallback } from "react";
import { fetchEvents, tmConfigured } from "../api/events";
import { useFilters } from "../contexts/FilterContext";

export function useEvents(userLocation) {
  const { filters } = useFilters();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchEvents({
        ...filters,
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
