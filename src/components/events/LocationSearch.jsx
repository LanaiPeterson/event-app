import React, { useState } from "react";
import { geocodeQuery } from "../../api/geocode";

export default function LocationSearch({ onLocation }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const result = await geocodeQuery(query.trim());
      onLocation(result);
      setQuery("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="location-search" onSubmit={handleSubmit}>
      <div className="location-search__input-wrap">
        <span className="location-search__icon">📍</span>
        <input
          className="location-search__input"
          type="text"
          placeholder="Enter city or zip code..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setError(""); }}
        />
        <button
          className="location-search__btn"
          type="submit"
          disabled={loading || !query.trim()}
        >
          {loading ? "..." : "Go"}
        </button>
      </div>
      {error && <p className="location-search__error">{error}</p>}
    </form>
  );
}
