import React, { useState, useMemo } from "react";
import EventCard from "./EventCard";

function SkeletonCard() {
  return (
    <div className="skeleton-card">
      <div className="skeleton-img skeleton-shine" />
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-shine" style={{ width: "55%", height: 11 }} />
        <div className="skeleton-line skeleton-shine" style={{ width: "90%", height: 16, marginTop: 10 }} />
        <div className="skeleton-line skeleton-shine" style={{ width: "70%", height: 11, marginTop: 7 }} />
        <div className="skeleton-line skeleton-shine" style={{ width: "45%", height: 11, marginTop: 7 }} />
      </div>
    </div>
  );
}

function PlaceListItem({ place, onClick }) {
  return (
    <div
      className={`place-list-item${onClick ? " place-list-item--clickable" : ""}`}
      onClick={onClick}
    >
      <div className="place-list-item__icon" style={{ background: place.categoryColor }}>
        {place.categoryIcon}
      </div>
      <div className="place-list-item__info">
        <p className="place-list-item__name">{place.name}</p>
        {place.address && (
          <p className="place-list-item__addr">📍 {place.address}</p>
        )}
        <div className="place-list-item__meta">
          {place.rating != null && (
            <span className="place-stars">
              {"★".repeat(Math.round(place.rating))}
              {"☆".repeat(5 - Math.round(place.rating))}
              <span className="place-rating-num"> {place.rating.toFixed(1)}</span>
            </span>
          )}
          {place.ratingCount != null && (
            <span className="place-rating-count">({place.ratingCount.toLocaleString()})</span>
          )}
          {place.openNow !== null && (
            <span className={`place-open-badge ${place.openNow ? "open" : "closed"}`}>
              {place.openNow ? "Open" : "Closed"}
            </span>
          )}
        </div>
      </div>
      {place.website && (
        <a
          href={place.website}
          target="_blank"
          rel="noopener noreferrer"
          className="place-list-item__link"
          onClick={(e) => e.stopPropagation()}
        >
          →
        </a>
      )}
    </div>
  );
}

export default function EventList({
  events, loading, activeId, onSelect, usingRealData,
  places = [], placesLoading = false, onPlaceClick,
  isHoverFiltered = false,
}) {
  const [sort, setSort] = useState("date");
  const [view, setView] = useState("list");

  const sortedEvents = useMemo(() => {
    if (isHoverFiltered) return events; // already sorted by cursor distance
    const arr = [...events];
    if (sort === "distance") return arr.sort((a, b) => (a._distFromUser ?? Infinity) - (b._distFromUser ?? Infinity));
    if (sort === "name") return arr.sort((a, b) => a.title.localeCompare(b.title));
    return arr; // "date" — API already returns date-sorted
  }, [events, sort, isHoverFiltered]);

  // ── Hover mode ───────────────────────────────────────────────
  if (isHoverFiltered) {
    const merged = [
      ...events.map((e) => ({ ...e, _kind: "event" })),
      ...places.map((p) => ({ ...p, _kind: "place" })),
    ].sort((a, b) => (a._dist ?? 0) - (b._dist ?? 0));

    return (
      <div className="event-list">
        <div className="hover-banner">
          <span>📍 Results near here</span>
          <span className="hover-banner__count">{merged.length} found</span>
        </div>
        {merged.length === 0 ? (
          <div className="list-state" style={{ height: 200 }}>
            <p className="list-empty-icon">🗺️</p>
            <p>Nothing nearby. Move the cursor to explore.</p>
          </div>
        ) : (
          merged.map((item) =>
            item._kind === "event" ? (
              <EventCard
                key={item.id}
                event={item}
                active={item.id === activeId}
                onClick={() => onSelect(item.id)}
                layout={view}
              />
            ) : (
              <PlaceListItem
                key={item.id}
                place={item}
                onClick={onPlaceClick ? () => onPlaceClick(item) : undefined}
              />
            )
          )
        )}
      </div>
    );
  }

  // ── Normal mode ──────────────────────────────────────────────
  const hasPlaces = places.length > 0 || placesLoading;

  if (loading && !hasPlaces) {
    return (
      <div className="event-list">
        {[1, 2, 3, 4].map((n) => <SkeletonCard key={n} />)}
      </div>
    );
  }

  const showEmptyEvents = !loading && events.length === 0;

  return (
    <div className={`event-list ${view === "grid" ? "event-list--grid-wrap" : ""}`}>
      {!usingRealData && !loading && (
        <div className="api-setup-banner">
          <strong>Showing demo events.</strong> Add your free Ticketmaster API key
          to see real events in any city.{" "}
          <a href="https://developer.ticketmaster.com/" target="_blank" rel="noopener noreferrer">
            Get a free key →
          </a>
        </div>
      )}

      {/* ── Toolbar: count + sort + view toggle ── */}
      <div className="list-toolbar">
        <span className="list-toolbar__count">
          {loading
            ? "Loading…"
            : `${events.length} event${events.length !== 1 ? "s" : ""}`}
          {usingRealData && !loading && <span className="event-count__live"> · live</span>}
        </span>

        <div className="list-toolbar__controls">
          <select
            className="sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            title="Sort events"
          >
            <option value="date">Soonest</option>
            <option value="distance">Nearest</option>
            <option value="name">A–Z</option>
          </select>

          <div className="view-toggle">
            <button
              className={`view-toggle-btn ${view === "list" ? "active" : ""}`}
              onClick={() => setView("list")}
              title="List view"
            >
              ☰
            </button>
            <button
              className={`view-toggle-btn ${view === "grid" ? "active" : ""}`}
              onClick={() => setView("grid")}
              title="Grid view"
            >
              ⊞
            </button>
          </div>
        </div>
      </div>

      {/* ── Events ── */}
      {loading ? (
        [1, 2, 3].map((n) => <SkeletonCard key={n} />)
      ) : (
        <div className={view === "grid" ? "event-list--grid" : ""}>
          {showEmptyEvents && (
            <div className="list-state" style={{ height: 180 }}>
              <p className="list-empty-icon">🔍</p>
              <p>No events found for this location or filter.</p>
            </div>
          )}
          {sortedEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              active={event.id === activeId}
              onClick={() => onSelect(event.id)}
              layout={view}
            />
          ))}
        </div>
      )}

      {/* ── Businesses / Places section ── */}
      {hasPlaces && (
        <div className="places-section">
          <div className="places-section__header">
            <span>🏢 Nearby Businesses</span>
            {places.length > 0 && (
              <span className="places-section__count">{places.length} found</span>
            )}
          </div>

          {placesLoading ? (
            <div className="list-section-loading">
              <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
              <span>Searching Google Maps…</span>
            </div>
          ) : (
            places.map((place) => (
              <PlaceListItem
                key={place.id}
                place={place}
                onClick={onPlaceClick ? () => onPlaceClick(place) : undefined}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
