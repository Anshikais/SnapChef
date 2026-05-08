const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Recipe = require('./models/Recipe');

const app = express();
const PORT = process.env.PORT || 5001;

// Gemini AI Setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
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
// SCAN IMAGE ROUTE - Real Gemini Vision
// ==============================
app.post('/scan-image', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }

  try {
    console.log('Image uploaded:', req.file.path);

    // Read image file and convert to base64
    const imageData = fs.readFileSync(req.file.path);
    const base64Image = imageData.toString('base64');
    const mimeType = req.file.mimetype;

    // Use Gemini Vision to detect ingredients
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
   const prompt = `You are a food ingredient detector. 
Look at this image carefully.
If you see any food items, ingredients, vegetables, fruits, meat, dairy, or grocery items, list them all.
Return ONLY a JSON array of ingredient names in lowercase, nothing else, no explanation.
Example: ["tomatoes", "onion", "garlic", "eggs", "milk"]
If you see absolutely no food items, return: []
Be generous - even if partially visible, include it.`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const responseText = result.response.text().trim();
    console.log('Gemini response:', responseText);

    // Parse the JSON array from response
    let detectedIngredients = [];
    try {
      const cleaned = responseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();
      detectedIngredients = JSON.parse(cleaned);

      // Make sure it's an array
      if (!Array.isArray(detectedIngredients)) {
        detectedIngredients = [];
      }
    } catch (parseErr) {
      console.error('Error parsing Gemini response:', parseErr);
      detectedIngredients = [];
    }

    console.log('Detected ingredients:', detectedIngredients);

    res.json({
      message: 'Image scanned successfully',
      ingredients: detectedIngredients
    });

  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to scan image' });
  }
});

// ==============================
// MATCH RECIPES ROUTE
// ==============================
app.post('/recipes/match', async (req, res) => {
  try {
    const { ingredients, diet } = req.body;

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({ error: 'Provide ingredients array' });
    }

    // Normalize input
    const inputIngredients = ingredients.map(i => i.toLowerCase());

    // Build query - filter by diet if provided
    let query = {};
    if (diet && diet !== 'all') {
      if (diet === 'veg') {
        query.diet = { $regex: /vegetarian/i };
      } else if (diet === 'nonveg') {
        query.diet = { $not: /vegetarian/i };
      }
    }

    // Fetch recipes
    const recipes = await Recipe.find(query);

    const matchedRecipes = recipes.map(recipe => {
      let matchCount = 0;

      recipe.ingredients.forEach(ing => {
        if (inputIngredients.some(i => ing.includes(i))) {
          matchCount++;
        }
      });

      return {
        ...recipe.toObject(),
        matchCount
      };
    });

    const result = matchedRecipes
      .filter(r => r.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 12);

    res.json(result);

  } catch (error) {
    console.error('Error matching recipes:', error);
    res.status(500).json({ error: 'Server error while matching recipes' });
  }
});

// ==============================
// GET RECIPE DETAILS
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
// AI DIET RECIPES ROUTE
// ==============================
app.post('/api/ai/diet', async (req, res) => {
  try {
    const { dietType } = req.body;
    if (!dietType) {
      return res.status(400).json({ error: 'Diet type is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are a professional nutritionist and chef. The user's diet type is: ${dietType}.
Suggest 3-5 recipes that match their diet goal.

For each recipe, provide:
- Recipe name
- Ingredients with exact quantities
- Step-by-step cooking instructions
- Complete nutritional breakdown per serving:
  * Calories
  * Protein (g)
  * Carbohydrates (g)
  * Fats (g)
  * Fiber (g)
  * Key vitamins (Vitamin A, B12, C, D, E) in mg/mcg
  * Key minerals (Iron, Calcium, Potassium) in mg

Also mention:
- Who this recipe is best suited for
- What health benefits it provides
- Any ingredients to avoid for specific conditions (e.g., diabetes, hypertension)

Format the response in clean Markdown with clear headings.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ text });
  } catch (error) {
    console.error('Gemini API error (diet):', error);
    res.status(500).json({ error: 'Failed to generate recipes' });
  }
});

// ==============================
// AI DISH RECIPE ROUTE
// ==============================
app.post('/api/ai/dish', async (req, res) => {
  try {
    const { dishName } = req.body;
    if (!dishName) {
      return res.status(400).json({ error: 'Dish name is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `You are an expert chef and culinary assistant. The user wants to make a specific dish but needs help with ingredients and method. The dish name is: ${dishName}.

Respond with:
1. **Ingredients List** (with exact measurements for 2 servings):
   - Core ingredients
   - Optional add-ons to enhance flavor
   - Possible substitutes for common allergens

2. **Equipment Needed**

3. **Step-by-step Recipe** (beginner-friendly language)

4. **Pro Tips** to make it taste better

5. **Nutritional Info** per serving:
   - Calories, Protein, Carbs, Fats
   - Key vitamins and minerals

6. **Variations** (e.g., eggless version, gluten-free version, healthier version)

Be conversational, encouraging, and assume the user is a beginner cook. Format the response in clean Markdown with clear headings.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();
    res.json({ text });
  } catch (error) {
    console.error('Gemini API error (dish):', error);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
});

// ==============================
// BASIC ROUTE
// ==============================
app.get('/', (req, res) => {
  res.send('SnapChef API is running');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});