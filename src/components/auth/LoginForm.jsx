import React, { useState } from "react";
import { login } from "../../api/auth";
import { useUser } from "../../contexts/UserContext";

export default function LoginForm({ onSwitch }) {
  const { login: setUser } = useUser();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = login(form);
      setUser(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h2>Welcome back</h2>
      <p className="auth-sub">Sign in to discover events near you</p>

      {error && <div className="auth-error">{error}</div>}

      <label>Email</label>
      <input
        type="email"
        required
        placeholder="you@email.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />

      <label>Password</label>
      <input
        type="password"
        required
        placeholder="••••••••"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
      />

      <button className="btn-primary" type="submit" disabled={loading}>
        {loading ? "Signing in..." : "Sign In"}
      </button>

      <p className="auth-switch">
        Don't have an account?{" "}
        <button type="button" className="link-btn" onClick={onSwitch}>
          Sign up
        </button>
      </p>
    </form>
  );
}
