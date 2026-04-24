import React, { useState } from "react";

export const CATEGORIES = [
  { name: "Kids", icon: "🧒", color: "#FF6B6B" },
  { name: "Music", icon: "🎵", color: "#4ECDC4" },
  { name: "Sports", icon: "⚽", color: "#45B7D1" },
  { name: "Food & Drink", icon: "🍕", color: "#96CEB4" },
  { name: "Arts", icon: "🎨", color: "#FFEAA7" },
  { name: "Tech", icon: "💻", color: "#A29BFE" },
  { name: "Community", icon: "🤝", color: "#FD79A8" },
  { name: "Outdoors", icon: "🌿", color: "#55EFC4" },
];

export default function CategorySelector({ selected, onChange }) {
  function toggle(name) {
    if (selected.includes(name)) {
      onChange(selected.filter((c) => c !== name));
    } else {
      onChange([...selected, name]);
    }
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
