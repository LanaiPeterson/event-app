import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../components/auth/LoginForm";
import SignupForm from "../components/auth/SignupForm";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

export default function LoginPage() {
  const [view, setView] = useState("login"); // "login" | "signup" | "forgot"
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo-icon">📍</span>
          <span className="auth-logo-text">Events Near Me</span>
        </div>

        {view === "login" && (
          <LoginForm
            onSwitch={() => setView("signup")}
            onForgot={() => setView("forgot")}
          />
        )}
        {view === "signup" && (
          <SignupForm onSwitch={() => setView("login")} />
        )}
        {view === "forgot" && (
          <ForgotPasswordForm onBack={() => setView("login")} />
        )}

        {/* Host / Create an Event CTA */}
        {view !== "forgot" && (
          <div className="auth-host-banner">
            <span className="auth-host-banner__icon">🎪</span>
            <div>
              <p className="auth-host-banner__title">Host an Event</p>
              <p className="auth-host-banner__sub">
                Create a public or private event and invite your contacts.
              </p>
            </div>
            <button
              className="auth-host-banner__btn"
              onClick={() => navigate("/create-event")}
            >
              Create →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
