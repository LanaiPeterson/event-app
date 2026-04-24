const USERS_KEY = "events_app_users";
const SESSION_KEY = "events_app_session";

function getUsers() {
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
}

export function signup({ name, email, password }) {
  const users = getUsers();
  if (users.find((u) => u.email === email)) {
    throw new Error("An account with this email already exists.");
  }
  const user = { id: Date.now().toString(), name, email, password, categories: [] };
  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));
  const session = { id: user.id, name: user.name, email: user.email, categories: user.categories };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function login({ email, password }) {
  const users = getUsers();
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) throw new Error("Invalid email or password.");
  const session = { id: user.id, name: user.name, email: user.email, categories: user.categories };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
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
