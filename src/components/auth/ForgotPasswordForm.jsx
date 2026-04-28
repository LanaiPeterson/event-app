import React, { useState } from "react";
import { forgotPassword } from "../../api/auth";

export default function ForgotPasswordForm({ onBack }) {
  const [step, setStep] = useState("email"); // "email" | "reset" | "done"
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleEmailSubmit(e) {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Please enter your email."); return; }
    // In a real app this would send a reset email. Here we go straight to reset.
    setStep("reset");
  }

  async function handleReset(e) {
    e.preventDefault();
    setError("");
    if (newPassword !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      forgotPassword({ email, newPassword });
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (step === "done") {
    return (
      <div className="auth-form">
        <div className="auth-success">
          ✅ Password updated! You can now sign in with your new password.
        </div>
        <button className="btn-primary" style={{ marginTop: 16 }} onClick={onBack}>
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="auth-form">
      <h2>Reset Password</h2>
      <p className="auth-sub">
        {step === "email"
          ? "Enter the email address on your account."
          : "Choose a new password for your account."}
      </p>

      {error && <div className="auth-error">{error}</div>}

      {step === "email" ? (
        <form onSubmit={handleEmailSubmit}>
          <label>Email</label>
          <input
            type="email"
            required
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn-primary" type="submit" style={{ marginTop: 20 }}>
            Continue
          </button>
        </form>
      ) : (
        <form onSubmit={handleReset}>
          <label>New Password</label>
          <input
            type="password"
            required
            placeholder="Min 6 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <label>Confirm New Password</label>
          <input
            type="password"
            required
            placeholder="Repeat new password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <button className="btn-primary" type="submit" disabled={loading} style={{ marginTop: 20 }}>
            {loading ? "Saving..." : "Set New Password"}
          </button>
        </form>
      )}

      <p className="auth-switch" style={{ marginTop: 14 }}>
        <button type="button" className="link-btn" onClick={onBack}>
          ← Back to Sign In
        </button>
      </p>
    </div>
  );
}
