import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { createUserEvent } from "../api/userEvents";
import { getContacts, saveContact, removeContact } from "../api/auth";
import { geocodeQuery } from "../api/geocode";
import { CATEGORIES } from "../components/categories/CategorySelector";
import AddressAutocomplete from "../components/ui/AddressAutocomplete";

const EMPTY = {
  title: "", description: "", date: "", time: "",
  address: "", category: "Community", image: "",
  visibility: "public", invites: [],
};

export default function CreateEventPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [contacts, setContacts] = useState([]);
  const [newContact, setNewContact] = useState({ name: "", email: "" });
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeErr, setGeocodeErr] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user) setContacts(getContacts(user.id));
  }, [user]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleGeocode() {
    if (!form.address.trim()) return;
    setGeocoding(true); setGeocodeErr("");
    try {
      await geocodeQuery(form.address); // just validates the address
      setGeocodeErr("✅ Address found!");
    } catch {
      setGeocodeErr("Address not found — double check it.");
    } finally {
      setGeocoding(false);
    }
  }

  function toggleInvite(email) {
    set("invites",
      form.invites.includes(email)
        ? form.invites.filter((e) => e !== email)
        : [...form.invites, email]
    );
  }

  function addContact(e) {
    e.preventDefault();
    if (!newContact.email.trim()) return;
    if (!user) return;
    const updated = saveContact(user.id, newContact);
    setContacts(updated);
    setNewContact({ name: "", email: "" });
  }

  function deleteContact(id) {
    const updated = removeContact(user.id, id);
    setContacts(updated);
    set("invites", form.invites.filter((em) => !contacts.find((c) => c.id === id && c.email === em)));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.title.trim()) { setError("Event title is required."); return; }
    if (!form.date) { setError("Please set a date."); return; }
    if (!form.address.trim()) { setError("Please enter a location."); return; }
    if (!user) { navigate("/login"); return; }

    try {
      const geo = await geocodeQuery(form.address);
      createUserEvent({
        ...form,
        lat: geo.lat,
        lng: geo.lng,
        creatorId: user.id,
        creatorName: user.name,
      });
      setSuccess(true);
    } catch {
      setError("Could not find coordinates for that address. Try a more specific address.");
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card" style={{ maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
          <h2>Event Created!</h2>
          <p style={{ color: "#666", margin: "12px 0 24px" }}>
            Your event has been published and will appear in the events feed.
          </p>
          <button className="btn-primary" onClick={() => navigate(user ? "/events" : "/login")}>
            {user ? "View Events" : "Sign In to View"}
          </button>
          <div style={{ marginTop: 12 }}>
            <button className="link-btn" onClick={() => { setSuccess(false); setForm(EMPTY); }}>
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-page">
      <div className="create-card">
        <div className="create-header">
          <button className="link-btn" onClick={() => navigate(-1)}>← Back</button>
          <h2>Create an Event</h2>
          <p className="auth-sub">Share something happening in your community.</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-form">
          {/* Basic info */}
          <section className="create-section">
            <h3>Event Details</h3>
            <label>Event Title *</label>
            <input type="text" required placeholder="e.g. Summer Block Party" value={form.title} onChange={(e) => set("title", e.target.value)} />

            <label>Description</label>
            <textarea rows={3} placeholder="Tell people what to expect..." value={form.description} onChange={(e) => set("description", e.target.value)} />

            <div className="create-row">
              <div className="create-col">
                <label>Date *</label>
                <input type="date" required value={form.date} onChange={(e) => set("date", e.target.value)} />
              </div>
              <div className="create-col">
                <label>Time</label>
                <input type="time" value={form.time} onChange={(e) => set("time", e.target.value)} />
              </div>
            </div>

            <label>Category</label>
            <select value={form.category} onChange={(e) => set("category", e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.name} value={c.name}>{c.icon} {c.name}</option>
              ))}
            </select>

            <label>Event Image URL (optional)</label>
            <input type="url" placeholder="https://..." value={form.image} onChange={(e) => set("image", e.target.value)} />
          </section>

          {/* Location */}
          <section className="create-section">
            <h3>Location</h3>
            <label>Address *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <AddressAutocomplete
                value={form.address}
                onChange={(v) => { set("address", v); setGeocodeErr(""); }}
                placeholder="123 Main St, City, State"
                required
                style={{ flex: 1 }}
              />
              <button type="button" className="btn-verify" onClick={handleGeocode} disabled={geocoding}>
                {geocoding ? "..." : "Verify"}
              </button>
            </div>
            {geocodeErr && <p className={`geocode-msg ${geocodeErr.startsWith("✅") ? "ok" : "err"}`}>{geocodeErr}</p>}
          </section>

          {/* Visibility */}
          <section className="create-section">
            <h3>Who Can See This?</h3>
            <div className="visibility-toggle">
              <button
                type="button"
                className={`vis-btn ${form.visibility === "public" ? "active" : ""}`}
                onClick={() => set("visibility", "public")}
              >
                🌐 Public — Anyone can see this
              </button>
              <button
                type="button"
                className={`vis-btn ${form.visibility === "private" ? "active" : ""}`}
                onClick={() => set("visibility", "private")}
              >
                🔒 Private — Invite only
              </button>
            </div>
          </section>

          {/* Contacts / invites — shown for private events or any event */}
          {form.visibility === "private" && (
            <section className="create-section">
              <h3>Invite Contacts</h3>
              {contacts.length === 0 ? (
                <p className="create-hint">Add contacts below to invite them.</p>
              ) : (
                <div className="invite-list">
                  {contacts.map((c) => (
                    <label key={c.id} className="invite-row">
                      <input
                        type="checkbox"
                        checked={form.invites.includes(c.email)}
                        onChange={() => toggleInvite(c.email)}
                      />
                      <span className="invite-name">{c.name || c.email}</span>
                      <span className="invite-email">{c.email}</span>
                      <button type="button" className="invite-remove" onClick={() => deleteContact(c.id)}>✕</button>
                    </label>
                  ))}
                </div>
              )}

              <form className="add-contact-form" onSubmit={addContact}>
                <input
                  type="text"
                  placeholder="Contact name"
                  value={newContact.name}
                  onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                />
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={newContact.email}
                  onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                />
                <button type="submit" className="btn-add-contact">+ Add</button>
              </form>
            </section>
          )}

          <button className="btn-primary" type="submit" style={{ marginTop: 8 }}>
            {form.visibility === "public" ? "🌐 Publish Event" : "🔒 Create Private Event"}
          </button>
          {!user && (
            <p className="create-hint" style={{ textAlign: "center", marginTop: 10 }}>
              You'll need to <button type="button" className="link-btn" onClick={() => navigate("/login")}>sign in</button> to publish.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
