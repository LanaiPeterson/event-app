import React, { useState, useEffect, useRef } from "react";

const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;
const AC_URL = "https://places.googleapis.com/v1/places:autocomplete";

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Enter address...",
  required = false,
  className = "",
  style = {},
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (!value || value.length < 3 || !KEY) {
      setSuggestions([]);
      setOpen(false);
      return;
    }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(AC_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": KEY,
          },
          body: JSON.stringify({ input: value }),
        });
        const data = await res.json();
        const preds = (data.suggestions || [])
          .filter((s) => s.placePrediction)
          .map((s) => ({
            placeId: s.placePrediction.placeId,
            text: s.placePrediction.text?.text || "",
            main: s.placePrediction.structuredFormat?.mainText?.text || "",
            secondary: s.placePrediction.structuredFormat?.secondaryText?.text || "",
          }));
        setSuggestions(preds);
        setOpen(preds.length > 0);
      } catch {
        setSuggestions([]);
        setOpen(false);
      }
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [value]);

  function handleSelect(pred) {
    onChange(pred.text);
    setSuggestions([]);
    setOpen(false);
  }

  return (
    <div className="autocomplete-wrap">
      <input
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        className={className}
        style={style}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && (
        <ul className="autocomplete-dropdown">
          {suggestions.map((pred) => (
            <li
              key={pred.placeId}
              className="autocomplete-item"
              onMouseDown={() => handleSelect(pred)}
            >
              <span className="autocomplete-main">{pred.main}</span>
              <span className="autocomplete-secondary">{pred.secondary}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
