const USERS_KEY = "events_app_users";
const SESSION_KEY = "events_app_session";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

export function signup({ name, email, password, role = "attendee" }) {
  const users = getUsers();
  if (users.find((u) => u.email === email)) {
    throw new Error("An account with this email already exists.");
  }
  const user = { id: Date.now().toString(), name, email, password, role, categories: [] };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  const session = { id: user.id, name: user.name, email: user.email, role: user.role, categories: user.categories };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function login({ email, password }) {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error("Invalid email or password.");
  const session = { id: user.id, name: user.name, email: user.email, role: user.role || "attendee", categories: user.categories };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
}

export function forgotPassword({ email, newPassword }) {
  if (!email.trim()) throw new Error("Please enter your email address.");
  if (newPassword.length < 6) throw new Error("New password must be at least 6 characters.");
  const users = getUsers();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  if (idx === -1) throw new Error("No account found with that email address.");
  users[idx].password = newPassword;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function getContacts(userId) {
  return JSON.parse(localStorage.getItem(`events_contacts_${userId}`) || "[]");
}

export function saveContact(userId, contact) {
  const contacts = getContacts(userId);
  if (contacts.find((c) => c.email === contact.email)) return contacts;
  const next = [...contacts, { id: Date.now().toString(), ...contact }];
  localStorage.setItem(`events_contacts_${userId}`, JSON.stringify(next));
  return next;
}

export function removeContact(userId, contactId) {
  const next = getContacts(userId).filter((c) => c.id !== contactId);
  localStorage.setItem(`events_contacts_${userId}`, JSON.stringify(next));
  return next;
}

export function saveCategories(userId, categories) {
  const users = getUsers();
  const updated = users.map((u) =>
    u.id === userId ? { ...u, categories } : u
  );
  localStorage.setItem(USERS_KEY, JSON.stringify(updated));
  const session = JSON.parse(localStorage.getItem(SESSION_KEY));
  if (session) {
    const next = { ...session, categories };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return next;
  }
}
