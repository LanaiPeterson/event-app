import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import CategorySelector from "../components/categories/CategorySelector";
import { useUser } from "../contexts/UserContext";

export default function CategoryPage() {
  const { user, updateCategories } = useUser();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(user?.categories || []);

  function handleContinue() {
    updateCategories(selected);
    navigate("/events");
  }

  function handleSkip() {
    navigate("/events");
  }

  return (
    <div className="category-page">
      <div className="category-card">
        <h2>What are you into?</h2>
        <p className="category-sub">
          Pick categories to personalize your event feed. You can change this any time.
        </p>

        <CategorySelector selected={selected} onChange={setSelected} />

        <div className="category-actions">
          <button className="btn-primary" onClick={handleContinue} disabled={selected.length === 0}>
            Continue {selected.length > 0 && `(${selected.length} selected)`}
          </button>
          <button className="link-btn" onClick={handleSkip}>
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
