import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/recipes/${id}`
        );
        console.log('Recipe Data:', response.data);
        setRecipe(response.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load recipe details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  // Loading State
  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  // Error State
  if (error || !recipe) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">
          {error || 'Recipe not found'}
        </div>
        <button
          className="btn btn-secondary mt-3"
          onClick={() => navigate('/')}
        >
          Back to Home
        </button>
      </div>
    );
  }

  // -----------------------------
  // FIXED: UNIQUE IMAGE URL
  // Uses recipe.title to ensure different images per recipe
  // -----------------------------
  const imageUrl =
    recipe.imageUrl ||
    (recipe.title
      ? `https://source.unsplash.com/600x400/?${encodeURIComponent(
          recipe.title + ' food'
        )}`
      : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600');

  // -----------------------------
  // FIXED: ROBUST INSTRUCTION PARSING
  // Handles string (with | or newline), array, null/undefined
  // -----------------------------
  let instructionSteps = [];

  if (recipe.instructions) {
    if (Array.isArray(recipe.instructions)) {
      // Flatten and split each element if it contains separators
      instructionSteps = recipe.instructions.flatMap(item => {
        if (typeof item === 'string') {
          return item.split(/[|\n]/).map(s => s.trim()).filter(Boolean);
        }
        return [];
      });
    } else if (typeof recipe.instructions === 'string') {
      instructionSteps = recipe.instructions
        .split(/[|\n]/)
        .map(step => step.trim())
        .filter(Boolean);
    }
  }

  // Fallback if no instructions found
  if (instructionSteps.length === 0) {
    instructionSteps = ['No instructions provided for this recipe.'];
  }

  const youtubeSearchUrl =
    `https://www.youtube.com/results?search_query=` +
    encodeURIComponent(`${recipe.title} recipe`);

  return (
    <div
      className="container py-5"
      style={{
        minHeight: '100vh',
        color: 'white'
      }}
    >
      {/* Back Button */}
      <button
        className="btn btn-outline-light mb-4 rounded-pill px-4"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="row g-5 align-items-start">
        {/* LEFT SIDE */}
        <div className="col-lg-5">
          {/* Recipe Image */}
          <div
            style={{
              overflow: 'hidden',
              borderRadius: '20px'
            }}
          >
            <img
              src={imageUrl}
              alt={recipe.title}
              className="img-fluid shadow-lg w-100"
              style={{
                height: '350px',
                objectFit: 'cover',
                transition: '0.4s'
              }}
              onError={(e) => {
                e.target.src =
                  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600';
              }}
            />
          </div>

          {/* Badges */}
          <div className="d-flex flex-wrap gap-2 mt-4">
            {recipe.cuisine && (
              <span className="badge bg-primary px-3 py-2">
                🌍 {recipe.cuisine}
              </span>
            )}
            {recipe.course && (
              <span className="badge bg-warning text-dark px-3 py-2">
                🍽️ {recipe.course}
              </span>
            )}
            {recipe.diet && (
              <span
                className={`badge px-3 py-2 ${
                  recipe.diet.toLowerCase().includes('vegetarian')
                    ? 'bg-success'
                    : 'bg-danger'
                }`}
              >
                {recipe.diet}
              </span>
            )}
            {recipe.prep_time && (
              <span className="badge bg-info text-dark px-3 py-2">
                ⏱️ Prep: {recipe.prep_time}
              </span>
            )}
            {recipe.cook_time && (
              <span className="badge bg-secondary px-3 py-2">
                🔥 Cook: {recipe.cook_time}
              </span>
            )}
            {recipe.rating > 0 && (
              <span className="badge bg-warning text-dark px-3 py-2">
                ⭐ {Number(recipe.rating).toFixed(1)}
              </span>
            )}
          </div>

          {/* YouTube Button */}
          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-danger w-100 mt-4 rounded-pill fw-bold"
          >
            ▶ Watch Recipe Video
          </a>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-lg-7">
          {/* Title */}
          <h1
            className="fw-bold mb-3"
            style={{
              fontSize: '2.4rem'
            }}
          >
            {recipe.title}
          </h1>

          {/* Description */}
          {recipe.description && (
            <p
              style={{
                color: '#d1d1d1',
                lineHeight: '1.8',
                fontSize: '1.05rem'
              }}
            >
              {recipe.description}
            </p>
          )}

          {/* Ingredients */}
          <div className="mt-5">
            <h3 className="fw-bold mb-4">🛒 Ingredients</h3>
            {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {recipe.ingredients.map((item, index) => (
                  <span
                    key={index}
                    className="badge rounded-pill"
                    style={{
                      background: '#2d2d2d',
                      color: '#fff',
                      padding: '10px 16px',
                      fontSize: '0.95rem'
                    }}
                  >
                    {item}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#aaa' }}>No ingredients available.</p>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-5">
            <h3 className="fw-bold mb-4">📋 Instructions</h3>

            {/* DEBUG BUTTON - click to see raw instructions in console */}
            <button
              className="btn btn-sm btn-outline-secondary mb-3"
              onClick={() => console.log('Raw instructions:', recipe.instructions)}
            >
              🐞 Debug Instructions
            </button>

            {instructionSteps.map((step, index) => (
              <div
                key={index}
                className="d-flex align-items-start gap-3 mb-4"
              >
                {/* Step Number */}
                <div
                  className="d-flex align-items-center justify-content-center fw-bold"
                  style={{
                    width: '36px',
                    height: '36px',
                    minWidth: '36px',
                    borderRadius: '50%',
                    background: '#ff4d4d',
                    color: '#fff'
                  }}
                >
                  {index + 1}
                </div>

                {/* Step Text */}
                <div
                  style={{
                    color: '#f1f1f1',
                    lineHeight: '1.8',
                    fontSize: '1rem'
                  }}
                >
                  {step}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}