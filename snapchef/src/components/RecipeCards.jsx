import React from 'react';
import { useNavigate } from 'react-router-dom';

const FOOD_PHOTOS = [
  '1504674900247-0877df9cc836',
  '1546069901-ba9599a7e63c',
  '1567620905732-2d1ec7ab7445',
  '1565299624946-b28f40a0ae38',
  '1540189549336-e6e99eb4b400',
  '1512621776951-a57141f2eefd',
  '1498837167922-ddd27525d352',
  '1473093226795-af9932fe5856',
  '1555939594-58d7cb561bd1',
  '1484723091739-30f6f3a88987',
  '1414235077428-338989a2e8c0',
  '1476224203421-9ac39bcb3b21',
];

export default function RecipeCards({ recipe, index = 0 }) {

  const navigate = useNavigate();

  if (!recipe) return null;

  // Use last 4 chars of _id (the unique part) or fallback to index
  const idSuffix = recipe._id ? recipe._id.slice(-4) : String(index);
  const idSum = idSuffix.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const photoId = FOOD_PHOTOS[idSum % FOOD_PHOTOS.length];

  const imageUrl =
    recipe.imageUrl ||
    `https://images.unsplash.com/photo-${photoId}?w=600&auto=format&fit=crop`;

  return (
    <div className="col">
      <div
        className="card h-100 border-0 shadow-lg"
        style={{
          background: '#181818',
          borderRadius: '22px',
          overflow: 'hidden',
          color: '#fff',
          transition: '0.3s ease'
        }}
      >

        {/* IMAGE */}
        <img
          src={imageUrl}
          alt={recipe.title}
          className="card-img-top"
          style={{
            height: '220px',
            objectFit: 'cover'
          }}
          onError={(e) => {
            e.target.src =
              'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600';
          }}
        />

        {/* BODY */}
        <div className="card-body d-flex flex-column p-4">

          {/* TITLE */}
          <h4
            style={{
              color: '#ffffff',
              fontWeight: '700',
              marginBottom: '12px',
              lineHeight: '1.4'
            }}
          >
            {recipe.title}
          </h4>

          {/* DESCRIPTION */}
          <p
            style={{
              color: '#d0d0d0',
              fontSize: '0.95rem',
              lineHeight: '1.6'
            }}
          >
            {recipe.description
              ? recipe.description.slice(0, 100) + '...'
              : 'Delicious recipe for your meal'}
          </p>

          {/* BADGES */}
          <div className="d-flex flex-wrap gap-2 mb-3">

            {recipe.cuisine && (
              <span className="badge bg-danger px-3 py-2">
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
                    : 'bg-warning text-dark'
                }`}
              >
                {recipe.diet}
              </span>
            )}

          </div>

          {/* INGREDIENT TITLE */}
          <h6
            style={{
              color: '#ffffff',
              fontWeight: '600',
              marginBottom: '14px'
            }}
          >
            Ingredients:
          </h6>

          {/* INGREDIENTS */}
          <div className="d-flex flex-wrap gap-2 mb-4">

            {Array.isArray(recipe.ingredients) &&
            recipe.ingredients.length > 0 ? (

              <>
                {recipe.ingredients
                  .slice(0, 5)
                  .map((item, idx) => (
                    <span
                      key={idx}
                      className="badge rounded-pill"
                      style={{
                        background: '#333',
                        color: '#fff',
                        padding: '10px 14px',
                        fontSize: '0.85rem',
                        border: '1px solid rgba(255,255,255,0.15)'
                      }}
                    >
                      {item}
                    </span>
                  ))}

                {recipe.ingredients.length > 5 && (
                  <span
                    className="badge rounded-pill"
                    style={{
                      background: '#555',
                      color: '#fff',
                      padding: '10px 14px'
                    }}
                  >
                    +{recipe.ingredients.length - 5} more
                  </span>
                )}
              </>

            ) : (
              <span style={{ color: '#aaa' }}>
                No ingredients available
              </span>
            )}

          </div>

          {/* BUTTON */}
          <button
            className="btn btn-outline-danger rounded-pill mt-auto py-2 fw-semibold"
            onClick={() => navigate(`/recipe/${recipe._id}`)}
          >
            View Recipe
          </button>

        </div>
      </div>
    </div>
  );
}