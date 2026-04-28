import React, { useEffect, useState } from "react";
import { fetchPlaceDetails, getPhotoUrl } from "../../api/googlePlaces";

export default function PlaceDetailModal({ place, onClose }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);

  useEffect(() => {
    if (!place) return;
    setLoading(true);
    setDetails(null);
    setPhotoIdx(0);
    fetchPlaceDetails(place.id)
      .then(setDetails)
      .catch(() => setDetails(null))
      .finally(() => setLoading(false));
  }, [place?.id]);

  if (!place) return null;

  const photos = details?.photos ?? [];
  const reviews = details?.reviews ?? [];
  const stars = (n) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        {/* Photo carousel */}
        {photos.length > 0 && (
          <div className="modal-photos">
            <img
              src={getPhotoUrl(photos[photoIdx].name)}
              alt={place.name}
              className="modal-photo"
            />
            {photos.length > 1 && (
              <div className="modal-photo-nav">
                <button
                  onClick={() => setPhotoIdx((i) => Math.max(0, i - 1))}
                  disabled={photoIdx === 0}
                >‹</button>
                <span>{photoIdx + 1} / {photos.length}</span>
                <button
                  onClick={() => setPhotoIdx((i) => Math.min(photos.length - 1, i + 1))}
                  disabled={photoIdx === photos.length - 1}
                >›</button>
              </div>
            )}
          </div>
        )}

        {loading && !photos.length && (
          <div className="modal-loading" style={{ height: 100, marginTop: 48 }}>
            <div className="spinner" />
          </div>
        )}

        <div className="modal-body">
          <div className="modal-title-row">
            <span className="modal-cat-icon" style={{ background: place.categoryColor }}>
              {place.categoryIcon}
            </span>
            <div>
              <h3 className="modal-title">{place.name}</h3>
              {place.categoryName && (
                <span className="modal-cat-label">{place.categoryName}</span>
              )}
            </div>
          </div>

          {place.rating != null && (
            <div className="modal-rating">
              <span className="modal-stars">{stars(place.rating)}</span>
              <span className="modal-rating-num">{place.rating.toFixed(1)}</span>
              {place.ratingCount && (
                <span className="modal-rating-count">
                  ({place.ratingCount.toLocaleString()} reviews)
                </span>
              )}
              {place.openNow !== null && (
                <span className={`place-open-badge ${place.openNow ? "open" : "closed"}`}>
                  {place.openNow ? "Open now" : "Closed"}
                </span>
              )}
            </div>
          )}

          {place.address && <p className="modal-address">📍 {place.address}</p>}
          {place.phone && <p className="modal-phone">📞 {place.phone}</p>}

          {place.website && (
            <a
              href={place.website}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-website-btn"
            >
              Visit Website →
            </a>
          )}

          {/* Google reviews */}
          {loading && (
            <div className="modal-loading" style={{ paddingTop: 24 }}>
              <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
            </div>
          )}

          {!loading && reviews.length > 0 && (
            <div className="modal-reviews">
              <h4 className="modal-reviews-title">Google Reviews</h4>
              {reviews.slice(0, 5).map((r, i) => (
                <div key={i} className="modal-review">
                  <div className="modal-review-header">
                    {r.authorAttribution?.photoUri && (
                      <img
                        src={r.authorAttribution.photoUri}
                        className="modal-review-avatar"
                        alt=""
                      />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p className="modal-review-author">
                        {r.authorAttribution?.displayName || "Anonymous"}
                      </p>
                      <p className="modal-review-time">
                        {r.relativePublishTimeDescription}
                      </p>
                    </div>
                    <span className="modal-review-stars">{stars(r.rating)}</span>
                  </div>
                  {r.text?.text && (
                    <p className="modal-review-text">{r.text.text}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && reviews.length === 0 && (
            <p style={{ fontSize: 13, color: "#aaa", marginTop: 16 }}>
              No reviews available for this place.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
