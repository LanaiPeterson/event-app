import React from "react";
import { useFilters } from "../../contexts/FilterContext";
import { CATEGORIES } from "../categories/CategorySelector";

export default function Filters() {
  const { filters, setFilters, resetFilters } = useFilters();

  function update(key, value) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCategory(name) {
    const cats = filters.categories.includes(name)
      ? filters.categories.filter((c) => c !== name)
      : [...filters.categories, name];
    update("categories", cats);
  }

  return (
    <div className="filters">
      <div className="filters-header">
        <h3>Filters</h3>
        <button className="link-btn" onClick={resetFilters}>Reset</button>
      </div>

      <div className="filter-group">
        <label>Radius: <strong>{filters.radius} mi</strong></label>
        <input
          type="range"
          min={1}
          max={50}
          value={filters.radius}
          onChange={(e) => update("radius", Number(e.target.value))}
        />
      </div>

      <div className="filter-group">
        <label>Date</label>
        <input
          type="date"
          value={filters.date}
          onChange={(e) => update("date", e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>After time</label>
        <input
          type="time"
          value={filters.time}
          onChange={(e) => update("time", e.target.value)}
        />
      </div>

      <div className="filter-group">
        <label>Categories</label>
        <div className="filter-cats">
          {CATEGORIES.map((cat) => {
            const active = filters.categories.includes(cat.name);
            return (
              <button
                key={cat.name}
                type="button"
                className={`filter-cat-btn ${active ? "active" : ""}`}
                style={{ "--cat-color": cat.color }}
                onClick={() => toggleCategory(cat.name)}
              >
                {cat.icon} {cat.name}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
