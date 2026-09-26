import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600';

export default function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(FALLBACK_IMAGE);
  const [aiInstructions, setAiInstructions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch recipe
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/recipes/${id}`);
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

  // Fetch Pexels image based on recipe title
  useEffect(() => {
    if (!recipe) return;
    if (recipe.imageUrl) {
      setImageUrl(recipe.imageUrl);
      return;
    }
    axios
      .get(`${process.env.REACT_APP_API_URL}/api/image/${encodeURIComponent(recipe.title)}`)
      .then(res => { if (res.data.imageUrl) setImageUrl(res.data.imageUrl); })
      .catch(() => {});
  }, [recipe]);

  // Fetch AI instructions if none in DB
  useEffect(() => {
    if (!recipe) return;

    let steps = [];
    if (recipe.instructions) {
      if (Array.isArray(recipe.instructions)) {
        steps = recipe.instructions.flatMap(item =>
          typeof item === 'string'
            ? item.split(/[|\n]/).map(s => s.trim()).filter(Boolean)
            : []
        );
      } else if (typeof recipe.instructions === 'string') {
        steps = recipe.instructions.split(/[|\n]/).map(s => s.trim()).filter(Boolean);
      }
    }

    if (steps.length === 0) {
      const fetchAiInstructions = async () => {
        setAiLoading(true);
        try {
          const response = await axios.post(`${process.env.REACT_APP_API_URL}/api/ai/dish`, {
            dishName: recipe.title
          });
          setAiInstructions(response.data.text);
        } catch (err) {
          console.error('AI Instructions error:', err);
        } finally {
          setAiLoading(false);
        }
      };
      fetchAiInstructions();
    }
  }, [recipe]);

  if (loading) {
    return (
      <div className="container text-center py-5">
        <div className="spinner-border text-danger" role="status">
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

  // Parse instructions
  let instructionSteps = [];
  if (recipe.instructions) {
    if (Array.isArray(recipe.instructions)) {
      instructionSteps = recipe.instructions.flatMap(item =>
        typeof item === 'string'
          ? item.split(/[|\n]/).map(s => s.trim()).filter(Boolean)
          : []
      );
    } else if (typeof recipe.instructions === 'string') {
      instructionSteps = recipe.instructions.split(/[|\n]/).map(s => s.trim()).filter(Boolean);
    }
  }

  const youtubeSearchUrl =
    `https://www.youtube.com/results?search_query=` +
    encodeURIComponent(`${recipe.title} recipe`);

  return (
    <div className="container py-5" style={{ minHeight: '100vh', color: 'white' }}>

      <button
        className="btn btn-outline-light mb-4 rounded-pill px-4"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="row g-5 align-items-start">

        {/* LEFT */}
        <div className="col-lg-5">
          <div style={{ overflow: 'hidden', borderRadius: '20px' }}>
            <img
              src={imageUrl}
              alt={recipe.title}
              className="img-fluid shadow-lg w-100"
              style={{ height: '350px', objectFit: 'cover', transition: '0.4s' }}
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
            />
          </div>

          <div className="d-flex flex-wrap gap-2 mt-4">
            {recipe.cuisine && <span className="badge bg-primary px-3 py-2">🌍 {recipe.cuisine}</span>}
            {recipe.course && <span className="badge bg-warning text-dark px-3 py-2">🍽️ {recipe.course}</span>}
            {recipe.diet && (
              <span className={`badge px-3 py-2 ${recipe.diet.toLowerCase().includes('vegetarian') ? 'bg-success' : 'bg-danger'}`}>
                {recipe.diet}
              </span>
            )}
            {recipe.prep_time && <span className="badge bg-info text-dark px-3 py-2">⏱️ Prep: {recipe.prep_time}</span>}
            {recipe.cook_time && <span className="badge bg-secondary px-3 py-2">🔥 Cook: {recipe.cook_time}</span>}
            {recipe.rating > 0 && <span className="badge bg-warning text-dark px-3 py-2">⭐ {Number(recipe.rating).toFixed(1)}</span>}
          </div>

          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-danger w-100 mt-4 rounded-pill fw-bold"
          >
            ▶ Watch Recipe Video
          </a>
        </div>

        {/* RIGHT */}
        <div className="col-lg-7">
          <h1 className="fw-bold mb-3" style={{ fontSize: '2.4rem' }}>{recipe.title}</h1>

          {recipe.description && (
            <p style={{ color: '#d1d1d1', lineHeight: '1.8', fontSize: '1.05rem' }}>
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
                    style={{ background: '#2d2d2d', color: '#fff', padding: '10px 16px', fontSize: '0.95rem' }}
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

            {aiLoading ? (
              <div className="d-flex align-items-center gap-3">
                <div className="spinner-border text-danger spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <span style={{ color: '#aaa' }}>Generating AI recipe instructions...</span>
              </div>
            ) : aiInstructions ? (
              <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '12px', color: '#f1f1f1', lineHeight: '1.8' }}>
                <ReactMarkdown>{aiInstructions}</ReactMarkdown>
              </div>
            ) : (
              instructionSteps.map((step, index) => (
                <div key={index} className="d-flex align-items-start gap-3 mb-4">
                  <div
                    className="d-flex align-items-center justify-content-center fw-bold"
                    style={{ width: '36px', height: '36px', minWidth: '36px', borderRadius: '50%', background: '#ff4d4d', color: '#fff' }}
                  >
                    {index + 1}
                  </div>
                  <div style={{ color: '#f1f1f1', lineHeight: '1.8', fontSize: '1rem' }}>
                    {step}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}