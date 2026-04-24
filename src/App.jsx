import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import { FilterProvider } from "./contexts/FilterContext";
import LoginPage from "./pages/LoginPage";
import CategoryPage from "./pages/CategoryPage";
import EventsPage from "./pages/EventsPage";

function PrivateRoute({ children }) {
  const { user } = useUser();
  return user ? children : <Navigate to="/login" replace />;
}

function AuthRoute({ children }) {
  const { user } = useUser();
  if (!user) return children;
  // New user with no categories → onboarding
  if (!user.categories || user.categories.length === 0) {
    return <Navigate to="/categories" replace />;
  }
  return <Navigate to="/events" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <AuthRoute>
            <LoginPage />
          </AuthRoute>
        }
      />
      <Route
        path="/categories"
        element={
          <PrivateRoute>
            <CategoryPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/events"
        element={
          <PrivateRoute>
            <FilterProvider>
              <EventsPage />
            </FilterProvider>
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <AppRoutes />
      </UserProvider>
    </BrowserRouter>
  );
}
