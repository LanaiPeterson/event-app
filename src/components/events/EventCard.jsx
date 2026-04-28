import React from "react";
import { CATEGORIES } from "../categories/CategorySelector";
import { useSaved } from "../../contexts/SavedEventsContext";

function formatTime(t) {
  if (!t || t === "TBA") return t || "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatPrice(min, max) {
  if (min == null) return null;
  if (min === 0) return "Free";
  if (max && max !== min) return `$${Math.round(min)}–$${Math.round(max)}`;
  return `$${Math.round(min)}+`;
}

function formatDist(km) {
  if (km == null) return null;
  const mi = km * 0.621371;
  return mi < 0.1 ? "< 0.1 mi" : `${mi.toFixed(1)} mi`;
}

function getCountdownBadge(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateStr + "T00:00:00");
  const diff = Math.round((eventDate - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return { label: "Today 🔥", color: "#e74c3c", bg: "#fff0ee" };
  if (diff === 1) return { label: "Tomorrow", color: "#e67e22", bg: "#fff7f0" };
  if (diff <= 3) return { label: `In ${diff} days`, color: "#f39c12", bg: "#fffbf0" };
  if (diff <= 7) return { label: "This Week", color: "#27ae60", bg: "#f0fff5" };
  return null;
}

const SOURCE_STYLES = {
  Ticketmaster: { bg: "#026cdf", label: "Ticketmaster" },
  Community:    { bg: "#27ae60", label: "Community"    },
  Demo:         { bg: "#888",    label: "Demo"          },
};

export default function EventCard({ event, active, onClick, layout = "list" }) {
  const catInfo = CATEGORIES.find((c) => c.name === event.category);
  const src = SOURCE_STYLES[event.source] ?? SOURCE_STYLES.Demo;
  const { isSaved, toggleSaved } = useSaved();
  const saved = isSaved(event.id);
  const countdown = getCountdownBadge(event.date);
  const dist = formatDist(event._distFromUser);
  const price = formatPrice(event.priceMin, event.priceMax);

  function handleSave(e) {
    e.stopPropagation();
    toggleSaved(event);
  }

  function handleTicketClick(e) {
    e.stopPropagation();
    window.open(event.url, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className={`event-card ${active ? "event-card--active" : ""} ${layout === "grid" ? "event-card--grid" : ""}`}
      onClick={onClick}
    >
      {event.image ? (
        <div className="event-card__img-wrap">
          <img
            className="event-card__img"
            src={event.image}
            alt={event.title}
            onError={(e) => { e.target.parentElement.style.display = "none"; }}
          />
          <button
            className={`event-card__save ${saved ? "event-card__save--saved" : ""}`}
            onClick={handleSave}
            aria-label={saved ? "Remove from saved" : "Save event"}
            title={saved ? "Remove from saved" : "Save event"}
          >
            {saved ? "❤️" : "🤍"}
          </button>
          {countdown && (
            <span
              className="countdown-badge"
              style={{ color: countdown.color, background: countdown.bg }}
            >
              {countdown.label}
            </span>
          )}
        </div>
      ) : (
        <div className="event-card__no-img-row">
          {countdown && (
            <span
              className="countdown-badge countdown-badge--inline"
              style={{ color: countdown.color, background: countdown.bg }}
            >
              {countdown.label}
            </span>
          )}
          <button
            className={`event-card__save event-card__save--no-img ${saved ? "event-card__save--saved" : ""}`}
            onClick={handleSave}
            aria-label={saved ? "Remove from saved" : "Save event"}
          >
            {saved ? "❤️" : "🤍"}
          </button>
        </div>
      )}

      <div className="event-card__body">
        <div className="event-card__header">
          <span
            className="event-card__category"
            style={{ background: catInfo?.color || "#eee" }}
          >
            {catInfo?.icon} {event.category}
          </span>
          <span className="event-card__time">{formatTime(event.time)}</span>
        </div>

        <h4 className="event-card__title">{event.title}</h4>

        <div className="event-card__meta-row">
          <span className="event-card__meta">📅 {event.date}</span>
          {dist && <span className="dist-badge">📍 {dist}</span>}
        </div>

        <div className="event-card__address-block">
          <span className="event-card__address-icon">📍</span>
          <span className="event-card__address-text">{event.address}</span>
        </div>

        {layout !== "grid" && (
          <p className="event-card__desc">{event.description}</p>
        )}

        <div className="event-card__footer">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="event-card__source" style={{ background: src.bg }}>
              {src.label}
            </span>
            {price && (
              <span className={`price-badge ${price === "Free" ? "price-badge--free" : ""}`}>
                {price}
              </span>
            )}
          </div>
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
