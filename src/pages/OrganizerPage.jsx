import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { getEventsByCreator, deleteUserEvent, updateUserEvent } from "../api/userEvents";
import { CATEGORIES } from "../components/categories/CategorySelector";

function formatTime(t) {
  if (!t || t === "TBA") return t || "";
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  return `${hour % 12 || 12}:${m} ${hour >= 12 ? "PM" : "AM"}`;
}

export default function OrganizerPage() {
  const { user, logout } = useUser();
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (user) setEvents(getEventsByCreator(user.id));
  }, [user]);

  function handleDelete(id) {
    if (!window.confirm("Delete this event? This cannot be undone.")) return;
    deleteUserEvent(id, user.id);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  }

  function handleToggleVisibility(ev) {
    const updated = updateUserEvent(ev.id, user.id, {
      visibility: ev.visibility === "public" ? "private" : "public",
    });
    if (updated) {
      setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    }
  }

  const total = events.length;
  const publicCount = events.filter((e) => e.visibility === "public").length;
  const privateCount = events.filter((e) => e.visibility === "private").length;

  return (
    <div className="organizer-page">
      <header className="organizer-header">
        <div className="organizer-header__logo">🎪 Organizer Dashboard</div>
        <div className="organizer-header__right">
          <button className="link-btn" onClick={() => navigate("/events")}>← Events Feed</button>
          <button className="link-btn" onClick={() => navigate("/create-event")}>+ Create Event</button>
          <span className="organizer-header__user">Hi, {user?.name?.split(" ")[0]}</span>
          <button className="link-btn" onClick={logout}>Sign out</button>
        </div>
      </header>

      <div className="organizer-body">
        <div className="organizer-stats">
          <div className="organizer-stat">
            <span className="organizer-stat__num">{total}</span>
            <span className="organizer-stat__label">Total Events</span>
          </div>
          <div className="organizer-stat">
            <span className="organizer-stat__num">{publicCount}</span>
            <span className="organizer-stat__label">Public</span>
          </div>
          <div className="organizer-stat">
            <span className="organizer-stat__num">{privateCount}</span>
            <span className="organizer-stat__label">Private</span>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="organizer-empty">
            <div style={{ fontSize: 52, marginBottom: 12 }}>🎪</div>
            <p style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>No events yet</p>
            <p style={{ color: "#888", fontSize: 14, marginBottom: 24 }}>
              Create your first event and publish it to the feed.
            </p>
            <button
              className="btn-primary"
              style={{ maxWidth: 220 }}
              onClick={() => navigate("/create-event")}
            >
              Create Your First Event
            </button>
          </div>
        ) : (
          <div className="organizer-event-list">
            {events.map((ev) => {
              const catInfo = CATEGORIES.find((c) => c.name === ev.category);
              return (
                <div key={ev.id} className="organizer-event-card">
                  {ev.image && (
                    <img src={ev.image} alt={ev.title} className="organizer-event-img" />
                  )}
                  <div className="organizer-event-body">
                    <div className="organizer-event-header">
                      <span
                        className="event-card__category"
                        style={{ background: catInfo?.color || "#eee" }}
                      >
                        {catInfo?.icon} {ev.category}
                      </span>
                      <span className={`organizer-vis-badge ${ev.visibility}`}>
                        {ev.visibility === "public" ? "🌐 Public" : "🔒 Private"}
                      </span>
                    </div>
                    <h4 className="organizer-event-title">{ev.title}</h4>
                    <p className="organizer-event-meta">
                      📅 {ev.date}{ev.time ? ` · ${formatTime(ev.time)}` : ""}
                    </p>
                    {ev.address && (
                      <p className="organizer-event-meta">📍 {ev.address}</p>
                    )}
                    {ev.description && (
                      <p className="organizer-event-desc">{ev.description}</p>
                    )}
                  </div>
                  <div className="organizer-event-actions">
                    <button
                      className="organizer-action-btn"
                      onClick={() => handleToggleVisibility(ev)}
                    >
                      {ev.visibility === "public" ? "Make Private" : "Make Public"}
                    </button>
                    <button
                      className="organizer-action-btn organizer-action-btn--delete"
                      onClick={() => handleDelete(ev.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
