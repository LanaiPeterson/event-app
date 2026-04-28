import React, { useState } from "react";
import { geocodeQuery } from "../../api/geocode";
import AddressAutocomplete from "../ui/AddressAutocomplete";

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
        <AddressAutocomplete
          value={query}
          onChange={(v) => { setQuery(v); setError(""); }}
          placeholder="Enter city or zip code..."
          className="location-search__input"
          style={{ flex: 1, border: "none", background: "transparent", outline: "none", padding: "9px 4px", fontSize: 13, minWidth: 0 }}
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
