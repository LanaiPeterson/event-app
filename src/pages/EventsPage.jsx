import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Filters from "../components/events/Filters";
import EventList from "../components/events/EventList";
import EventMap from "../components/events/EventMap";
import LocationSearch from "../components/events/LocationSearch";
import NotificationBell from "../components/notifications/NotificationBell";
import EventDetailModal from "../components/events/EventDetailModal";
import PlaceDetailModal from "../components/places/PlaceDetailModal";
import { CATEGORIES } from "../components/categories/CategorySelector";
import { useUser } from "../contexts/UserContext";
import { useFilters } from "../contexts/FilterContext";
import { useEvents } from "../hooks/useEvents";
import { reverseGeocode } from "../api/geocode";
import { fetchPlacesByTypes, isConfigured as isGoogleConfigured } from "../api/googlePlaces";

const NYC = { lat: 40.7128, lng: -74.006, label: "New York City, NY" };

export default function EventsPage() {
  const { user, logout } = useUser();
  const { filters } = useFilters();
  const navigate = useNavigate();

  const [location, setLocation] = useState(NYC);
  const [locating, setLocating] = useState(true);
  const homeLocation = useRef(NYC);

  const { events, loading, usingRealData } = useEvents(location);
  const [activeId, setActiveId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [places, setPlaces] = useState([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);
  const [detailPlace, setDetailPlace] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoverPos, setHoverPos] = useState(null);
  const hoverTimer = useRef(null);

  const handleHoverPos = useCallback(({ lat, lng }) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => setHoverPos({ lat, lng }), 250);
  }, []);

  const handleHoverClear = useCallback(() => {
    clearTimeout(hoverTimer.current);
    setHoverPos(null);
  }, []);

  // Detect the user's real location once on mount.
  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        homeLocation.current = result;
        setLocation(result);
        setLocating(false);
      },
      () => { setLocating(false); },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  function handleLocation(result) {
    setLocation(result);
    setActiveId(null);
  }

  function resetToHome() {
    setLocation(homeLocation.current);
    setActiveId(null);
  }

  const isCustomLocation = !locating && location !== homeLocation.current;

  // Default business types always fetched regardless of category filters.
  const DEFAULT_PLACE_TYPES = [
    "tourist_attraction", "amusement_park", "museum",
    "movie_theater", "park", "bowling_alley", "casino", "aquarium", "zoo",
  ];

  // Entertainment/gaming venues always fetched — covers Dave & Buster's, escape rooms, arcades, etc.
  const ENTERTAINMENT_TYPES = [
    "amusement_center", "escape_room", "video_arcade", "comedy_club",
    "night_club", "sports_complex", "event_venue", "music_venue",
    "performing_arts_theater", "concert_hall",
  ];

  const catKey = filters.categories.join(",");
  useEffect(() => {
    if (!isGoogleConfigured()) {
      setPlaces([]);
      return;
    }

    const selectedCats = CATEGORIES.filter(
      (c) => filters.categories.includes(c.name) && c.placeTypes.length > 0
    );

    let cancelled = false;
    setPlacesLoading(true);

    const fetches = [
      // Always fetch a default mix of nearby businesses
      fetchPlacesByTypes({
        lat: location.lat,
        lng: location.lng,
        radiusMeters: filters.radius * 1609.34,
        types: DEFAULT_PLACE_TYPES,
        categoryName: "Nearby",
        categoryColor: "#6c63ff",
        categoryIcon: "🏢",
      }).catch(() => []),
      // Always fetch entertainment venues (Dave & Buster's, escape rooms, arcades, etc.)
      fetchPlacesByTypes({
        lat: location.lat,
        lng: location.lng,
        radiusMeters: filters.radius * 1609.34,
        types: ENTERTAINMENT_TYPES,
        categoryName: "Entertainment",
        categoryColor: "#e74c3c",
        categoryIcon: "🎮",
      }).catch(() => []),
      // Plus any category-specific types the user has filtered
      ...selectedCats.map((cat) =>
        fetchPlacesByTypes({
          lat: location.lat,
          lng: location.lng,
          radiusMeters: filters.radius * 1609.34,
          types: cat.placeTypes,
          categoryName: cat.name,
          categoryColor: cat.color,
          categoryIcon: cat.icon,
        }).catch(() => [])
      ),
    ];

    Promise.all(fetches).then((results) => {
      if (cancelled) return;
      const seen = new Set();
      const flat = results.flat().filter((p) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      setPlaces(flat);
      setPlacesLoading(false);
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catKey, location.lat, location.lng, filters.radius]);

  const q = searchQuery.trim().toLowerCase();
  const baseEvents = q ? events.filter((e) => e.title.toLowerCase().includes(q)) : events;
  const filteredPlaces = q ? places.filter((p) => p.name.toLowerCase().includes(q)) : places;

  // Attach permanent distance-from-user to every event for the distance badge + sort
  const filteredEvents = useMemo(
    () =>
      baseEvents.map((e) => ({
        ...e,
        _distFromUser:
          e.lat && e.lng ? distKm(location.lat, location.lng, e.lat, e.lng) : null,
      })),
    [baseEvents, location.lat, location.lng]
  );

  // Distance in km between two lat/lng points (Haversine).
  function distKm(aLat, aLng, bLat, bLng) {
    const R = 6371;
    const dLat = (bLat - aLat) * (Math.PI / 180);
    const dLng = (bLng - aLng) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(aLat * (Math.PI / 180)) * Math.cos(bLat * (Math.PI / 180)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  const HOVER_RADIUS_KM = 8;
  const displayEvents = hoverPos
    ? filteredEvents
        .filter((e) => e.lat && e.lng)
        .map((e) => ({ ...e, _dist: distKm(hoverPos.lat, hoverPos.lng, e.lat, e.lng) }))
        .filter((e) => e._dist <= HOVER_RADIUS_KM)
        .sort((a, b) => a._dist - b._dist)
    : filteredEvents;

  const displayPlaces = hoverPos
    ? filteredPlaces
        .filter((p) => p.lat && p.lng)
        .map((p) => ({ ...p, _dist: distKm(hoverPos.lat, hoverPos.lng, p.lat, p.lng) }))
        .filter((p) => p._dist <= HOVER_RADIUS_KM)
        .sort((a, b) => a._dist - b._dist)
    : filteredPlaces;

  return (
    <div className="events-page">
      <header className="events-header">
        <div className="events-header__logo">
          <span>📍</span> Events Near Me
        </div>
        <LocationSearch onLocation={handleLocation} />
        <div className="events-search-wrap">
          <span className="events-search-icon">🔍</span>
          <input
            className="events-search-input"
            type="text"
            placeholder="Search events & places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="events-header__right">
          <button className="link-btn" onClick={() => navigate("/itinerary")}>🗓️ Plan Day</button>
          <button className="link-btn" onClick={() => navigate("/places")}>🗺️ Places</button>
          {user?.role === "planner" && (
            <button className="link-btn" onClick={() => navigate("/organizer")}>🎪 My Events</button>
          )}
          <button className="link-btn" onClick={() => navigate("/saved-events")}>🔖 Saved</button>
          <NotificationBell />
          <span className="events-header__user">Hi, {user?.name?.split(" ")[0]}</span>
          <button className="link-btn" onClick={logout}>Sign out</button>
        </div>
      </header>

      {locating && (
        <div className="location-banner location-banner--detecting">
          <span className="location-detecting-dot" /> Detecting your location…
        </div>
      )}

      {!locating && isCustomLocation && (
        <div className="location-banner">
          Showing events near <strong>{location.label}</strong>
          <button className="link-btn" style={{ marginLeft: 10 }} onClick={resetToHome}>
            ← Back to {homeLocation.current.label}
          </button>
        </div>
      )}

      <div className="events-body">
        <button
          className="sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? "✕ Close" : "⚙ Filters"}
        </button>

        <aside className={`events-sidebar ${sidebarOpen ? "open" : ""}`}>
          <Filters />
        </aside>

        <div className="events-content">
          <div className="events-list-col">
            <EventList
              events={displayEvents}
              loading={loading}
              activeId={activeId}
              usingRealData={usingRealData}
              places={displayPlaces}
              placesLoading={placesLoading}
              isHoverFiltered={!!hoverPos}
              onSelect={(id) => {
                setActiveId(id);
                setSidebarOpen(false);
                setDetailEvent(events.find((e) => e.id === id) ?? null);
              }}
              onPlaceClick={(place) => setDetailPlace(place)}
            />
          </div>

          <div className="events-map-col">
            <EventMap
              events={events}
              places={places}
              activeId={activeId}
              onSelect={setActiveId}
              userLocation={location}
              radius={filters.radius}
              onHoverPos={handleHoverPos}
              onHoverClear={handleHoverClear}
            />
          </div>
        </div>
      </div>

      {detailEvent && (
        <EventDetailModal event={detailEvent} onClose={() => setDetailEvent(null)} />
      )}
      {detailPlace && (
        <PlaceDetailModal place={detailPlace} onClose={() => setDetailPlace(null)} />
      )}
    </div>
  );
}

