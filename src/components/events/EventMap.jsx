import React, { useState, useRef, useEffect, useCallback } from "react";
import { GoogleMap, useLoadScript, Marker, InfoWindow, Circle } from "@react-google-maps/api";

const KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY;

const isTouchDevice =
  typeof window !== "undefined" &&
  ("ontouchstart" in window || navigator.maxTouchPoints > 0);

function svgUri(svg) {
  return (
    "data:image/svg+xml;charset=UTF-8," +
    svg.replace(/</g, "%3C").replace(/>/g, "%3E").replace(/#/g, "%23").replace(/"/g, "'")
  );
}

function activeEventIcon() {
  return {
    url: svgUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26"><circle cx="13" cy="13" r="12" fill="#6c63ff" stroke="white" stroke-width="3"/><circle cx="13" cy="13" r="5" fill="white"/></svg>`
    ),
    scaledSize: new window.google.maps.Size(26, 26),
    anchor: new window.google.maps.Point(13, 13),
  };
}

function defaultEventIcon() {
  return {
    url: svgUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="32" viewBox="0 0 24 32"><path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 20 12 20S24 21 24 12C24 5.4 18.6 0 12 0z" fill="#e74c3c" stroke="white" stroke-width="1.5"/><circle cx="12" cy="12" r="5" fill="white"/></svg>`
    ),
    scaledSize: new window.google.maps.Size(24, 32),
    anchor: new window.google.maps.Point(12, 32),
  };
}

function placeIcon(color, emoji) {
  return {
    url: svgUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect x="1" y="1" width="30" height="30" rx="8" fill="${color}" stroke="white" stroke-width="2"/><text x="16" y="22" text-anchor="middle" font-size="16">${emoji}</text></svg>`
    ),
    scaledSize: new window.google.maps.Size(32, 32),
    anchor: new window.google.maps.Point(16, 16),
  };
}

function userDotIcon() {
  return {
    url: svgUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="7" fill="#6c63ff" stroke="white" stroke-width="3"/></svg>`
    ),
    scaledSize: new window.google.maps.Size(16, 16),
    anchor: new window.google.maps.Point(8, 8),
  };
}

function cursorDotIcon() {
  return {
    url: svgUri(
      `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14"><circle cx="7" cy="7" r="5" fill="#6c63ff" stroke="white" stroke-width="2"/></svg>`
    ),
    scaledSize: new window.google.maps.Size(14, 14),
    anchor: new window.google.maps.Point(7, 7),
  };
}

const MAP_TYPE_LABELS = [
  ["roadmap", "Street"],
  ["satellite", "Satellite"],
  ["hybrid", "Hybrid"],
];

