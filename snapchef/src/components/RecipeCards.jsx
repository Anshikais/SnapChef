<div
  className="card h-100 border-0 shadow-lg"
  style={{
    background: '#161616',
    borderRadius: '20px',
    overflow: 'hidden',
    transition: '0.3s',
    color: 'white'
  }}
>

  {/* IMAGE */}
  <img
    src={`https://source.unsplash.com/600x400/?${encodeURIComponent(
      recipe.title || recipe.cuisine || 'food'
    )}`}
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

  {/* CARD BODY */}
  <div className="card-body d-flex flex-column p-4">

    {/* RECIPE NAME */}
    <h4
      className="fw-bold mb-3"
      style={{
        color: '#ffffff',
        lineHeight: '1.4'
      }}
    >
      {recipe.title}
    </h4>

    {/* DESCRIPTION */}
    <p
      style={{
        color: '#cfcfcf',
        fontSize: '0.95rem',
        lineHeight: '1.6'
      }}
    >
      {recipe.description
        ? recipe.description.slice(0, 100) + '...'
        : 'Delicious recipe for your meal.'}
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
      className="fw-semibold mb-3"
      style={{
        color: '#ffffff',
        fontSize: '1rem'
      }}
    >
      Ingredients:
    </h6>

    {/* INGREDIENTS */}
    <div className="d-flex flex-wrap gap-2 mb-4">

      {Array.isArray(recipe.ingredients) &&
      recipe.ingredients.length > 0 ? (

        <>
          {recipe.ingredients.slice(0, 5).map((item, index) => (

            <span
              key={index}
              className="badge rounded-pill"
              style={{
                background: '#2f2f2f',
                color: '#ffffff',
                padding: '10px 14px',
                fontWeight: '500',
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
      className="btn btn-outline-danger mt-auto rounded-pill py-2 fw-semibold"
      onClick={() => navigate(`/recipe/${recipe._id}`)}
    >
      View Recipe
    </button>

  </div>
</div>