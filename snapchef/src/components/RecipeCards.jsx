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
              <div className="position-relative overflow-hidden">
                <img
                  src={recipe.imageUrl || `https://images.unsplash.com/photo-${[
                    '1504674900247-0877df9cc836',
                    '1555939594-58d7cb561ad1',
                    '1567620905732-2d1ec7ab7445',
                    '1476224203421-9ac39bcb3327',
                    '1414235077428-338989a2e8c0',
                    '1484723091739-30a097e8f929',
                    '1546069901-ba9599a7e63c',
                    '1604908176997-4315fbd6f6e4'
                  ][((recipe.recipeName || '').length + index) % 8]}?w=600&h=400&fit=crop`}
                  alt={recipe.recipeName}
                  className="card-img-top recipe-card-img"
                  style={{ height: "200px", objectFit: "cover", transition: "transform 0.5s ease" }}
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop";
                  }}
                />
                <div className="position-absolute bottom-0 w-100" style={{ height: "50%", background: "linear-gradient(to top, rgba(0,0,0,0.6), transparent)" }}></div>
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
                <div className="d-flex flex-wrap gap-2 mb-3 mt-2">
                  {recipe.ingredients?.slice(0, 5).map((ing, i) => {
                    const cleanIng = ing
                      .replace(/[0-9/.-]+/g, "")
                      .replace(/cups?|tablespoons?|teaspoons?|tbsp|tsp|ounces?|inch/gi, "")
                      .replace(/\s+/g, " ")
                      .trim();
                    return (
                      <span key={i} className="badge custom-ing-badge border">
                        {cleanIng}
                      </span>
                    );
                  })}
                  {recipe.ingredients?.length > 5 && (
                    <span className="badge bg-secondary opacity-75 align-self-center ms-1">
                      +{recipe.ingredients.length - 5} more
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