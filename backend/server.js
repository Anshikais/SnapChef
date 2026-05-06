const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const Recipe = require('./models/Recipe');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// ✅ MongoDB Connection (fixed)
mongoose.connect('mongodb://127.0.0.1:27017/snapchef')
  .then(() => console.log('MongoDB connected to snapchef database'))
  .catch(err => console.error('MongoDB connection error:', err));

// Multer Setup
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// ==============================
// ✅ SCAN IMAGE ROUTE
// ==============================
app.post('/scan-image', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  const detectedIngredients = ['Tomatoes', 'Eggs', 'Onion', 'Garlic', 'Pasta', 'Cheese'];

  console.log('Image uploaded:', req.file.path);

  res.json({
    message: 'Image scanned successfully',
    ingredients: detectedIngredients
  });
});

// ==============================
// ✅ MATCH RECIPES (FINAL FIXED)
// ==============================
app.post('/recipes/match', async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'Provide ingredients array' });
    }

    // Normalize input
    const inputIngredients = ingredients.map(i => i.toLowerCase());

    // Fetch all recipes
    const recipes = await Recipe.find();

    const matchedRecipes = recipes.map(recipe => {
      let matchCount = 0;

      recipe.ingredients.forEach(ing => {
        if (inputIngredients.some(i => ing.includes(i))) {
          matchCount++;
        }
      });

      return {
        ...recipe._doc,
        matchCount
      };
    });

    const result = matchedRecipes
      .filter(r => r.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 6);

    res.json(result);

  } catch (error) {
    console.error('Error matching recipes:', error);
    res.status(500).json({ error: 'Server error while matching recipes' });
  }
});

// ==============================
// ✅ GET RECIPE DETAILS
// ==============================
app.get('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid recipe ID' });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    res.json(recipe);

  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: 'Server error while fetching recipe' });
  }
});

// ==============================
// BASIC ROUTE
// ==============================
app.get('/', (req, res) => {
  res.send('SnapChef API is running');
});

// ==============================
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});