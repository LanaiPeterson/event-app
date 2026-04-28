import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPlacesByTypes, isConfigured } from "../api/googlePlaces";
import { CATEGORIES } from "../components/categories/CategorySelector";
import PlaceDetailModal from "../components/places/PlaceDetailModal";

// Only show categories that have Google Places types to search.
const PLACE_CATEGORIES = CATEGORIES.filter((c) => c.placeTypes.length > 0);
import { geocodeQuery } from "../api/geocode";

const DEFAULT_LOCATION = { lat: 40.7128, lng: -74.006, label: "New York City, NY" };
const RADIUS_METERS = 10000; // ~6 miles

function StarRating({ rating }) {
  if (!rating) return null;
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = Array.from({ length: 5 }, (_, i) => {
    if (i < full) return "★";
    if (i === full && half) return "½";
    return "☆";
  }).join("");
  return (
    <span className="place-stars" title={`${rating} out of 5`}>
      {stars} <span className="place-rating-num">{rating.toFixed(1)}</span>
    </span>
  );
}

export default function PlacesPage() {
  const navigate = useNavigate();
  const [location, setLocation] = useState(DEFAULT_LOCATION);
  const [searchInput, setSearchInput] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailPlace, setDetailPlace] = useState(null);

  const configured = isConfigured();

  async function handleLocationSearch(e) {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearching(true);
    setSearchErr("");
    try {
      const result = await geocodeQuery(searchInput);
      setLocation(result);
      if (activeCategory) loadPlaces(activeCategory, result);
    } catch {
      setSearchErr("Location not found — try a different city or zip.");
    } finally {
      setSearching(false);
    }
  }

  async function loadPlaces(categoryName, loc = location) {
    setActiveCategory(categoryName);
    setLoading(true);
    setError("");
    setPlaces([]);
    const cat = PLACE_CATEGORIES.find((c) => c.name === categoryName);
    if (!cat) { setLoading(false); return; }
    try {
      const results = await fetchPlacesByTypes({
        lat: loc.lat,
        lng: loc.lng,
        radiusMeters: RADIUS_METERS,
        types: cat.placeTypes,
        categoryName: cat.name,
        categoryColor: cat.color,
        categoryIcon: cat.icon,
      });
      setPlaces(results);
    } catch (err) {
      setError(err.message || "Could not load places. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const activeCat = PLACE_CATEGORIES.find((c) => c.name === activeCategory);

  return (
    <div className="places-page">
      <div className="places-header">
        <button className="link-btn" onClick={() => navigate("/events")}>← Back to Events</button>
        <h2>Entertainment &amp; Places</h2>
        <p className="auth-sub">Find things to do near you — powered by Google Maps</p>

        <form className="places-location-form" onSubmit={handleLocationSearch}>
          <input
            type="text"
            placeholder="Enter city or zip code..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" disabled={searching}>
            {searching ? "..." : "Search"}
          </button>
        </form>
        {searchErr && <p className="places-location-err">{searchErr}</p>}
        <p className="places-location-label">
          📍 Showing places near <strong>{location.label.split(",").slice(0, 2).join(",")}</strong>
        </p>
      </div>

      {!configured && (
        <div className="places-api-banner">
          <strong>🔑 Google Maps API key required</strong>
          <p>
            To search for real places, add your key to <code>.env.local</code>:
            <br />
            <code>VITE_GOOGLE_MAPS_KEY=your_key_here</code>
          </p>
          <p>
            Get a free key at{" "}
            <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">
              Google Cloud Console
            </a>{" "}
            — enable the <strong>Places API (New)</strong>.
          </p>
        </div>
      )}

      <div className="places-cats-group">
        <div className="places-cats">
          {PLACE_CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              className={`place-cat-btn ${activeCategory === cat.name ? "active" : ""}`}
              style={{ "--place-color": cat.color }}
              onClick={() => configured && loadPlaces(cat.name)}
              disabled={!configured}
            >
              <span className="place-cat-icon">{cat.icon}</span>
              <span className="place-cat-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {configured && !activeCategory && (
        <div className="places-prompt">
          <div style={{ fontSize: 52, marginBottom: 12 }}>🗺️</div>
          <p style={{ fontWeight: 600 }}>Choose a category above to find places nearby.</p>
        </div>
      )}

      {configured && activeCategory && (
        <div className="places-results">
          {loading && (
            <div className="list-state">
              <div className="spinner" />
              <p>Searching Google Maps for {activeCat?.name}…</p>
            </div>
          )}

          {!loading && error && (
            <div className="auth-error" style={{ margin: "16px 20px" }}>{error}</div>
          )}

          {!loading && !error && places.length === 0 && (
            <div className="places-prompt">
              <div style={{ fontSize: 44, marginBottom: 12 }}>{activeCat?.icon}</div>
              <p style={{ fontWeight: 600 }}>No {activeCat?.name} found within 6 miles.</p>
              <p style={{ fontSize: 13, color: "#aaa", marginTop: 6 }}>
                Try searching a different city or zip code above.
              </p>
            </div>
          )}

          {!loading && !error && places.length > 0 && (
            <>
              <p className="places-count">
                {activeCat?.icon} {places.length} {activeCat?.name} found near {location.label.split(",")[0]}
              </p>
              <div className="place-list">
                {places.map((p) => (
                  <div key={p.id} className="place-card place-card--clickable" onClick={() => setDetailPlace(p)}>
                    <div
                      className="place-card__icon"
                      style={{ background: activeCat?.color }}
                    >
                      {activeCat?.icon}
                    </div>

                    <div className="place-card__info">
                      <h4 className="place-card__name">{p.name}</h4>

                      <div className="place-card__meta-row">
                        {p.rating && (
                          <StarRating rating={p.rating} />
                        )}
                        {p.ratingCount && (
                          <span className="place-rating-count">
                            ({p.ratingCount.toLocaleString()} reviews)
                          </span>
                        )}
                        {p.openNow !== null && (
                          <span className={`place-open-badge ${p.openNow ? "open" : "closed"}`}>
                            {p.openNow ? "Open now" : "Closed"}
                          </span>
                        )}
                      </div>

                      {p.address && <p className="place-card__addr">📍 {p.address}</p>}
                      {p.phone && <p className="place-card__phone">📞 {p.phone}</p>}
                    </div>

                    {p.website && (
                      <a
                        href={p.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="place-card__link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Visit →
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {detailPlace && (
        <PlaceDetailModal place={detailPlace} onClose={() => setDetailPlace(null)} />
      )}
    </div>
  );
}