export default function EventMap({
  events, places = [], activeId, onSelect,
  userLocation, radius,
  onHoverPos, onHoverClear,
}) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: KEY || "" });
  const mapRef = useRef(null);
  const containerRef = useRef(null);
  const onHoverPosRef = useRef(onHoverPos);
  const onHoverClearRef = useRef(onHoverClear);
  useEffect(() => { onHoverPosRef.current = onHoverPos; }, [onHoverPos]);
  useEffect(() => { onHoverClearRef.current = onHoverClear; }, [onHoverClear]);

  const [openInfoId, setOpenInfoId] = useState(null);
  const [mapType, setMapType] = useState("roadmap");
  const [cursorPos, setCursorPos] = useState(null);

  const center = userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng }
    : { lat: 40.7128, lng: -74.006 };

  // Re-center when user location changes
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
      mapRef.current.setZoom(12);
    }
  }, [userLocation?.lat, userLocation?.lng]);

  // Fly to active event
  useEffect(() => {
    const ev = events.find((e) => e.id === activeId);
    if (ev && mapRef.current) {
      mapRef.current.panTo({ lat: ev.lat, lng: ev.lng });
      if (mapRef.current.getZoom() < 13) mapRef.current.setZoom(13);
    }
  }, [activeId]);

  // Detect cursor leaving the map container (desktop)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handleLeave = () => {
      if (isTouchDevice) return;
      setCursorPos(null);
      onHoverClearRef.current();
    };
    el.addEventListener("mouseleave", handleLeave);
    return () => el.removeEventListener("mouseleave", handleLeave);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isTouchDevice || !e.latLng) return;
    const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    setCursorPos(pos);
    onHoverPosRef.current(pos);
  }, []);

  // After map pan/zoom settles on mobile, update hover to map center
  const handleIdle = useCallback(() => {
    if (!isTouchDevice || !mapRef.current) return;
    const c = mapRef.current.getCenter();
    if (c) onHoverPosRef.current({ lat: c.lat(), lng: c.lng() });
  }, []);

  if (!isLoaded) {
    return (
      <div className="event-map" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {/* Map type switcher */}
      <div style={{
        position: "absolute", top: 10, left: 10, zIndex: 10,
        display: "flex", gap: 4, pointerEvents: "auto",
      }}>
        {MAP_TYPE_LABELS.map(([type, label]) => (
          <button
            key={type}
            onClick={() => setMapType(type)}
            style={{
              padding: "4px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer",
              background: mapType === type ? "#6c63ff" : "white",
              color: mapType === type ? "white" : "#333",
              border: "1px solid #ccc", borderRadius: 4,
              boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <GoogleMap
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={center}
        zoom={12}
        options={{
          mapTypeId: mapType,
          mapTypeControl: false,
          fullscreenControl: true,
          streetViewControl: false,
          clickableIcons: false,
          gestureHandling: "greedy",
          zoomControlOptions: {
            position: window.google.maps.ControlPosition.RIGHT_TOP,
          },
        }}
        onLoad={(map) => { mapRef.current = map; }}
        onMouseMove={handleMouseMove}
        onIdle={handleIdle}
      >
        {/* Search radius + user location */}
        {userLocation && (
          <>
            <Circle
              center={{ lat: userLocation.lat, lng: userLocation.lng }}
              radius={radius * 1609.34}
              options={{
                fillColor: "#6c63ff",
                fillOpacity: 0.06,
                strokeColor: "#6c63ff",
                strokeWeight: 1.5,
                strokeOpacity: 0.8,
                clickable: false,
              }}
            />
            <Marker
              position={{ lat: userLocation.lat, lng: userLocation.lng }}
              icon={userDotIcon()}
              title="Your location"
              onClick={() => setOpenInfoId("__user__")}
            >
              {openInfoId === "__user__" && (
                <InfoWindow onCloseClick={() => setOpenInfoId(null)}>
                  <strong>Your location</strong>
                </InfoWindow>
              )}
            </Marker>
          </>
        )}

        {/* Event markers */}
        {events.map((event) => (
          <Marker
            key={event.id}
            position={{ lat: event.lat, lng: event.lng }}
            icon={event.id === activeId ? activeEventIcon() : defaultEventIcon()}
            zIndex={event.id === activeId ? 100 : 1}
            onClick={() => {
              onSelect(event.id);
              setOpenInfoId(event.id);
            }}
          >
            {openInfoId === event.id && (
              <InfoWindow onCloseClick={() => setOpenInfoId(null)}>
                <div className="map-popup">
                  <p className="map-popup__title">{event.title}</p>
                  <p className="map-popup__address">📍 {event.address}</p>
                  <p className="map-popup__meta">📅 {event.date} &nbsp;·&nbsp; 🕐 {event.time}</p>
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}

        {/* Place markers */}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            icon={placeIcon(place.categoryColor || "#6c63ff", place.categoryIcon || "📍")}
            onClick={() => setOpenInfoId(place.id)}
          >
            {openInfoId === place.id && (
              <InfoWindow onCloseClick={() => setOpenInfoId(null)}>
                <div className="map-popup">
                  <p className="map-popup__title">{place.categoryIcon} {place.name}</p>
                  {place.address && (
                    <p className="map-popup__address">📍 {place.address}</p>
                  )}
                  <p className="map-popup__meta">
                    {place.rating != null && `★ ${place.rating.toFixed(1)}`}
                    {place.openNow !== null && (
                      <span style={{ marginLeft: 8, color: place.openNow ? "#27ae60" : "#c0392b" }}>
                        {place.openNow ? " · Open" : " · Closed"}
                      </span>
                    )}
                  </p>
                  {place.website && (
                    <a
                      href={place.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 12, color: "#6c63ff", fontWeight: 600 }}
                    >
                      Visit website →
                    </a>
                  )}
                </div>
              </InfoWindow>
            )}
          </Marker>
        ))}

        {/* Cursor dot (desktop only) */}
        {cursorPos && (
          <Marker
            position={cursorPos}
            icon={cursorDotIcon()}
            clickable={false}
            zIndex={2000}
          />
        )}
      </GoogleMap>
    </div>
  );
}
