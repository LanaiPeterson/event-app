import React, { useState, useRef, useEffect } from "react";
import { buildItinerary, planVacation, detectVacationIntent, isConfigured } from "../../api/itinerary";
import { fetchWeather } from "../../api/weather";
import { detectSeason } from "../../constants/seasons";
import { SEASONS } from "../../constants/seasons";
import LocationSearch from "../events/LocationSearch";

const TODAY = new Date().toISOString().slice(0, 10);

const GROUP_TYPES = [
  { value: "solo",    label: "Solo 🧍"    },
  { value: "couple",  label: "Couple 💑"  },
  { value: "family",  label: "Family 👨‍👩‍👧" },
  { value: "friends", label: "Friends 👫" },
];

export default function ItineraryBuilder({ places, events, location, onLocationChange, dataLoading }) {
  const [prompt,       setPrompt]       = useState("");
  const [date,         setDate]         = useState(TODAY);
  const [startTime,    setStartTime]    = useState("10:00");
  const [budget,       setBudget]       = useState(100);
  const [groupType,    setGroupType]    = useState("solo");
  const [weather,      setWeather]      = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [result,       setResult]       = useState(null);
  const [error,        setError]        = useState(null);
  const [listening,    setListening]    = useState(false);
  const [changingCity, setChangingCity] = useState(false);
  const recognitionRef = useRef(null);

  const notConfigured = !isConfigured();
  const isVacation = detectVacationIntent(prompt);

  // Fetch weather for local planning (not needed for vacation mode)
  useEffect(() => {
    setWeather(null);
    if (isVacation) return;
    const diffDays = Math.ceil((new Date(date + "T12:00:00") - new Date()) / 86400000);
    if (diffDays < 0 || diffDays > 15) return;
    setWeatherLoading(true);
    fetchWeather({ lat: location.lat, lng: location.lng, date }).then((w) => {
      setWeather(w);
      setWeatherLoading(false);
    });
  }, [date, location.lat, location.lng, isVacation]);

  function handleCityChange(r) {
    onLocationChange(r);
    setChangingCity(false);
    setResult(null);
  }

  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setError("Voice input not supported. Try Chrome."); return; }
    const rec = new SR();
    rec.lang = "en-US"; rec.continuous = false; rec.interimResults = false;
    rec.onresult = (e) => {
      setPrompt((p) => (p ? p + " " + e.results[0][0].transcript : e.results[0][0].transcript));
      setListening(false);
    };
    rec.onerror = rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stopVoice() { recognitionRef.current?.stop(); setListening(false); }

  async function handleGenerate() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (isVacation) {
        const r = await planVacation({ prompt, location, date, budget, groupType });
        setResult({ ...r, type: "vacation" });
      } else {
        const season = detectSeason(date);
        const seasonHint = SEASONS[season]?.aiHint ?? "";
        const r = await buildItinerary({
          prompt, places, events, location, date, startTime,
          budget, groupType, season, weather, seasonHint,
        });
        setResult({ ...r, type: "local" });
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const canGenerate = prompt.trim().length > 0 && !loading && (isVacation || !dataLoading);

  return (
    <div className="itinerary-builder">
      {notConfigured && (
        <div className="itinerary-setup-banner">
          <strong>AI key required.</strong> Add <code>VITE_ANTHROPIC_KEY=your_key</code> to{" "}
          <code>.env.local</code>.{" "}
          <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer">
            Get a free key →
          </a>
        </div>
      )}

      <div className="itinerary-input-card">
        {/* City row */}
        <div className="itinerary-city-row">
          <span className="itinerary-city-label">📍 {isVacation ? "Departing from:" : "Planning for:"}</span>
          {changingCity ? (
            <div className="itinerary-city-search">
              <LocationSearch onLocation={handleCityChange} />
              <button className="itinerary-city-cancel" onClick={() => setChangingCity(false)} type="button">Cancel</button>
            </div>
          ) : (
            <div className="itinerary-city-display">
              <strong>{location.label}</strong>
              <button className="itinerary-city-change-btn" onClick={() => setChangingCity(true)} type="button">Change city</button>
            </div>
          )}
        </div>

        {/* Vacation mode badge */}
        {isVacation && (
          <div className="vacation-mode-badge">
            ✈️ <strong>Vacation planner mode</strong> — I'll recommend destinations, estimate flights, hotels & activities
          </div>
        )}

        <div className="itinerary-input-label">
          {isVacation ? "Where do you want to go?" : "What kind of day are you planning?"}
        </div>

        <div className="itinerary-prompt-wrap">
          <textarea
            className="itinerary-prompt"
            placeholder={
              isVacation
                ? 'e.g. "Recommend a vacation for me and my husband with beaches anywhere in the world, budget $1,800 per person"'
                : 'e.g. "A fun family afternoon at a park and lunch, budget $60" or speak with 🎙️'
            }
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            disabled={notConfigured}
          />
          <button
            className={`voice-btn ${listening ? "voice-btn--listening" : ""}`}
            onClick={listening ? stopVoice : startVoice}
            title={listening ? "Stop recording" : "Speak your plan"}
            disabled={notConfigured}
            type="button"
          >
            {listening ? "⏹" : "🎙️"}
          </button>
        </div>

        {listening && (
          <div className="voice-indicator"><span className="voice-dot" /> Listening…</div>
        )}

        {/* Weather strip — local mode only */}
        {!isVacation && (weatherLoading || weather) && (
          <div className={`weather-strip ${weather?.suggestIndoor ? "weather-strip--rain" : ""}`}>
            {weatherLoading ? (
              <span className="weather-strip__text">🌡️ Loading forecast…</span>
            ) : weather ? (
              <>
                <div className="weather-strip__main">
                  <span className="weather-strip__icon">{weather.icon}</span>
                  <span className="weather-strip__label">{weather.label}</span>
                  {weather.tempMaxF != null && (
                    <span className="weather-strip__temp">{weather.tempMinF}–{weather.tempMaxF}°F</span>
                  )}
                  {weather.precipProbability > 0 && (
                    <span className="weather-strip__precip">💧 {weather.precipProbability}%</span>
                  )}
                </div>
                {weather.suggestIndoor && (
                  <div className="weather-strip__tip">⚠️ Rain expected — AI will mix indoor & outdoor stops</div>
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Prefs */}
        <div className="itinerary-prefs">
          <div className="itinerary-pref">
            <label>{isVacation ? "Travel month" : "Date"}</label>
            <input type="date" value={date} min={TODAY} onChange={(e) => setDate(e.target.value)} />
          </div>
          {!isVacation && (
            <div className="itinerary-pref">
              <label>Start time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
          )}
          <div className="itinerary-pref">
            <label>Budget{isVacation ? " per person" : ""}: <strong>${budget}</strong></label>
            <input type="range" min={isVacation ? 500 : 0} max={isVacation ? 10000 : 500} step={isVacation ? 100 : 10} value={budget} onChange={(e) => setBudget(Number(e.target.value))} />
          </div>
          <div className="itinerary-pref">
            <label>Group</label>
            <select value={groupType} onChange={(e) => setGroupType(e.target.value)}>
              {GROUP_TYPES.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
        </div>

        <button className="itinerary-generate-btn" onClick={handleGenerate} disabled={!canGenerate || notConfigured} type="button">
          {loading ? (
            <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> {isVacation ? "Finding your perfect destination…" : "Planning your day…"}</>
          ) : (
            isVacation ? "✈️ Plan My Vacation" : "✨ Generate Itinerary"
          )}
        </button>

        {!isVacation && dataLoading && !loading && (
          <p className="itinerary-data-note">Loading nearby places and events…</p>
        )}
      </div>

      {error && <div className="itinerary-error"><strong>Error:</strong> {error}</div>}

      {loading && (
        <div className="itinerary-loading">
          <div className="itinerary-loading-animation">{isVacation ? "✈️" : "🤔"}</div>
          <p>{isVacation ? "Searching the world for your perfect trip…" : "Planning your perfect day…"}</p>
          <p className="itinerary-loading-sub">
            {isVacation
              ? `Calculating flights from ${location.label.split(",")[0]}, hotels & activities…`
              : weather?.suggestIndoor
              ? "Rain detected — mixing indoor & outdoor options…"
              : `Picking the best activities near ${location.label.split(",")[0]}…`}
          </p>
        </div>
      )}

      {result && !loading && result.type === "vacation" && (
        <VacationDisplay vacation={result} onReset={() => setResult(null)} />
      )}
      {result && !loading && result.type === "local" && (
        <ItineraryDisplay itinerary={result} onReset={() => setResult(null)} />
      )}
    </div>
  );
}

// ─── Vacation Display ────────────────────────────────────────────────────────

function VacationDisplay({ vacation: v, onReset }) {
  return (
    <div className="vacation-result">
      <div className="vacation-result__header">
        <div className="vacation-result__badge">✈️ Vacation Recommendation</div>
        <h2 className="vacation-result__destination">{v.destination}</h2>
        <p className="vacation-result__tagline">{v.tagline}</p>
        <div className="vacation-result__meta">
          {v.departureCity && <span>🛫 From {v.departureCity}</span>}
          {v.travelMonth && <span>📅 {v.travelMonth}</span>}
          {v.recommendedDuration && <span>⏱️ {v.recommendedDuration}</span>}
        </div>
        {v.seasonAtDestination && (
          <div className="vacation-result__season-note">
            🌦️ <strong>Weather there:</strong> {v.seasonAtDestination}
            {v.bestMonthsToVisit && ` · Best months: ${v.bestMonthsToVisit}`}
          </div>
        )}
        <button className="itinerary-redo-btn" onClick={onReset} type="button" style={{ marginTop: 12 }}>↺ New Search</button>
      </div>

      {/* Budget breakdown */}
      {v.budgetBreakdown?.length > 0 && (
        <div className="vacation-budget">
          <h3 className="vacation-section-title">
            💰 Budget Breakdown
            {v.perPersonBudget && <span className="vacation-budget__total"> · ${v.perPersonBudget}/person</span>}
          </h3>
          <div className="vacation-budget__rows">
            {v.budgetBreakdown.map((row, i) => (
              <div key={i} className="vacation-budget__row">
                <span className="vacation-budget__icon">{row.icon}</span>
                <span className="vacation-budget__cat">{row.category}</span>
                <span className="vacation-budget__est">{row.estimate}</span>
                {row.notes && <span className="vacation-budget__notes">{row.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Highlights */}
      {v.highlights?.length > 0 && (
        <div className="vacation-section">
          <h3 className="vacation-section-title">⭐ Highlights</h3>
          <div className="vacation-highlights">
            {v.highlights.map((h, i) => (
              <div key={i} className="vacation-highlight-chip">{h}</div>
            ))}
          </div>
        </div>
      )}

      {/* Sample itinerary */}
      {v.sampleItinerary?.length > 0 && (
        <div className="vacation-section">
          <h3 className="vacation-section-title">📋 Sample Itinerary</h3>
          <div className="vacation-days">
            {v.sampleItinerary.map((day, i) => (
              <div key={i} className="vacation-day">
                <div className="vacation-day__label">Day {day.day}</div>
                <div className="vacation-day__content">
                  <strong>{day.title}</strong>
                  <ul>{day.activities?.map((a, j) => <li key={j}>{a}</li>)}</ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking tips */}
      {v.bookingTips?.length > 0 && (
        <div className="vacation-section">
          <h3 className="vacation-section-title">💡 Booking Tips</h3>
          <ul className="vacation-tips-list">
            {v.bookingTips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}

      {/* Alternatives */}
      {v.alternatives?.length > 0 && (
        <div className="vacation-section">
          <h3 className="vacation-section-title">🗺️ Also Consider</h3>
          <div className="vacation-alts">
            {v.alternatives.map((alt, i) => (
              <div key={i} className="vacation-alt-card">
                <div className="vacation-alt-card__dest">{alt.destination}</div>
                <div className="vacation-alt-card__tagline">{alt.tagline}</div>
                <div className="vacation-alt-card__meta">
                  {alt.flightEstimate && <span>✈️ {alt.flightEstimate}</span>}
                  {alt.totalPerPerson && <span>💰 {alt.totalPerPerson} all-in</span>}
                </div>
                {alt.bestFor && <div className="vacation-alt-card__best">Best for: {alt.bestFor}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Local Itinerary Display ─────────────────────────────────────────────────

function ItineraryDisplay({ itinerary, onReset }) {
  function formatCost(c) { return c == null ? null : c === 0 ? "Free" : `~$${c}`; }
  function travelIcon(m) {
    return m === "walking" ? "🚶" : m === "transit" ? "🚌" : "🚗";
  }
  function googleCalUrl(stop) {
    if (!itinerary.date || !stop.startTime) return null;
    const d     = itinerary.date.replace(/-/g, "");
    const start = stop.startTime.replace(":", "") + "00";
    const end   = stop.endTime ? stop.endTime.replace(":", "") + "00" : "";
    const dates = end ? `${d}T${start}/${d}T${end}` : `${d}T${start}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(stop.name)}&dates=${dates}&location=${encodeURIComponent(stop.address || "")}`;
  }

  return (
    <div className="itinerary-result">
      <div className="itinerary-result-header">
        <div>
          <h2 className="itinerary-result-title">{itinerary.title}</h2>
          <p className="itinerary-result-meta">
            📅 {itinerary.date}
            {itinerary.totalEstimatedCost != null && <> · 💰 Est. ${itinerary.totalEstimatedCost}</>}
          </p>
        </div>
        <button className="itinerary-redo-btn" onClick={onReset} type="button">↺ New Plan</button>
      </div>

      <div className="itinerary-timeline">
        {(itinerary.stops ?? []).map((stop, i) => (
          <div key={i} className="itinerary-stop">
            {stop.travelMinutesFromPrev != null && i > 0 && (
              <div className="itinerary-travel">
                <span className="itinerary-travel-line" />
                {travelIcon(stop.travelMode)} {stop.travelMinutesFromPrev} min {stop.travelMode || "drive"}
              </div>
            )}
            <div className="itinerary-stop-card">
              <div className="itinerary-stop-time">
                <span className="itinerary-stop-start">{stop.startTime}</span>
                {stop.endTime && <span className="itinerary-stop-end">→ {stop.endTime}</span>}
              </div>
              <div className="itinerary-stop-content">
                <div className="itinerary-stop-header">
                  <span className="itinerary-stop-num">{stop.order}</span>
                  <h4 className="itinerary-stop-name">{stop.name}</h4>
                  {formatCost(stop.estimatedCost) && (
                    <span className={`itinerary-cost-badge ${stop.estimatedCost === 0 ? "free" : ""}`}>
                      {formatCost(stop.estimatedCost)}
                    </span>
                  )}
                </div>
                <p className="itinerary-stop-category">
                  {stop.type === "event" ? "🎟 Event" : "📍 Place"}
                  {stop.category ? ` · ${stop.category}` : ""}
                </p>
                {stop.address && <p className="itinerary-stop-addr">📍 {stop.address}</p>}
                {stop.description && <p className="itinerary-stop-desc">{stop.description}</p>}
                <div className="itinerary-stop-links">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.address || stop.name)}`}
                    target="_blank" rel="noopener noreferrer" className="itinerary-link-btn"
                  >
                    🗺️ Directions
                  </a>
                  {googleCalUrl(stop) && (
                    <a href={googleCalUrl(stop)} target="_blank" rel="noopener noreferrer" className="itinerary-link-btn">
                      📅 Add to Cal
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {itinerary.summary && (
        <div className="itinerary-summary"><h4>Day Summary</h4><p>{itinerary.summary}</p></div>
      )}
      {itinerary.tips?.length > 0 && (
        <div className="itinerary-tips">
          <h4>💡 Tips for your day</h4>
          <ul>{itinerary.tips.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
