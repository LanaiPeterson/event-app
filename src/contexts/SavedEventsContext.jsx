import React, { createContext, useContext, useState, useCallback } from "react";
import { useUser } from "./UserContext";

const SavedEventsContext = createContext(null);
const key = (uid) => `events_saved_${uid}`;

function load(uid) {
  if (!uid) return [];
  return JSON.parse(localStorage.getItem(key(uid)) || "[]");
}

export function SavedEventsProvider({ children }) {
  const { user } = useUser();
  const [saved, setSaved] = useState(() => load(user?.id));

  const isSaved = useCallback((id) => saved.some((e) => e.id === id), [saved]);

  function toggleSaved(event) {
    setSaved((prev) => {
      const next = prev.some((e) => e.id === event.id)
        ? prev.filter((e) => e.id !== event.id)
        : [...prev, event];
      if (user) localStorage.setItem(key(user.id), JSON.stringify(next));
      return next;
    });
  }

  return (
    <SavedEventsContext.Provider value={{ saved, isSaved, toggleSaved }}>
      {children}
    </SavedEventsContext.Provider>
  );
}

export function useSaved() {
  return useContext(SavedEventsContext);
}
