import React, { useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  LayersControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TILE_LAYERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA",
  },
  hybrid: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attribution: "Labels &copy; Esri",
  },
};

function activeIcon() {
  return L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:50%;background:#6c63ff;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center">
             <div style="width:8px;height:8px;border-radius:50%;background:white"></div>
           </div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

// Handles two distinct map moves: location change (setView) and event selection (flyTo)
function MapController({ userCenter, flyTo }) {
  const map = useMap();

  useEffect(() => {
    if (userCenter) map.setView(userCenter, 12);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userCenter?.[0], userCenter?.[1]]);

  useEffect(() => {
    if (flyTo) map.flyTo(flyTo, Math.max(map.getZoom(), 13), { duration: 0.8 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTo?.[0], flyTo?.[1]]);

  return null;
}

export default function EventMap({ events, activeId, onSelect, userLocation, radius }) {
  const center = userLocation
    ? [userLocation.lat, userLocation.lng]
    : [40.7128, -74.006];

  const activeEvent = events.find((e) => e.id === activeId);
  const flyTo = activeEvent ? [activeEvent.lat, activeEvent.lng] : null;

  return (
    <MapContainer center={center} zoom={12} className="event-map">
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Street">
          <TileLayer
            url={TILE_LAYERS.street.url}
            attribution={TILE_LAYERS.street.attribution}
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.BaseLayer name="Satellite">
          <TileLayer
            url={TILE_LAYERS.satellite.url}
            attribution={TILE_LAYERS.satellite.attribution}
            maxZoom={19}
          />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay name="Labels (Satellite)">
          <TileLayer
            url={TILE_LAYERS.hybrid.url}
            attribution={TILE_LAYERS.hybrid.attribution}
            maxZoom={19}
            opacity={0.9}
          />
        </LayersControl.Overlay>
      </LayersControl>

      {userLocation && (
        <>
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={radius * 1609.34}
            pathOptions={{ color: "#6c63ff", fillColor: "#6c63ff", fillOpacity: 0.06, weight: 1.5 }}
          />
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
              className: "",
              html: `<div style="width:16px;height:16px;border-radius:50%;background:#6c63ff;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5)"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
          >
            <Popup><strong>Your location</strong></Popup>
          </Marker>
        </>
      )}

      {events.map((event) => (
        <Marker
          key={event.id}
          position={[event.lat, event.lng]}
          icon={event.id === activeId ? activeIcon() : new L.Icon.Default()}
          eventHandlers={{ click: () => onSelect(event.id) }}
        >
          <Popup maxWidth={220}>
            <div className="map-popup">
              <p className="map-popup__title">{event.title}</p>
              <p className="map-popup__address">📍 {event.address}</p>
              <p className="map-popup__meta">📅 {event.date} &nbsp;·&nbsp; 🕐 {event.time}</p>
            </div>
          </Popup>
        </Marker>
      ))}

      <MapController
        userCenter={userLocation ? [userLocation.lat, userLocation.lng] : null}
        flyTo={flyTo}
      />
    </MapContainer>
  );
}
