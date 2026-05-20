import React, { useState } from 'react';
import { useUser } from "@clerk/clerk-react";
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
  const { user } = useUser();
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

  const [detectedFoodName, setDetectedFoodName] = useState('');
  const [mealType, setMealType] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState(null);

  // Intelligence center states
  const [history, setHistory] = useState([]);
  const [insights, setInsights] = useState(null);
  const [timeSuggestions, setTimeSuggestions] = useState([]);
  const [isInsightsOpen, setIsInsightsOpen] = useState(false);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = async () => {
    if (!user) return;
    setHistoryLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/food/history/${user.id}`);
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchInsights = async () => {
    if (!user) return;
    setInsightsLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/food/insights/${user.id}`);
      setInsights(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setInsightsLoading(false);
    }
  };

  const fetchSuggestions = async () => {
    if (!user) return;
    setSuggestionsLoading(true);
    try {
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/food/suggestions/${user.id}`);
      setTimeSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setIngredients([]);
      setRecipes([]);
      setDetectedFoodName('');
      setMealType('');
      setAiSuggestions(null);
      setDuplicateInfo(null);
      setShowDuplicateModal(false);
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
    setAiSuggestions(null);

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('clerkUserId', user.id);

    try {
      // Step 1: Scan image and save memory
      const scanRes = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/food/upload`,
        formData
      );

      const detectedIngredients = scanRes.data.ingredients || [];
      setIngredients(detectedIngredients);
      setDetectedFoodName(scanRes.data.foodName || '');
      setMealType(scanRes.data.mealType || '');
      setAiSuggestions(scanRes.data.aiSuggestions || null);

      if (scanRes.data.duplicateDetected) {
        setDuplicateInfo(scanRes.data.duplicateInfo);
        setShowDuplicateModal(true);
      }

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

      // Refresh intelligence center in background if sections are open
      if (isHistoryOpen) fetchHistory();
      if (isInsightsOpen) fetchInsights();

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
    if (!recipe) return false; 
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
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 flex-wrap mb-3 animate-fade-in">
            {mealType && (
              <span className="badge bg-danger rounded-pill px-3 py-2 fs-6">
                {mealType === 'Breakfast' && '🌅 Breakfast'}
                {mealType === 'Lunch' && '🥦 Lunch'}
                {mealType === 'Dinner' && '🍗 Dinner'}
                {mealType === 'Snack' && '🍕 Snack'}
              </span>
            )}
            {detectedFoodName && (
              <span className="badge bg-secondary rounded-pill px-3 py-2 fs-6">
                🔍 Scanned: {detectedFoodName}
              </span>
            )}
          </div>
          <IngredientsList ingredients={ingredients} />
        </div>
      )}

      {aiSuggestions && (
        <div className="ai-suggestions-section mb-5 animate-fade-in">
          <h3 className="mb-4 d-flex align-items-center gap-2">
            <span>💡</span> AI Recommendations & Tips
          </h3>
          <div className="rec-grid">
            {aiSuggestions.recipes && aiSuggestions.recipes.length > 0 && (
              <div className="rec-card-custom">
                <div className="rec-card-title">🍳 Try These Recipes</div>
                <ul className="text-secondary ps-3 mb-0" style={{ fontSize: '0.95rem' }}>
                  {aiSuggestions.recipes.map((r, i) => <li key={i} className="mb-1 text-white">{r}</li>)}
                </ul>
              </div>
            )}
            {aiSuggestions.healthierAlternatives && aiSuggestions.healthierAlternatives.length > 0 && (
              <div className="rec-card-custom">
                <div className="rec-card-title">🥗 Healthier Alternatives</div>
                <ul className="text-secondary ps-3 mb-0" style={{ fontSize: '0.95rem' }}>
                  {aiSuggestions.healthierAlternatives.map((h, i) => <li key={i} className="mb-1 text-white">{h}</li>)}
                </ul>
              </div>
            )}
            {aiSuggestions.complementaryFoods && aiSuggestions.complementaryFoods.length > 0 && (
              <div className="rec-card-custom">
                <div className="rec-card-title">🍇 Complementary Pairings</div>
                <ul className="text-secondary ps-3 mb-0" style={{ fontSize: '0.95rem' }}>
                  {aiSuggestions.complementaryFoods.map((c, i) => <li key={i} className="mb-1 text-white">{c}</li>)}
                </ul>
              </div>
            )}
            {aiSuggestions.nutritionTips && aiSuggestions.nutritionTips.length > 0 && (
              <div className="rec-card-custom">
                <div className="rec-card-title">🔬 Nutrition Tips</div>
                <ul className="text-secondary ps-3 mb-0" style={{ fontSize: '0.95rem' }}>
                  {aiSuggestions.nutritionTips.map((n, i) => <li key={i} className="mb-1 text-white">{n}</li>)}
                </ul>
              </div>
            )}
          </div>
        </div>
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
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4 mb-5">
            {filteredRecipes.map((recipe) => (
              <RecipeCards key={recipe._id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted mt-4 mb-5">
            <p>No {filter} recipes found. Try a different filter! 🍽️</p>
          </div>
        )
      )}

      {/* Personal Food Intelligence Center */}
      <div className="mt-5 pt-4 border-top border-secondary">
        <h2 className="fw-bold mb-4">🧠 Personalized Food Intelligence</h2>
        
        <div className="d-flex flex-column gap-3">
          
          {/* 1. Collapsible insights section */}
          <div className="intelligence-card">
            <div 
              className="intelligence-header"
              onClick={() => {
                const nextState = !isInsightsOpen;
                setIsInsightsOpen(nextState);
                if (nextState && !insights) fetchInsights();
              }}
            >
              <span>📊 Personalized Diet Insights</span>
              <span>{isInsightsOpen ? '▲' : '▼'}</span>
            </div>
            {isInsightsOpen && (
              <div className="intelligence-body">
                {insightsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-danger" role="status"></div>
                    <span className="ms-2 text-secondary">Analyzing diet history...</span>
                  </div>
                ) : insights ? (
                  <div className="row g-3">
                    <div className="col-md-6">
                      <h6 className="text-danger fw-bold">🔄 Repeated Foods</h6>
                      <ul className="text-white ps-3 mb-3">
                        {insights.repeatedFoods && insights.repeatedFoods.length > 0 ? (
                          insights.repeatedFoods.map((f, i) => <li key={i} className="small mb-1">{f}</li>)
                        ) : (
                          <li className="small text-secondary">No repeated foods detected yet.</li>
                        )}
                      </ul>
                      <h6 className="text-danger fw-bold">⭐ Favorite Foods</h6>
                      <ul className="text-white ps-3">
                        {insights.favoriteFoods && insights.favoriteFoods.length > 0 ? (
                          insights.favoriteFoods.map((f, i) => <li key={i} className="small mb-1">{f}</li>)
                        ) : (
                          <li className="small text-secondary">Favorites will show up here.</li>
                        )}
                      </ul>
                    </div>
                    <div className="col-md-6">
                      <h6 className="text-danger fw-bold">📉 Eating Patterns</h6>
                      <ul className="text-white ps-3 mb-3">
                        {insights.patterns && insights.patterns.map((p, i) => <li key={i} className="small mb-1">{p}</li>)}
                      </ul>
                      <h6 className="text-danger fw-bold">🧪 Missing Nutrients</h6>
                      <ul className="text-white ps-3">
                        {insights.missingNutrients && insights.missingNutrients.map((n, i) => <li key={i} className="small mb-1">{n}</li>)}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-secondary small py-2">Click to load insights.</div>
                )}
              </div>
            )}
          </div>

          {/* 2. Collapsible suggestions section */}
          <div className="intelligence-card">
            <div 
              className="intelligence-header"
              onClick={() => {
                const nextState = !isSuggestionsOpen;
                setIsSuggestionsOpen(nextState);
                if (nextState && timeSuggestions.length === 0) fetchSuggestions();
              }}
            >
              <span>⏰ Time-Based Suggestions</span>
              <span>{isSuggestionsOpen ? '▲' : '▼'}</span>
            </div>
            {isSuggestionsOpen && (
              <div className="intelligence-body">
                {suggestionsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-danger" role="status"></div>
                    <span className="ms-2 text-secondary">Fetching suggestions...</span>
                  </div>
                ) : timeSuggestions.length > 0 ? (
                  <div className="row row-cols-1 row-cols-md-3 g-3">
                    {timeSuggestions.map((s, i) => (
                      <div key={i} className="col">
                        <div className="rec-card-custom h-100">
                          <div className="rec-card-title">💡 {s.name}</div>
                          <p className="text-secondary small mb-0">{s.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-secondary small py-2">No suggestions available. Try scanning some foods first!</div>
                )}
              </div>
            )}
          </div>

          {/* 3. Collapsible history section */}
          <div className="intelligence-card">
            <div 
              className="intelligence-header"
              onClick={() => {
                const nextState = !isHistoryOpen;
                setIsHistoryOpen(nextState);
                if (nextState && history.length === 0) fetchHistory();
              }}
            >
              <span>🕒 Meal Upload History</span>
              <span>{isHistoryOpen ? '▲' : '▼'}</span>
            </div>
            {isHistoryOpen && (
              <div className="intelligence-body">
                {historyLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-danger" role="status"></div>
                    <span className="ms-2 text-secondary">Loading history...</span>
                  </div>
                ) : history.length > 0 ? (
                  <div style={{ maxHeight: '300px', overflowY: 'auto', paddingRight: '5px' }}>
                    {history.map((h, i) => (
                      <div key={i} className="history-item">
                        <img 
                          src={h.imageUrl} 
                          alt={h.foodName} 
                          style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px' }} 
                        />
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-semibold text-white">{h.foodName}</span>
                            <span className="badge bg-danger rounded-pill px-2 py-1 small" style={{ fontSize: '0.75rem' }}>{h.mealType}</span>
                          </div>
                          <div className="d-flex justify-content-between align-items-center mt-1">
                            <span className="text-secondary small">{new Date(h.uploadTime).toLocaleDateString()} {new Date(h.uploadTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {h.similarityScore > 0 && (
                              <span className="text-warning small" style={{ fontSize: '0.8rem' }}>Sim: {(h.similarityScore * 100).toFixed(0)}%</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-secondary small py-2">No history recorded yet. Scan your first food item!</div>
                )}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Duplicate Food Modal Overlay */}
      {showDuplicateModal && duplicateInfo && (
        <div className="modal-overlay">
          <div className="modal-content-custom">
            <span style={{ fontSize: '3rem' }}>🍎</span>
            <h3 className="fw-bold my-3 text-white">
              Looks like you already had {duplicateInfo.foodName || 'this food'} yesterday!
            </h3>
            <p className="text-secondary fs-6 mb-4">
              You scanned this on {new Date(duplicateInfo.previousUploadDate).toLocaleDateString()} at {new Date(duplicateInfo.previousUploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} during {duplicateInfo.previousMealType}.
            </p>
            <div className="d-flex flex-column gap-2 justify-content-center">
              <button
                className="btn btn-primary-custom"
                onClick={() => {
                  setShowDuplicateModal(false);
                  const element = document.querySelector('.ai-suggestions-section');
                  if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                ✨ Try something different
              </button>
              <button
                className="btn btn-link text-secondary"
                onClick={() => setShowDuplicateModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
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