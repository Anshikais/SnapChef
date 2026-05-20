import React, { useState, useEffect } from 'react';
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

const getMealType = () => {
  const hour = new Date().getHours(); // local time
  let mealType;

  if (hour >= 5 && hour < 11) {
    mealType = "Breakfast";
  } else if (hour >= 11 && hour < 16) {
    mealType = "Lunch";
  } else if (hour >= 16 && hour < 22) {
    mealType = "Dinner";
  } else {
    mealType = "Snacks";
  }

  console.log("Current Hour:", hour);
  console.log("Detected Meal:", mealType);
  return mealType;
};

function Home() {
  const { user } = useUser();
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [foodPreference, setFoodPreference] = useState('all');
  const [recsLoading, setRecsLoading] = useState(false);

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
  const [popupModal, setPopupModal] = useState(null);
  const [showPopupModal, setShowPopupModal] = useState(false);

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
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/food/insights/${user.id}?name=${user.firstName || 'Anshika'}`);
      setInsights(res.data);
      
      // Smart Popup System: Trigger popup modal if show is true and we haven't dismissed it in this session
      if (res.data.popup && res.data.popup.show && !sessionStorage.getItem('hasShownExpiryPopup')) {
        setPopupModal(res.data.popup);
        setShowPopupModal(true);
      }
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
      const localHour = new Date().getHours();
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/food/suggestions/${user.id}?hour=${localHour}`);
      setTimeSuggestions(res.data.suggestions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleMarkAsUsed = async (id) => {
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/api/food/consume/${id}`);
      fetchInsights();
      fetchHistory();
    } catch (err) {
      console.error("Error marking ingredient as used:", err);
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
      setFoodPreference('all');
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

    const detectedMealType = getMealType();
    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('clerkUserId', user.id);
    formData.append('mealType', detectedMealType);
    formData.append('foodPreference', foodPreference);

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
          diet: foodPreference
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

      // Refresh intelligence center in background
      fetchHistory();
      fetchInsights();

    } catch (err) {
      console.error("Error:", err);
      const errMsg = err.response?.data?.message || err.response?.data?.error || "Something went wrong. Please try again.";
      setError(errMsg);
      setIngredients([]);
      setRecipes([]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleFilterChange = async (preference) => {
    setFoodPreference(preference);

    if (detectedFoodName && user) {
      setRecsLoading(true);
      setError(null);
      try {
        const detectedMealType = getMealType();

        // Send regeneration request to backend
        const scanRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/api/food/upload`,
          {
            clerkUserId: user.id,
            detectedFood: detectedFoodName,
            mealType: detectedMealType,
            foodPreference: preference,
            ingredients: ingredients
          }
        );

        setAiSuggestions(scanRes.data.aiSuggestions || null);

        // Also fetch matching recipes for the new preference
        const recipeRes = await axios.post(
          `${process.env.REACT_APP_API_URL}/recipes/match`,
          {
            ingredients: ingredients,
            diet: preference
          }
        );

        const recipeList = Array.isArray(recipeRes.data)
          ? recipeRes.data
          : recipeRes.data.recipes || [];

        sessionStorage.setItem('recipes', JSON.stringify(recipeList));
        setRecipes(recipeList);

      } catch (err) {
        console.error("Error regenerating recommendations:", err);
        const errMsg = err.response?.data?.message || err.response?.data?.error || "Failed to update recommendations. Please try again.";
        setError(errMsg);
      } finally {
        setRecsLoading(false);
      }
    }
  };

  const nonVegKeywords = [
    "chicken", "beef", "pork", "lamb", "fish", "salmon", "tuna", "shrimp",
    "seafood", "meat", "bacon", "turkey", "mutton", "prawn", "crab", "lobster",
    "egg", "eggs"
  ];

  const filteredRecipes = recipes.filter(recipe => {
    if (!recipe) return false; 
    if (foodPreference === 'all') return true;

    if (recipe.diet) {
      const dietLower = recipe.diet.toLowerCase();
      if (foodPreference === 'veg') return dietLower.includes('vegetarian');
      if (foodPreference === 'nonveg') return !dietLower.includes('vegetarian');
    }

    const isNonVeg = recipe.ingredients?.some(ingredient => {
      const ingredientLower = ingredient.toLowerCase();
      return nonVegKeywords.some(keyword => ingredientLower.includes(keyword));
    });

    if (foodPreference === 'veg') return !isNonVeg;
    if (foodPreference === 'nonveg') return isNonVeg;
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
                {(mealType === 'Snacks' || mealType === 'Snack') && '🍕 Snacks'}
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

      {(aiSuggestions || recsLoading) && (
        <div className="ai-suggestions-section mb-5 animate-fade-in">
          <h3 className="mb-4 d-flex align-items-center gap-2">
            <span>💡</span> AI Recommendations & Tips
          </h3>
          {recsLoading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-danger" role="status">
                <span className="visually-hidden">Loading recommendations...</span>
              </div>
              <p className="mt-3 text-secondary">Regenerating personalized suggestions...</p>
            </div>
          ) : (
            <div className="rec-grid">
              {aiSuggestions && aiSuggestions.recipes && aiSuggestions.recipes.length > 0 && (
                <div className="rec-card-custom">
                  <div className="rec-card-title">🍳 Try These Recipes</div>
                  <ul className="text-secondary ps-3 mb-0" style={{ fontSize: '0.95rem' }}>
                    {aiSuggestions.recipes.map((r, i) => <li key={i} className="mb-1 text-white">{r}</li>)}
                  </ul>
                </div>
              )}
              {aiSuggestions && aiSuggestions.healthierAlternatives && aiSuggestions.healthierAlternatives.length > 0 && (
                <div className="rec-card-custom">
                  <div className="rec-card-title">🥗 Healthier Alternatives</div>
                  <ul className="text-secondary ps-3 mb-0" style={{ fontSize: '0.95rem' }}>
                    {aiSuggestions.healthierAlternatives.map((h, i) => <li key={i} className="mb-1 text-white">{h}</li>)}
                  </ul>
                </div>
              )}
              {aiSuggestions && aiSuggestions.complementaryFoods && aiSuggestions.complementaryFoods.length > 0 && (
                <div className="rec-card-custom">
                  <div className="rec-card-title">🍇 Complementary Pairings</div>
                  <ul className="text-secondary ps-3 mb-0" style={{ fontSize: '0.95rem' }}>
                    {aiSuggestions.complementaryFoods.map((c, i) => <li key={i} className="mb-1 text-white">{c}</li>)}
                  </ul>
                </div>
              )}
              {aiSuggestions && aiSuggestions.nutritionTips && aiSuggestions.nutritionTips.length > 0 && (
                <div className="rec-card-custom">
                  <div className="rec-card-title">🔬 Nutrition Tips</div>
                  <ul className="text-secondary ps-3 mb-0" style={{ fontSize: '0.95rem' }}>
                    {aiSuggestions.nutritionTips.map((n, i) => <li key={i} className="mb-1 text-white">{n}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {recipes.length > 0 && (
        <div className="d-flex justify-content-center my-4 gap-3 animate-fade-in">
          <button
            className={`btn rounded-pill px-4 ${foodPreference === 'all' ? 'btn-primary-custom' : 'btn-outline-secondary'}`}
            onClick={() => handleFilterChange('all')}
          >
            🍽️ All
          </button>
          <button
            className={`btn rounded-pill px-4 ${foodPreference === 'veg' ? 'btn-success' : 'btn-outline-success'}`}
            onClick={() => handleFilterChange('veg')}
          >
            🥦 Veg
          </button>
          <button
            className={`btn rounded-pill px-4 ${foodPreference === 'nonveg' ? 'btn-danger' : 'btn-outline-danger'}`}
            onClick={() => handleFilterChange('nonveg')}
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
            <p>No {foodPreference === 'all' ? '' : foodPreference} recipes found. Try a different filter! 🍽️</p>
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
              <span>📊 AI Smart Kitchen Assistant Insights</span>
              <span>{isInsightsOpen ? '▲' : '▼'}</span>
            </div>
            {isInsightsOpen && (
              <div className="intelligence-body">
                {insightsLoading ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm text-danger" role="status"></div>
                    <span className="ms-2 text-secondary">Loading kitchen intelligence...</span>
                  </div>
                ) : insights ? (
                  <div className="row g-3">
                    {/* A. Expiring Soon */}
                    <div className="col-md-6">
                      <div className="card bg-dark border-secondary p-3 mb-3 h-100">
                        <h6 className="text-danger fw-bold d-flex align-items-center justify-content-between">
                          <span>⏳ Expiring Soon</span>
                          <span className="badge bg-danger">{insights.expiringSoon ? insights.expiringSoon.length : 0}</span>
                        </h6>
                        <ul className="text-white ps-0 mb-0" style={{ listStyleType: 'none' }}>
                          {insights.expiringSoon && insights.expiringSoon.length > 0 ? (
                            insights.expiringSoon.map((item, i) => (
                              <li key={i} className="small mb-2 d-flex justify-content-between align-items-center bg-black bg-opacity-25 p-2 rounded">
                                <span>{item}</span>
                                {insights.fridgeInventory && insights.fridgeInventory.find(inv => inv.foodName.toLowerCase() === item.split(' ')[0].toLowerCase()) && (
                                  <button 
                                    className="btn btn-outline-danger btn-sm py-0 px-2"
                                    onClick={() => handleMarkAsUsed(insights.fridgeInventory.find(inv => inv.foodName.toLowerCase() === item.split(' ')[0].toLowerCase())._id)}
                                  >
                                    Used
                                  </button>
                                )}
                              </li>
                            ))
                          ) : (
                            <li className="small text-secondary italic">No items expiring soon.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* B. Cook Today */}
                    <div className="col-md-6">
                      <div className="card bg-dark border-secondary p-3 mb-3 h-100">
                        <h6 className="text-danger fw-bold">🍳 Cook Today</h6>
                        <ul className="text-white ps-3 mb-0">
                          {insights.cookToday && insights.cookToday.length > 0 ? (
                            insights.cookToday.map((f, i) => <li key={i} className="small mb-1">{f}</li>)
                          ) : (
                            <li className="small text-secondary">No meal ideas. Scan ingredients first!</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* C. Unused Ingredients */}
                    <div className="col-md-6">
                      <div className="card bg-dark border-secondary p-3 mb-3 h-100">
                        <h6 className="text-danger fw-bold d-flex align-items-center justify-content-between">
                          <span>📦 Fridge Inventory (Unused)</span>
                        </h6>
                        <ul className="text-white ps-0 mb-0" style={{ listStyleType: 'none', maxHeight: '180px', overflowY: 'auto' }}>
                          {insights.fridgeInventory && insights.fridgeInventory.length > 0 ? (
                            insights.fridgeInventory.map((item, i) => {
                              const expDate = new Date(item.estimatedExpiryDate);
                              const remainingDays = Math.ceil((expDate - new Date()) / (1000 * 60 * 60 * 24));
                              let badgeColor = "bg-success";
                              if (remainingDays <= 1) badgeColor = "bg-danger";
                              else if (remainingDays <= 3) badgeColor = "bg-warning text-dark";

                              return (
                                <li key={i} className="small mb-2 d-flex justify-content-between align-items-center bg-black bg-opacity-25 p-2 rounded">
                                  <div>
                                    <span className="fw-semibold text-white">{item.foodName}</span>
                                    <span className={`badge ${badgeColor} ms-2`} style={{ fontSize: '0.7rem' }}>
                                      {remainingDays <= 0 ? "Expired" : `${remainingDays}d left`}
                                    </span>
                                  </div>
                                  <button 
                                    className="btn btn-outline-danger btn-sm py-0 px-2"
                                    onClick={() => handleMarkAsUsed(item._id)}
                                  >
                                    Used
                                  </button>
                                </li>
                              );
                            })
                          ) : (
                            <li className="small text-secondary italic">Your fridge is empty. Scan grocery/food images!</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* D. Smart Suggestions */}
                    <div className="col-md-6">
                      <div className="card bg-dark border-secondary p-3 mb-3 h-100">
                        <h6 className="text-danger fw-bold text-gradient">✨ Smart Suggestions</h6>
                        <ul className="text-white ps-3 mb-0">
                          {insights.smartSuggestions && insights.smartSuggestions.length > 0 ? (
                            insights.smartSuggestions.map((s, i) => <li key={i} className="small mb-1">{s}</li>)
                          ) : (
                            <li className="small text-secondary">Scan foods to see dynamic suggestions.</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    {/* E. Quick Recipes */}
                    <div className="col-12">
                      <div className="card bg-dark border-secondary p-3">
                        <h6 className="text-danger fw-bold">📖 Quick Recipes (Using Available Ingredients)</h6>
                        <div className="row g-2 mt-1">
                          {insights.quickRecipes && insights.quickRecipes.length > 0 ? (
                            insights.quickRecipes.map((recipe, i) => (
                              <div key={i} className="col-md-4">
                                <div className="p-2 rounded bg-black bg-opacity-25 h-100 border border-secondary border-opacity-25">
                                  <div className="fw-bold text-white small">🍽️ {recipe.name}</div>
                                  <div className="text-secondary small mt-1" style={{ fontSize: '0.75rem' }}>
                                    Ingredients: {recipe.ingredients.join(', ')}
                                  </div>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="text-secondary small col-12 italic">No recipes found. Try scanning more items!</div>
                          )}
                        </div>
                      </div>
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

      {/* Smart AI Kitchen Assistant Popup Modal */}
      {showPopupModal && popupModal && (
        <div className="modal-overlay">
          <div className="modal-content-custom" style={{ maxWidth: '500px' }}>
            <span style={{ fontSize: '3rem' }}>🤖</span>
            <h3 className="fw-bold my-3 text-white">{popupModal.title}</h3>
            <div className="text-secondary fs-6 mb-4" style={{ whiteSpace: 'pre-line', textAlign: 'left', lineHeight: '1.6' }}>
              {popupModal.message}
            </div>
            <button 
              className="btn btn-danger btn-lg w-100 rounded-pill py-2 fw-semibold"
              onClick={() => {
                setShowPopupModal(false);
                sessionStorage.setItem('hasShownExpiryPopup', 'true');
              }}
            >
              Perfect, thank you!
            </button>
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