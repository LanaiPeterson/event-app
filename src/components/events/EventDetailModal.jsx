import React, { useState } from "react";
import { CATEGORIES } from "../categories/CategorySelector";

function formatTime(t) {
  if (!t || t === "TBA") return t || "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

function googleCalUrl(event) {
  const d = event.date?.replace(/-/g, "");
  if (!d) return null;
  const rawTime = event.time && event.time !== "TBA" ? event.time : "19:00";
  const timeStr = rawTime.replace(":", "") + "00";
  const startH = parseInt(timeStr.slice(0, 2), 10);
  const endH = Math.min(startH + 2, 23);
  const end = `${d}T${String(endH).padStart(2, "0")}${timeStr.slice(2)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${d}T${timeStr}/${end}&location=${encodeURIComponent(event.address || "")}&details=${encodeURIComponent(event.description || "")}`;
}

function downloadIcs(event) {
  const d = event.date?.replace(/-/g, "") ?? "";
  const rawTime = event.time && event.time !== "TBA" ? event.time : "19:00";
  const timeStr = rawTime.replace(":", "") + "00";
  const startH = parseInt(timeStr.slice(0, 2), 10);
  const endH = Math.min(startH + 2, 23);
  const end = `${d}T${String(endH).padStart(2, "0")}${timeStr.slice(2)}00`;
  const content = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${event.title}`,
    `DTSTART:${d}T${timeStr}`,
    `DTEND:${end}`,
    `LOCATION:${event.address || ""}`,
    `DESCRIPTION:${(event.description || "").replace(/\n/g, "\\n")}`,
    `URL:${event.url || ""}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([content], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${event.title.replace(/[^a-z0-9]/gi, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function EventDetailModal({ event, onClose }) {
  const [copied, setCopied] = useState(false);
  if (!event) return null;

  const catInfo = CATEGORIES.find((c) => c.name === event.category);
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`;
  const calUrl = googleCalUrl(event);

  async function handleShare() {
    const shareData = {
      title: event.title,
      text: `${event.title} — ${event.date}${event.time ? " at " + formatTime(event.time) : ""}`,
      url: event.url || window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch (_) { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(shareData.url).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {event.image && (
          <div className="modal-photos">
            <img src={event.image} alt={event.title} className="modal-photo" />
          </div>
        )}

        <div className="modal-body">
          <div className="modal-title-row">
            <span
              className="modal-cat-icon"
              style={{ background: catInfo?.color || "#eee" }}
            >
              {catInfo?.icon}
            </span>
            <div>
              <h3 className="modal-title">{event.title}</h3>
              <span className="modal-cat-label">{event.category}</span>
            </div>
          </div>

          <div className="modal-event-meta">
            <p>📅 {event.date}{event.time ? ` · ${formatTime(event.time)}` : ""}</p>
            {event.address && <p>📍 {event.address}</p>}
            {event.priceMin != null && (
              <p>🎟 {event.priceMin === 0 ? "Free admission" : `From $${Math.round(event.priceMin)}`}</p>
            )}
          </div>

          {event.description && (
            <p className="modal-desc">{event.description}</p>
          )}

          <div className="modal-actions">
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="modal-maps-btn">
              🗺️ Directions
            </a>
            {calUrl && (
              <a href={calUrl} target="_blank" rel="noopener noreferrer" className="modal-cal-btn">
                📅 Google Cal
              </a>
            )}
            <button className="modal-cal-btn" onClick={() => downloadIcs(event)}>
              📆 Apple Cal
            </button>
            {event.url && (
              <a href={event.url} target="_blank" rel="noopener noreferrer" className="modal-ticket-btn">
                Get Tickets →
              </a>
            )}
          </div>

          <button className="modal-share-btn" onClick={handleShare}>
            {copied ? "✓ Link copied!" : "↗ Share this event"}
          </button>
        </div>
      </div>
    </div>
  );
}
