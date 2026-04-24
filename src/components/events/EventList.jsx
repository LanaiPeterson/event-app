import React from "react";
import EventCard from "./EventCard";

export default function EventList({ events, loading, activeId, onSelect, usingRealData }) {
  if (loading) {
    return (
      <div className="list-state">
        <div className="spinner" />
        <p>Loading events...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="list-state">
        <p className="list-empty-icon">🔍</p>
        <p>No events found for this location or filter.</p>
        {usingRealData && (
          <p style={{ fontSize: 12, color: "#aaa", textAlign: "center", maxWidth: 240 }}>
            Try a different date, category, or increase the radius.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="event-list">
      {!usingRealData && (
        <div className="api-setup-banner">
          <strong>Showing demo events.</strong> Add your free Ticketmaster API key
          to see real events in any city.{" "}
          <a
            href="https://developer.ticketmaster.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get a free key →
          </a>
        </div>
      )}
      <p className="event-count">
        {events.length} event{events.length !== 1 ? "s" : ""} found
        {usingRealData && <span className="event-count__live"> · live</span>}
      </p>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          active={event.id === activeId}
          onClick={() => onSelect(event.id)}
        />
      ))}
    </div>
  );
}
