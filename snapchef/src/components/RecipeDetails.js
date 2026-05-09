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
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/recipes/${id}`);
        setRecipe(response.data);
      } catch (err) {
        console.error('Error fetching recipe details:', err);
        setError('Failed to load recipe details.');
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [id]);

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">{error || 'Recipe not found'}</div>
        <button className="btn btn-secondary mt-3" onClick={() => navigate('/')}>
          Back to Home
        </button>
      </div>
    );
  }

  const recipeTitle = recipe.title || 'Recipe';
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipeTitle + ' recipe')}`;

  // Handle instructions — could be array or pipe-separated string
  let instructionSteps = [];
  if (Array.isArray(recipe.instructions) && recipe.instructions.length > 0) {
    instructionSteps = recipe.instructions;
  } else if (typeof recipe.instructions === 'string' && recipe.instructions.length > 0) {
    instructionSteps = recipe.instructions.split('|').map(s => s.trim()).filter(Boolean);
  }

  return (
    <div className="container py-5 animate-fade-in">
      {/* Back Button */}
      <button
        className="btn btn-outline-secondary mb-4 rounded-pill px-4"
        onClick={() => navigate(-1)}
      >
        ← Back to Results
      </button>

      <div className="row g-4">
        {/* LEFT: Image + Badges + YouTube */}
        <div className="col-md-5">
          <img
            src={recipe.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop"}
            alt={recipeTitle}
            className="img-fluid rounded shadow w-100"
            style={{ objectFit: 'cover', maxHeight: '300px' }}
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop";
            }}
          />

          <div className="mt-3 d-flex flex-wrap gap-2">
            {recipe.cuisine && (
              <span className="badge bg-secondary px-3 py-2">🌍 {recipe.cuisine}</span>
            )}
            {recipe.course && (
              <span className="badge bg-secondary px-3 py-2">🍽️ {recipe.course}</span>
            )}
            {recipe.diet && (
              <span className={`badge px-3 py-2 ${recipe.diet.toLowerCase().includes('vegetarian') ? 'bg-success' : 'bg-danger'}`}>
                {recipe.diet.toLowerCase().includes('vegetarian') ? '🥦' : '🍗'} {recipe.diet}
              </span>
            )}
            {recipe.prep_time && (
              <span className="badge bg-info text-dark px-3 py-2">⏱️ Prep: {recipe.prep_time}</span>
            )}
            {recipe.cook_time && (
              <span className="badge bg-info text-dark px-3 py-2">🔥 Cook: {recipe.cook_time}</span>
            )}
            {recipe.rating > 0 && (
              <span className="badge bg-warning text-dark px-3 py-2">⭐ {Number(recipe.rating).toFixed(1)}</span>
            )}
          </div>

          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-danger w-100 mt-3 rounded-pill fw-semibold"
          >
            ▶ Watch Recipe Video on YouTube
          </a>
        </div>

        {/* RIGHT: Title + Description + Ingredients + Instructions */}
        <div className="col-md-7">
          <h2 className="fw-bold mb-3">{recipeTitle}</h2>

          {/* Description — fixed visibility */}
          {recipe.description && (
            <p style={{ color: '#ccc', lineHeight: '1.6', marginBottom: '1.5rem' }}>
              {recipe.description}
            </p>
          )}

          {/* Ingredients */}
          <div className="mb-4">
            <h4 className="fw-semibold mb-3">🛒 Ingredients</h4>
            {Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {recipe.ingredients.map((ing, index) => (
                  <span
                    key={index}
                    style={{
                      fontSize: '1rem',
                      color: '#fff',
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                      paddingBottom: '3px'
                    }}
                  >
                    • {ing}
                  </span>
                ))}
              </div>
            ) : (
              <p style={{ color: '#aaa' }}>No ingredients listed.</p>
            )}
          </div>

          {/* Instructions */}
          <div>
            <h4 className="fw-semibold mb-3">📋 Instructions</h4>
            {instructionSteps.length > 0 ? (
              instructionSteps.map((step, index) => (
                <div key={index} className="d-flex gap-3 mb-3 align-items-start">
                  <span
                    className="fw-bold text-white rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                    style={{
                      width: '28px',
                      height: '28px',
                      minWidth: '28px',
                      background: '#e74c3c',
                      fontSize: '0.8rem'
                    }}
                  >
                    {index + 1}
                  </span>
                  <p className="mb-0 lh-lg" style={{ color: '#fff' }}>{step}</p>
                </div>
              ))
            ) : (
              <p style={{ color: '#aaa' }}>No instructions available.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}