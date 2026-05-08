import React from 'react';

export default function IngredientsList({ ingredients }) {
  if (!ingredients.length) return null;

  return (
    <div className="ingredients-section animate-fade-in mb-5">
      <h3 className="mb-4 d-flex align-items-center gap-2">
        <span>🥗</span> Detected Ingredients
      </h3>
      <div className="d-flex flex-wrap gap-2">
        {ingredients.map((ingredient, index) => (
          <span key={index} className="custom-badge fs-6">
            {ingredient}
          </span>
        ))}
      </div>
    </div>
  );
}
