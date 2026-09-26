import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600';

export default function RecipeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(FALLBACK_IMAGE);

  const [aiInstructions, setAiInstructions] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // ==========================================
  // FETCH RECIPE
  // ==========================================
  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/recipes/${id}`
        );

        console.log('RECIPE FROM API:', response.data);
        console.log('INSTRUCTIONS FROM API:', response.data?.instructions);

        setRecipe(response.data);
      } catch (err) {
        console.error('Recipe fetch error:', err);
        setError('Failed to load recipe details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [id]);

  // ==========================================
  // FETCH RECIPE IMAGE
  // ==========================================
  useEffect(() => {
    if (!recipe) return;

    if (recipe.imageUrl) {
      setImageUrl(recipe.imageUrl);
      return;
    }

    axios
      .get(
        `${process.env.REACT_APP_API_URL}/api/image/${encodeURIComponent(
          recipe.title
        )}`
      )
      .then((res) => {
        if (res.data?.imageUrl) {
          setImageUrl(res.data.imageUrl);
        }
      })
      .catch((err) => {
        console.error('Image fetch error:', err);
      });
  }, [recipe]);

  // ==========================================
  // PARSE DATABASE INSTRUCTIONS
  // ==========================================
  const getInstructionSteps = (instructions) => {
    if (!instructions) {
      return [];
    }

    if (Array.isArray(instructions)) {
      return instructions.flatMap((item) => {
        if (typeof item !== 'string') {
          return [];
        }

        return item
          .split(/[|\n]/)
          .map((step) => step.trim())
          .filter(Boolean);
      });
    }

    if (typeof instructions === 'string') {
      return instructions
        .split(/[|\n]/)
        .map((step) => step.trim())
        .filter(Boolean);
    }

    return [];
  };

  // ==========================================
  // FETCH AI INSTRUCTIONS IF DB IS EMPTY
  // ==========================================
  useEffect(() => {
    if (!recipe) return;

    const steps = getInstructionSteps(recipe.instructions);

    console.log('PARSED INSTRUCTION STEPS:', steps);

    // Database already has instructions
    if (steps.length > 0) {
      console.log('Using instructions from database.');
      return;
    }

    // Database has no instructions -> use AI
    const fetchAiInstructions = async () => {
      setAiLoading(true);

      try {
        console.log(
          'No database instructions found. Requesting AI instructions for:',
          recipe.title
        );

        const response = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/ai/dish`,
          {
            dishName: recipe.title,
          }
        );

        console.log('AI INSTRUCTIONS RESPONSE:', response.data);

        const aiText = response.data?.text?.trim();

        if (aiText) {
          setAiInstructions(aiText);
        } else {
          console.error(
            'AI returned empty instructions:',
            response.data
          );
          setAiInstructions(null);
        }
      } catch (err) {
        console.error('AI Instructions error:', err);

        if (err.response) {
          console.error('AI Error Status:', err.response.status);
          console.error('AI Error Data:', err.response.data);
        }

        setAiInstructions(null);
      } finally {
        setAiLoading(false);
      }
    };

    fetchAiInstructions();
  }, [recipe]);

  // ==========================================
  // LOADING
  // ==========================================
  if (loading) {
    return (
      <div className="container text-center py-5">
        <div
          className="spinner-border text-danger"
          role="status"
        >
          <span className="visually-hidden">
            Loading...
          </span>
        </div>
      </div>
    );
  }

  // ==========================================
  // ERROR / RECIPE NOT FOUND
  // ==========================================
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

  // ==========================================
  // PARSE INSTRUCTIONS
  // ==========================================
  const instructionSteps = getInstructionSteps(
    recipe.instructions
  );

  // ==========================================
  // YOUTUBE SEARCH
  // ==========================================
  const youtubeSearchUrl =
    `https://www.youtube.com/results?search_query=` +
    encodeURIComponent(`${recipe.title} recipe`);

  // ==========================================
  // UI
  // ==========================================
  return (
    <div
      className="container py-5"
      style={{
        minHeight: '100vh',
        color: 'white',
      }}
    >
      {/* BACK BUTTON */}
      <button
        className="btn btn-outline-light mb-4 rounded-pill px-4"
        onClick={() => navigate(-1)}
      >
        ← Back
      </button>

      <div className="row g-5 align-items-start">

        {/* =====================================
            LEFT SIDE
        ====================================== */}
        <div className="col-lg-5">

          {/* RECIPE IMAGE */}
          <div
            style={{
              overflow: 'hidden',
              borderRadius: '20px',
            }}
          >
            <img
              src={imageUrl}
              alt={recipe.title}
              className="img-fluid shadow-lg w-100"
              style={{
                height: '350px',
                objectFit: 'cover',
                transition: '0.4s',
              }}
              onError={(e) => {
                e.target.src = FALLBACK_IMAGE;
              }}
            />
          </div>

          {/* RECIPE BADGES */}
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
                  recipe.diet
                    .toLowerCase()
                    .includes('vegetarian')
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

          {/* YOUTUBE BUTTON */}
          <a
            href={youtubeSearchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-danger w-100 mt-4 rounded-pill fw-bold"
          >
            ▶ Watch Recipe Video
          </a>
        </div>

        {/* =====================================
            RIGHT SIDE
        ====================================== */}
        <div className="col-lg-7">

          {/* TITLE */}
          <h1
            className="fw-bold mb-3"
            style={{
              fontSize: '2.4rem',
            }}
          >
            {recipe.title}
          </h1>

          {/* DESCRIPTION */}
          {recipe.description && (
            <p
              style={{
                color: '#d1d1d1',
                lineHeight: '1.8',
                fontSize: '1.05rem',
              }}
            >
              {recipe.description}
            </p>
          )}

          {/* =====================================
              INGREDIENTS
          ====================================== */}
          <div className="mt-5">

            <h3 className="fw-bold mb-4">
              🛒 Ingredients
            </h3>

            {Array.isArray(recipe.ingredients) &&
            recipe.ingredients.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">

                {recipe.ingredients.map((item, index) => (
                  <span
                    key={index}
                    className="badge rounded-pill"
                    style={{
                      background: '#2d2d2d',
                      color: '#fff',
                      padding: '10px 16px',
                      fontSize: '0.95rem',
                    }}
                  >
                    {item}
                  </span>
                ))}

              </div>
            ) : (
              <p style={{ color: '#aaa' }}>
                No ingredients available.
              </p>
            )}

          </div>

          {/* =====================================
              INSTRUCTIONS
          ====================================== */}
          <div className="mt-5">

            <h3 className="fw-bold mb-4">
              📋 Instructions
            </h3>

            {/* AI LOADING */}
            {aiLoading ? (
              <div className="d-flex align-items-center gap-3">

                <div
                  className="spinner-border text-danger spinner-border-sm"
                  role="status"
                >
                  <span className="visually-hidden">
                    Loading...
                  </span>
                </div>

                <span style={{ color: '#aaa' }}>
                  Generating AI recipe instructions...
                </span>

              </div>

            ) : aiInstructions ? (

              /* AI INSTRUCTIONS */
              <div
                style={{
                  background: '#1a1a1a',
                  padding: '20px',
                  borderRadius: '12px',
                  color: '#f1f1f1',
                  lineHeight: '1.8',
                }}
              >
                <ReactMarkdown>
                  {aiInstructions}
                </ReactMarkdown>
              </div>

            ) : instructionSteps.length > 0 ? (

              /* DATABASE INSTRUCTIONS */
              instructionSteps.map((step, index) => (
                <div
                  key={index}
                  className="d-flex align-items-start gap-3 mb-4"
                >

                  {/* STEP NUMBER */}
                  <div
                    className="d-flex align-items-center justify-content-center fw-bold"
                    style={{
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      borderRadius: '50%',
                      background: '#ff4d4d',
                      color: '#fff',
                    }}
                  >
                    {index + 1}
                  </div>

                  {/* STEP TEXT */}
                  <div
                    style={{
                      color: '#f1f1f1',
                      lineHeight: '1.8',
                      fontSize: '1rem',
                    }}
                  >
                    {step}
                  </div>

                </div>
              ))

            ) : (

              /* NOTHING AVAILABLE */
              <div
                style={{
                  background: '#1a1a1a',
                  padding: '20px',
                  borderRadius: '12px',
                  color: '#aaa',
                }}
              >
                No instructions available for this recipe.
              </div>

            )}

          </div>

        </div>
      </div>
    </div>
  );
}