const KEY = "events_user_created";

function all() {
  return JSON.parse(localStorage.getItem(KEY) || "[]");
}

export function createUserEvent(event) {
  const next = { ...event, id: `ue_${Date.now()}`, createdAt: new Date().toISOString(), source: "Community" };
  localStorage.setItem(KEY, JSON.stringify([...all(), next]));
  return next;
}

export function getPublicUserEvents() {
  return all().filter((e) => e.visibility === "public");
}

export function getEventsForUser(userId, userEmail) {
  return all().filter(
    (e) =>
      e.creatorId === userId ||
      e.visibility === "public" ||
      (e.visibility === "private" && e.invites?.includes(userEmail))
  );
}

export function deleteUserEvent(eventId, userId) {
  const next = all().filter((e) => !(e.id === eventId && e.creatorId === userId));
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function getEventsByCreator(userId) {
  return all().filter((e) => e.creatorId === userId);
}

export function updateUserEvent(eventId, userId, updates) {
  const events = all();
  const idx = events.findIndex((e) => e.id === eventId && e.creatorId === userId);
  if (idx === -1) return null;
  events[idx] = { ...events[idx], ...updates };
  localStorage.setItem(KEY, JSON.stringify(events));
  return events[idx];
}
