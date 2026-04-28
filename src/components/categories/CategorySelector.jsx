import React from "react";

// Each category drives BOTH event filtering and Google Places types.
// placeTypes: Google Places API (New) type strings to query when this category is active.
export const CATEGORIES = [
  { name: "Kids",          icon: "🧒", color: "#FF6B6B", placeTypes: ["zoo", "aquarium", "amusement_park"] },
  { name: "Music",         icon: "🎵", color: "#4ECDC4", placeTypes: ["concert_hall", "night_club"] },
  { name: "Sports",        icon: "⚽", color: "#45B7D1", placeTypes: ["sports_complex", "stadium", "golf_course"] },
  { name: "Food & Drink",  icon: "🍕", color: "#96CEB4", placeTypes: [] },
  { name: "Arts",          icon: "🎨", color: "#FFEAA7", placeTypes: ["museum", "art_gallery", "performing_arts_theater"] },
  { name: "Tech",          icon: "💻", color: "#A29BFE", placeTypes: ["library"] },
  { name: "Community",     icon: "🤝", color: "#FD79A8", placeTypes: ["park"] },
  { name: "Outdoors",      icon: "🌿", color: "#55EFC4", placeTypes: ["hiking_area", "campground", "national_park", "marina"] },
  { name: "Entertainment", icon: "🎬", color: "#8E44AD", placeTypes: ["movie_theater", "bowling_alley"] },
  { name: "Attractions",   icon: "🎡", color: "#E91E63", placeTypes: ["tourist_attraction", "water_park", "ski_resort", "ferry_terminal"] },
  { name: "Night Life",    icon: "🌙", color: "#4A235A", placeTypes: ["bar", "night_club"] },
  { name: "Adults 18+",   icon: "🍸", color: "#922B21", placeTypes: ["casino", "bar", "night_club"] },
];

export default function CategorySelector({ selected, onChange }) {
  function toggle(name) {
    onChange(
      selected.includes(name)
        ? selected.filter((c) => c !== name)
        : [...selected, name]
    );
  }

  return (
    <div className="category-grid">
      {CATEGORIES.map((cat) => {
        const active = selected.includes(cat.name);
        return (
          <button
            key={cat.name}
            type="button"
            className={`category-chip ${active ? "active" : ""}`}
            style={{ "--cat-color": cat.color }}
            onClick={() => toggle(cat.name)}
          >
            <span className="category-icon">{cat.icon}</span>
            <span className="category-label">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
}
