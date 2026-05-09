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

  // Use recipe.title (matches DB field)
  const recipeTitle = recipe.title || 'Recipe';
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(recipeTitle + ' recipe')}`;

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
        <div className="col-md-5">
          {/* Recipe Image */}
          <img
            src={recipe.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop"}
            alt={recipeTitle}
            className="img-fluid rounded shadow w-100"
            style={{ objectFit: 'cover', maxHeight: '300px' }}
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop";
            }}
          />

          {/* Recipe Meta Badges */}
          <div className="mt-3 d-flex flex-wrap gap-2">
            {recipe.cuisine && (
              <span className="badge bg-secondary px-3 py-2">
                🌍 {recipe.cuisine}
              </span>
            )}
            {recipe.course && (
              <span className="badge bg-secondary px-3 py-2">
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
                {recipe.diet.toLowerCase().includes('vegetarian') ? '🥦' : '🍗'} {recipe.diet}
              </span>
            )}
            {recipe.prep_time && (
              <span className="badge bg-info text-dark px-3 py-2">
                ⏱️ Prep: {recipe.prep_time}
              </span>
            )}
            {recipe.cook_time && (
              <span className="badge bg-info text-dark px-3 py-2">
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
            className="btn btn-danger w-100 mt-3 rounded-pill fw-semibold"
          >
            ▶ Watch Recipe Video on YouTube
          </a>
        </div>

        {/* RIGHT: Title + Ingredients + Instructions */}
        <div className="col-md-7">

          {/* Recipe Title */}
          <h2 className="fw-bold mb-4">{recipeTitle}</h2>

          {/* Description */}
          {recipe.description && (
            <p className="text-muted mb-4">{recipe.description}</p>
          )}

          {/* Ingredients */}
          <div className="mb-4">
            <h4 className="fw-semibold mb-3">🛒 Ingredients</h4>
            <div className="d-flex flex-wrap gap-2">
              {Array.isArray(recipe.ingredients) && recipe.ingredients.map((ing, index) => (
                <span
                  key={index}
                  style={{
                    fontSize: '1.1rem',
                    color: 'inherit',
                    borderBottom: '1px solid rgba(128,128,128,0.3)',
                    paddingBottom: '3px'
                  }}
                >
                  • {ing}
                </span>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="fw-semibold mb-3">📋 Instructions</h4>
            <div>
              {Array.isArray(recipe.instructions)
                ? recipe.instructions.map((step, index) => (
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
                      <p className="mb-0 lh-lg">{step}</p>
                    </div>
                  ))
                : <p>{recipe.instructions}</p>
              }
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
