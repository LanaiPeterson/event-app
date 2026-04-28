import React from "react";
import { useNavigate } from "react-router-dom";
import { useSaved } from "../contexts/SavedEventsContext";
import EventCard from "../components/events/EventCard";

export default function SavedEventsPage() {
  const { saved } = useSaved();
  const navigate = useNavigate();

  return (
    <div className="saved-page">
      <div className="saved-header">
        <button className="link-btn" onClick={() => navigate("/events")}>← Back to Events</button>
        <h2>Saved Events</h2>
        <p className="auth-sub">
          {saved.length} event{saved.length !== 1 ? "s" : ""} saved
        </p>
      </div>

      {saved.length === 0 ? (
        <div className="saved-empty">
          <div className="list-empty-icon">🔖</div>
          <p style={{ fontWeight: 600, marginBottom: 6 }}>No saved events yet.</p>
          <p style={{ fontSize: 13, color: "#aaa" }}>
            Tap the flag icon on any event card to save it here.
          </p>
          <button
            className="btn-primary"
            style={{ maxWidth: 200, marginTop: 20 }}
            onClick={() => navigate("/events")}
          >
            Browse Events
          </button>
        </div>
      ) : (
        <div className="saved-grid">
          {saved.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      )}
    </div>
  );
}
