import React, { useState, useRef, useEffect } from "react";
import { searchPlacesByText } from "../../api/googlePlaces";
import { geocodeQuery, reverseGeocode } from "../../api/geocode";

const WELCOME =
  'Hi! 👋 I can help you discover nearby activities and places. What are you looking for? Try things like "jet ski rentals", "snorkeling spots", or "hiking trails".';

function getGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("not supported"));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const loc = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          resolve(loc);
        } catch {
          reject(new Error("reverse geocode failed"));
        }
      },
      () => reject(new Error("denied"))
    );
  });
}

export default function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ role: "bot", text: WELCOME }]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState("query"); // 'query' | 'location'
  const [pendingQuery, setPendingQuery] = useState("");
  const [location, setLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  function push(role, text, places) {
    setMessages((m) => [...m, { role, text, places }]);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    push("user", text);

    if (/change.*(location|city|area)/i.test(text) || /new.*(location|city|area)/i.test(text)) {
      setLocation(null);
      setStep("query");
      push("bot", "OK! What would you like to look for? I'll ask for your location.");
      return;
    }

    if (step === "query") {
      if (location) {
        await doSearch(text, location);
        return;
      }
      if (/near me|nearby|around me/i.test(text)) {
        setPendingQuery(text);
        setIsLoading(true);
        try {
          const loc = await getGeolocation();
          setLocation(loc);
          await doSearch(text, loc);
        } catch {
          push("bot", "I couldn't access your location automatically. What city or zip code are you near?");
          setStep("location");
          setIsLoading(false);
        }
        return;
      }
      setPendingQuery(text);
      setStep("location");
      push("bot", "Got it! What city or zip code are you near?");
    } else if (step === "location") {
      setIsLoading(true);
      try {
        const loc = await geocodeQuery(text);
        setLocation(loc);
        setStep("query");
        await doSearch(pendingQuery, loc);
      } catch {
        push("bot", 'I couldn\'t find that location. Try a city name or ZIP like "Miami, FL" or "90210".');
        setIsLoading(false);
      }
    }
  }

  async function doSearch(query, loc) {
    setIsLoading(true);
    try {
      const places = await searchPlacesByText(query, loc.lat, loc.lng);
      if (!places.length) {
        push("bot", `No results found for "${query}" near ${loc.label}. Try rephrasing or a broader search.`);
      } else {
        push("bot", `Here are ${places.length} places near ${loc.label}:`, places);
        push("bot", "Want to search for something else? Just type it in!");
      }
    } catch {
      push("bot", "Something went wrong with the search. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      {isOpen && (
        <div className="chat-panel">
          <div className="chat-header">
            <div className="chat-header-left">
              <span className="chat-header-icon">🔍</span>
              <span className="chat-header-title">Activity Finder</span>
            </div>
            {location && (
              <span className="chat-header-loc">📍 {location.label}</span>
            )}
            <button className="chat-close" onClick={() => setIsOpen(false)} aria-label="Close">
              ✕
            </button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-bubble chat-bubble-${msg.role}`}>
                <div className="chat-bubble-text">{msg.text}</div>
                {msg.places && (
                  <div className="chat-places-list">
                    {msg.places.map((p) => (
                      <PlaceCard key={p.id} place={p} />
                    ))}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble chat-bubble-bot chat-typing">
                <span />
                <span />
                <span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className="chat-input-row" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                step === "location" ? "City or ZIP code..." : "Search for activities or places..."
              }
              disabled={isLoading}
              autoComplete="off"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={isLoading || !input.trim()}
              aria-label="Send"
            >
              ↑
            </button>
          </form>
        </div>
      )}

      <button
        className={`chat-fab${isOpen ? " chat-fab-active" : ""}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Activity Finder"
      >
        {isOpen ? "✕" : "💬"}
      </button>
    </>
  );
}

function PlaceCard({ place }) {
  const full = Math.floor(place.rating || 0);
  const half = (place.rating || 0) - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  const stars = place.rating
    ? "★".repeat(full) + (half ? "½" : "") + "☆".repeat(empty)
    : null;

  return (
    <div className="chat-place-card">
      <div className="chat-place-name">{place.name}</div>
      {stars && (
        <div className="chat-place-meta">
          <span className="chat-stars">{stars}</span>
          {place.ratingCount != null && (
            <span className="chat-rating-count"> ({place.ratingCount.toLocaleString()})</span>
          )}
        </div>
      )}
      {place.address && <div className="chat-place-addr">{place.address}</div>}
      <div className="chat-place-footer">
        {place.openNow != null && (
          <span className={`chat-open-badge ${place.openNow ? "is-open" : "is-closed"}`}>
            {place.openNow ? "● Open" : "○ Closed"}
          </span>
        )}
        {place.website && (
          <a
            href={place.website}
            target="_blank"
            rel="noopener noreferrer"
            className="chat-place-website"
          >
            Website ↗
          </a>
        )}
      </div>
    </div>
  );
}
