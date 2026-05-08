import React from 'react';
import { Link } from 'react-router-dom';
export default function RecipeCards({ recipes }) {
  if (!recipes || recipes.length === 0) return null;
  return (
    <div className="recipes-section animate-fade-in pb-5">
      <h3 className="mb-4 d-flex align-items-center gap-2">
        <span></span> Suggested Recipes
      </h3>
      <div className="row g-4">
        {recipes.map((recipe, index) => (
          <div key={recipe._id || index} className="col-md-6 col-lg-4">
            <div className="card recipe-card h-100 shadow-sm">
              {/* IMAGE SECTION */}
              <div className="position-relative">
                <img
  src={recipe.imageUrl || "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop"}
  alt={recipe.recipeName}
  className="card-img-top"
  style={{ height: "180px", objectFit: "cover" }}
  onError={(e) => {
    e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop";
  }}
/>
              </div>
              {/*  CONTENT */}
              <div className="card-body d-flex flex-column">
                <h5 className="card-title fw-bold">
                  {recipe.recipeName}
                </h5>
                <p className="card-text text-muted mb-2">
                  <small>Ingredients:</small>
                </p>
                {/*  INGREDIENT LIST */}
                <div className="d-flex flex-wrap gap-1 mb-3">
                  {recipe.ingredients?.slice(0, 5).map((ing, i) => {
                    const cleanIng = ing
                      .replace(/[0-9/.-]+/g, "")
                      .replace(/cups?|tablespoons?|teaspoons?|tbsp|tsp|ounces?|inch/gi, "")
                      .replace(/\s+/g, " ")
                      .trim();
                    return (
                      <span key={i} className="badge bg-light text-dark border">
                        {cleanIng}
                      </span>
                    );
                  })}
                  {recipe.ingredients?.length > 5 && (
                    <span className="text-muted small align-self-center ms-1">
                      + more...
                    </span>
                  )}
                </div>
                {/*  BUTTON */}
                <Link
                  to={`/recipe/${recipe._id}`}
                  className="btn btn-outline-danger w-100 rounded-pill mt-auto"
                >
                  View Recipe
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}