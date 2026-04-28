import React, { useState, useRef, useEffect } from "react";
import { useNotifications } from "../../contexts/NotificationContext";
import { useSaved } from "../../contexts/SavedEventsContext";

export default function NotificationBell() {
  const { permission, prefs, inbox, enable, updatePrefs, dismissAll, checkSavedUpcoming } = useNotifications();
  const { saved } = useSaved();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Check saved events on mount
  useEffect(() => {
    if (saved.length > 0) checkSavedUpcoming(saved);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unread = inbox.length;

  async function handleEnable() {
    const result = await enable();
    if (result === "denied") alert("Notification permission denied. Enable it in your browser settings.");
  }

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-bell" onClick={() => setOpen(!open)} aria-label="Notifications">
        🔔
        {unread > 0 && <span className="notif-badge">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="notif-dropdown">
          <div className="notif-dropdown__header">
            <span>Notifications</span>
            {inbox.length > 0 && (
              <button className="link-btn" onClick={dismissAll}>Clear all</button>
            )}
          </div>

          {/* Settings */}
          <div className="notif-settings">
            {permission !== "granted" ? (
              <button className="btn-notif-enable" onClick={handleEnable}>
                🔔 Enable push notifications
              </button>
            ) : (
              <div className="notif-prefs">
                <label className="notif-pref-row">
                  <input
                    type="checkbox"
                    checked={prefs.saved}
                    onChange={(e) => updatePrefs({ saved: e.target.checked })}
                  />
                  Remind me about saved events
                </label>
                <label className="notif-pref-row">
                  <input
                    type="checkbox"
                    checked={prefs.nearby}
                    onChange={(e) => updatePrefs({ nearby: e.target.checked })}
                  />
                  Notify me about new events nearby
                </label>
              </div>
            )}
          </div>

          {/* Inbox */}
          <div className="notif-list">
            {inbox.length === 0 ? (
              <p className="notif-empty">No notifications yet.</p>
            ) : (
              inbox.map((n) => (
                <div key={n.id} className="notif-item">
                  <p className="notif-item__title">{n.title}</p>
                  <p className="notif-item__body">{n.body}</p>
                  <p className="notif-item__ts">{n.ts}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
