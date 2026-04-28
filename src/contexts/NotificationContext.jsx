import React, { createContext, useContext, useState, useEffect } from "react";
import { useUser } from "./UserContext";

const NotificationContext = createContext(null);
const prefKey = (uid) => `events_notif_prefs_${uid}`;

export function NotificationProvider({ children }) {
  const { user } = useUser();
  const [permission, setPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "denied"
  );
  const [prefs, setPrefs] = useState(() => {
    const stored = user ? localStorage.getItem(prefKey(user.id)) : null;
    return stored ? JSON.parse(stored) : { nearby: true, saved: true };
  });
  const [inbox, setInbox] = useState([]);

  async function enable() {
    if (typeof Notification === "undefined") return;
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }

  function updatePrefs(patch) {
    setPrefs((p) => {
      const next = { ...p, ...patch };
      if (user) localStorage.setItem(prefKey(user.id), JSON.stringify(next));
      return next;
    });
  }

  function notify(title, body, tag) {
    addToInbox(title, body);
    if (permission === "granted") {
      new Notification(title, { body, tag, icon: "/favicon.ico" });
    }
  }

  function addToInbox(title, body) {
    setInbox((prev) => [
      { id: Date.now(), title, body, ts: new Date().toLocaleTimeString() },
      ...prev.slice(0, 19),
    ]);
  }

  function dismissAll() {
    setInbox([]);
  }

  // Check saved events daily for ones happening tomorrow
  function checkSavedUpcoming(savedEvents) {
    if (!prefs.saved) return;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    savedEvents.forEach((ev) => {
      if (ev.date === tomorrowStr) {
        notify(
          `Tomorrow: ${ev.title}`,
          `${ev.time !== "TBA" ? ev.time + " · " : ""}${ev.address}`,
          `remind_${ev.id}`
        );
      }
    });
  }

  return (
    <NotificationContext.Provider
      value={{ permission, prefs, inbox, enable, updatePrefs, notify, dismissAll, checkSavedUpcoming }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationContext);
}
