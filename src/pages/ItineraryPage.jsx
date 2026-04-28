import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { reverseGeocode } from "../api/geocode";
import { fetchEvents } from "../api/events";
import { fetchPlacesByTypes, isConfigured as isGoogleConfigured } from "../api/googlePlaces";
import ItineraryBuilder from "../components/itinerary/ItineraryBuilder";

const NYC = { lat: 40.7128, lng: -74.006, label: "New York City, NY" };

const FOOD_TYPES = ["restaurant", "cafe", "bar", "bakery"];
const ACTIVITY_TYPES = [
  "museum", "park", "tourist_attraction", "amusement_park",
  "movie_theater", "bowling_alley", "zoo", "aquarium", "art_gallery",
  "casino", "amusement_center", "escape_room", "video_arcade",
  "comedy_club", "performing_arts_theater", "concert_hall",
];

export default function ItineraryPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [location, setLocation] = useState(NYC);
  const [locating, setLocating] = useState(true);
  const [places, setPlaces] = useState([]);
  const [events, setEvents] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const result = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
        setLocation(result);
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    if (locating) return;
    setDataLoading(true);

    const radius = 16093; // 10 miles in meters
    const placeFetches = isGoogleConfigured()
      ? [
          fetchPlacesByTypes({
            lat: location.lat, lng: location.lng, radiusMeters: radius,
            types: FOOD_TYPES, categoryName: "Food & Drink",
            categoryColor: "#e67e22", categoryIcon: "🍽️",
          }).catch(() => []),
          fetchPlacesByTypes({
            lat: location.lat, lng: location.lng, radiusMeters: radius,
            types: ACTIVITY_TYPES, categoryName: "Activities",
            categoryColor: "#6c63ff", categoryIcon: "🎯",
          }).catch(() => []),
        ]
      : [Promise.resolve([])];

    Promise.all([
      Promise.all(placeFetches).then((arrs) => {
        const seen = new Set();
        return arrs.flat().filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
      }),
      fetchEvents({
        userLat: location.lat,
        userLng: location.lng,
        radius: 25,
        locationLabel: location.label,
      }).catch(() => []),
    ]).then(([fetchedPlaces, fetchedEvents]) => {
      setPlaces(fetchedPlaces);
      setEvents(fetchedEvents);
      setDataLoading(false);
    });
  }, [locating, location.lat, location.lng]);

  return (
    <div className="itinerary-page">
      <header className="itinerary-header">
        <button className="link-btn" onClick={() => navigate("/events")}>
          ← Back
        </button>
        <div className="itinerary-header__title">
          <span>🗓️</span> AI Itinerary Planner
        </div>
        <span className="itinerary-header__location">
          📍 {location.label.split(",")[0]}
        </span>
        <span className="itinerary-header__user">
          Hi, {user?.name?.split(" ")[0]}
        </span>
      </header>

      {locating && (
        <div className="location-banner location-banner--detecting">
          <span className="location-detecting-dot" /> Detecting your location…
        </div>
      )}

      <div className="itinerary-main">
        <ItineraryBuilder
          places={places}
          events={events}
          location={location}
          onLocationChange={setLocation}
          dataLoading={dataLoading || locating}
        />
      </div>
    </div>
  );
}
