import React, { useState } from "react";
import Filters from "../components/events/Filters";
import EventList from "../components/events/EventList";
import EventMap from "../components/events/EventMap";
import LocationSearch from "../components/events/LocationSearch";
import { useUser } from "../contexts/UserContext";
import { useFilters } from "../contexts/FilterContext";
import { useEvents } from "../hooks/useEvents";

// Default center matches the NYC mock data; only changes when user searches.
const DEFAULT_LOCATION = { lat: 40.7128, lng: -74.006, label: "New York City, NY" };

export default function EventsPage() {
  const { user, logout } = useUser();
  const { filters } = useFilters();
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const { events, loading, usingRealData } = useEvents(location);
  const [activeId, setActiveId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  function handleLocation(result) {
    setLocation(result);
    setActiveId(null);
  }

  function resetToDefault() {
    setLocation(DEFAULT_LOCATION);
    setActiveId(null);
  }

  const isCustomLocation = location !== DEFAULT_LOCATION;

  return (
    <div className="events-page">
      <header className="events-header">
        <div className="events-header__logo">
          <span>📍</span> Events Near Me
        </div>
        <LocationSearch onLocation={handleLocation} />
        <div className="events-header__right">
          <span className="events-header__user">Hi, {user?.name?.split(" ")[0]}</span>
          <button className="link-btn" onClick={logout}>Sign out</button>
        </div>
      </header>

      {isCustomLocation && (
        <div className="location-banner">
          Showing events near <strong>{location.label.split(",").slice(0, 2).join(",")}</strong>
          <button className="link-btn" style={{ marginLeft: 10 }} onClick={resetToDefault}>
            Reset to New York City
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
              events={events}
              loading={loading}
              activeId={activeId}
              usingRealData={usingRealData}
              onSelect={(id) => {
                setActiveId(id);
                setSidebarOpen(false);
              }}
            />
          </div>

          <div className="events-map-col">
            <EventMap
              events={events}
              activeId={activeId}
              onSelect={setActiveId}
              userLocation={location}
              radius={filters.radius}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
