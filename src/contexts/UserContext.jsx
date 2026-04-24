import React, { createContext, useContext, useState } from "react";
import { getSession, logout as apiLogout, saveCategories } from "../api/auth";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => getSession());

  function login(sessionUser) {
    setUser(sessionUser);
  }

  function logout() {
    apiLogout();
    setUser(null);
  }

  function updateCategories(categories) {
    if (!user) return;
    const updated = saveCategories(user.id, categories);
    setUser(updated);
  }

  return (
    <UserContext.Provider value={{ user, login, logout, updateCategories }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
