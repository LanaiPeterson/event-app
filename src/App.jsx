import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import { FilterProvider } from "./contexts/FilterContext";
import { SavedEventsProvider } from "./contexts/SavedEventsContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import LoginPage from "./pages/LoginPage";
import CategoryPage from "./pages/CategoryPage";
import EventsPage from "./pages/EventsPage";
import SavedEventsPage from "./pages/SavedEventsPage";
import PlacesPage from "./pages/PlacesPage";
import CreateEventPage from "./pages/CreateEventPage";
import OrganizerPage from "./pages/OrganizerPage";
import ItineraryPage from "./pages/ItineraryPage";
import AIChatBox from "./components/chat/AIChatBox";

function PrivateRoute({ children }) {
  const { user } = useUser();
  return user ? children : <Navigate to="/login" replace />;
}

function AuthRoute({ children }) {
  const { user } = useUser();
  if (!user) return children;
  if (!user.categories || user.categories.length === 0) {
    return <Navigate to="/categories" replace />;
  }
  if (user.role === "planner") {
    return <Navigate to="/organizer" replace />;
  }
  return <Navigate to="/events" replace />;
}

function AppLayout() {
  const { user } = useUser();
  return (
    <>
      <AppRoutes />
      {user && <AIChatBox />}
    </>
  );
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
      <Route
        path="/saved-events"
        element={
          <PrivateRoute>
            <SavedEventsPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/places"
        element={
          <PrivateRoute>
            <PlacesPage />
          </PrivateRoute>
        }
      />
      <Route path="/create-event" element={<CreateEventPage />} />
      <Route
        path="/itinerary"
        element={
          <PrivateRoute>
            <ItineraryPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/organizer"
        element={
          <PrivateRoute>
            <OrganizerPage />
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
        <SavedEventsProvider>
          <NotificationProvider>
            <AppLayout />
          </NotificationProvider>
        </SavedEventsProvider>
      </UserProvider>
    </BrowserRouter>
  );
}
