import React from "react";
import { useFilters } from "../../contexts/FilterContext";
import { CATEGORIES } from "../categories/CategorySelector";

function localDateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nextWeekendStr() {
  const d = new Date();
  const day = d.getDay();
  const daysUntilSat = day === 6 ? 0 : 6 - day;
  d.setDate(d.getDate() + daysUntilSat);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TODAY = localDateStr(0);
const TOMORROW = localDateStr(1);
const WEEKEND = nextWeekendStr();

const DATE_CHIPS = [
  { label: "All", value: "" },
  { label: "Today 🔥", value: TODAY },
  { label: "Tomorrow", value: TOMORROW },
  { label: "Weekend", value: WEEKEND },
];

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
        <label>Quick Date</label>
        <div className="date-chips">
          {DATE_CHIPS.map((chip) => (
            <button
              key={chip.label}
              type="button"
              className={`date-chip ${filters.date === chip.value ? "active" : ""}`}
              onClick={() => update("date", chip.value)}
            >
              {chip.label}
            </button>
          ))}
        </div>
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
        <p className="filter-cats-hint">
          Selecting a category shows matching events <em>and</em> nearby places.
        </p>
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
