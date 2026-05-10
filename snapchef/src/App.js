import React, { useState } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ImageUploader from './components/ImageUploader';
import IngredientsList from './components/IngredientsList';
import RecipeCards from './components/RecipeCards';
import RecipeDetails from './components/RecipeDetails';
import ProtectedRoute from './components/ProtectedRoute';
import SignInPage from './pages/SignInPage';
import DietAI from './pages/DietAI';
import DishAI from './pages/DishAI';
import './App.css';

function Home() {
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('All');

  const [ingredients, setIngredients] = useState(() => {
    const saved = sessionStorage.getItem('ingredients');
    return saved ? JSON.parse(saved) : [];
  });

  const [recipes, setRecipes] = useState(() => {
    const saved = sessionStorage.getItem('recipes');
    return saved ? JSON.parse(saved) : [];
  });

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIngredients([]);
      setRecipes([]);
      setError(null);
      sessionStorage.removeItem('ingredients');
      sessionStorage.removeItem('recipes');
    } else {
      setImagePreview(null);
      setSelectedFile(null);
    }
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      // Step 1: Scan image
      const scanRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/scan-image`,
        formData
      );

      const detectedIngredients = scanRes.data.ingredients || [];
      setIngredients(detectedIngredients);

      if (detectedIngredients.length === 0) {
        setError("🚫 No food ingredients detected! Please upload a fridge or food image.");
        setRecipes([]);
        return;
      }

      // Step 2: Fetch matching recipes
      const recipeRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/recipes/match`,
        {
          ingredients: detectedIngredients,
          diet: 'all'
        }
      );

      console.log("Recipes API response:", recipeRes.data);

      // ✅ Handle both { recipes: [...] } and [...] response shapes
      const recipeList = Array.isArray(recipeRes.data)
        ? recipeRes.data
        : recipeRes.data.recipes || [];

      sessionStorage.setItem('ingredients', JSON.stringify(detectedIngredients));
      sessionStorage.setItem('recipes', JSON.stringify(recipeList));

      setRecipes(recipeList);
      setFilter('All');

    } catch (err) {
      console.error("Error:", err);
      setError("Something went wrong. Please try again.");
      setIngredients([]);
      setRecipes([]);
    } finally {
      setIsScanning(false);
    }
  };

  const nonVegKeywords = [
    "chicken", "beef", "pork", "lamb", "fish", "salmon", "tuna", "shrimp",
    "seafood", "meat", "bacon", "turkey", "mutton", "prawn", "crab", "lobster",
    "egg", "eggs"
  ];

  const filteredRecipes = recipes.filter(recipe => {
    if (!recipe) return false; // ✅ skip undefined items
    if (filter === 'All') return true;

    if (recipe.diet) {
      const dietLower = recipe.diet.toLowerCase();
      if (filter === 'Veg') return dietLower.includes('vegetarian');
      if (filter === 'Non-Veg') return !dietLower.includes('vegetarian');
    }

    const isNonVeg = recipe.ingredients?.some(ingredient => {
      const ingredientLower = ingredient.toLowerCase();
      return nonVegKeywords.some(keyword => ingredientLower.includes(keyword));
    });

    if (filter === 'Veg') return !isNonVeg;
    if (filter === 'Non-Veg') return isNonVeg;
    return true;
  });

  return (
    <div className="main-container">
      <div className="text-center mb-5">
        <h1 className="fw-bold mb-3">What's in your fridge?</h1>
        <p className="text-secondary fs-5">
          Snap a picture of your ingredients and we'll tell you what to cook!
        </p>
      </div>

      <ImageUploader
        imagePreview={imagePreview}
        onImageChange={handleImageChange}
        onScan={handleScan}
        isScanning={isScanning}
      />

      {error && (
        <div className="alert alert-danger mt-3 text-center">
          {error}
        </div>
      )}

      {ingredients.length > 0 && (
        <IngredientsList ingredients={ingredients} />
      )}

      {recipes.length > 0 && (
        <div className="d-flex justify-content-center my-4 gap-3 animate-fade-in">
          <button
            className={`btn rounded-pill px-4 ${filter === 'All' ? 'btn-primary-custom' : 'btn-outline-secondary'}`}
            onClick={() => setFilter('All')}
          >
            🍽️ All
          </button>
          <button
            className={`btn rounded-pill px-4 ${filter === 'Veg' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => setFilter('Veg')}
          >
            🥦 Veg
          </button>
          <button
            className={`btn rounded-pill px-4 ${filter === 'Non-Veg' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => setFilter('Non-Veg')}
          >
            🍗 Non-Veg
          </button>
        </div>
      )}

      {/* ✅ Fixed: map over array and pass each recipe individually */}
      {recipes.length > 0 && (
        filteredRecipes.length > 0 ? (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {filteredRecipes.map((recipe) => (
              <RecipeCards key={recipe._id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted mt-4">
            <p>No {filter} recipes found. Try a different filter! 🍽️</p>
          </div>
        )
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="App pb-5">
        <Navbar />
        <Routes>
          <Route path="/sign-in" element={<SignInPage />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/recipe/:id" element={
            <ProtectedRoute>
              <RecipeDetails />
            </ProtectedRoute>
          } />
          <Route path="/diet-ai" element={
            <ProtectedRoute>
              <DietAI />
            </ProtectedRoute>
          } />
          <Route path="/dish-ai" element={
            <ProtectedRoute>
              <DishAI />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;