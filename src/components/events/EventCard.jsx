import React from "react";
import { CATEGORIES } from "../categories/CategorySelector";

const SOURCE_STYLES = {
  Ticketmaster: { bg: "#026cdf", label: "Ticketmaster" },
  Demo:         { bg: "#888",    label: "Demo"          },
};

export default function EventCard({ event, active, onClick }) {
  const catInfo = CATEGORIES.find((c) => c.name === event.category);
  const src = SOURCE_STYLES[event.source] ?? SOURCE_STYLES.Demo;

  function handleTicketClick(e) {
    e.stopPropagation(); // don't trigger card click / map fly-to
    window.open(event.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className={`event-card ${active ? "event-card--active" : ""}`}
      onClick={onClick}
    >
      {event.image && (
        <img
          className="event-card__img"
          src={event.image}
          alt={event.title}
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}

      <div className="event-card__body">
        <div className="event-card__header">
          <span
            className="event-card__category"
            style={{ background: catInfo?.color || "#eee" }}
          >
            {catInfo?.icon} {event.category}
          </span>
          <span className="event-card__time">{event.time}</span>
        </div>

        <h4 className="event-card__title">{event.title}</h4>

        <p className="event-card__meta">📅 {event.date}</p>

        <div className="event-card__address-block">
          <span className="event-card__address-icon">📍</span>
          <span className="event-card__address-text">{event.address}</span>
        </div>

        <p className="event-card__desc">{event.description}</p>

        <div className="event-card__footer">
          <span
            className="event-card__source"
            style={{ background: src.bg }}
          >
            {src.label}
          </span>
          {event.url && (
            <button className="event-card__ticket-btn" onClick={handleTicketClick}>
              Get Tickets →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
