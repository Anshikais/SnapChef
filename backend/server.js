const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const cors = require('cors');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('./config/cloudinary');
require('dotenv').config();
const Groq = require('groq-sdk');
const axios = require('axios');
const Recipe = require('./models/Recipe');
const ScanHistory = require('./models/ScanHistory');
const Jimp = require('jimp');
const FoodMemory = require('./models/FoodMemory');

const app = express();
const PORT = process.env.PORT || 5001;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected to snapchef database'))
  .catch(err => console.error('MongoDB connection error:', err));
  const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'snapchef',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
  }
});

const upload = multer({ storage });

// ==============================
// PEXELS IMAGE SEARCH
// ==============================
app.get('/api/image/:query', async (req, res) => {
  try {
    const query = encodeURIComponent(req.params.query + ' food dish');
    const response = await axios.get(
      `https://api.pexels.com/v1/search?query=${query}&per_page=1`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } }
    );
    const photo = response.data.photos[0];
    res.json({ imageUrl: photo ? photo.src.large : null });
  } catch (err) {
    console.error('Pexels API error:', err.message);
    res.status(500).json({ imageUrl: null });
  }
});

// ==============================
// SCAN IMAGE - Groq Vision
// ==============================
app.post('/scan-image', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image uploaded' });

  try {
    const response = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `You are a food ingredient detector. Look at this image carefully.
If you see any food items, ingredients, vegetables, fruits, meat, dairy, or grocery items, list them all.
Return ONLY a JSON array of ingredient names in lowercase, nothing else, no explanation.
Example: ["tomatoes", "onion", "garlic", "eggs", "milk"]
If you see absolutely no food items, return: []`
          },
          {
            type: 'image_url',
            image_url: { url: req.file.path } 
          }
        ]
      }]
    });

    const responseText = response.choices[0].message.content.trim();
    let detectedIngredients = [];
    try {
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      detectedIngredients = JSON.parse(cleaned);
      if (!Array.isArray(detectedIngredients)) detectedIngredients = [];
    } catch {
      detectedIngredients = [];
    }
await ScanHistory.create({
  clerkUserId: req.body.clerkUserId,
  imageUrl: req.file.path,
  ingredients: detectedIngredients
});
    res.json({ message: 'Image scanned successfully', ingredients: detectedIngredients });
  } catch (error) {
    console.error('Groq API error:', error);
    res.status(500).json({ error: 'Failed to scan image' });
  }
});

// ==============================
// MATCH RECIPES
// ==============================
app.post('/recipes/match', async (req, res) => {
  try {
    const { ingredients, diet } = req.body;
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0)
      return res.status(400).json({ error: 'Provide ingredients array' });

    const inputIngredients = ingredients.map(i => i.toLowerCase());
    const regexIngredients = inputIngredients.map(i => new RegExp(i, 'i'));
    let query = { ingredients: { $in: regexIngredients } };

    if (diet && diet !== 'all') {
      if (diet === 'veg') query.diet = { $regex: /vegetarian/i };
      else if (diet === 'nonveg') query.diet = { $not: /vegetarian/i };
    }

    const recipes = await Recipe.find(query).limit(500).lean();
    const matchedRecipes = recipes.map(recipe => {
      let matchCount = 0;
      if (Array.isArray(recipe.ingredients)) {
        recipe.ingredients.forEach(ing => {
          if (inputIngredients.some(i => ing.includes(i))) matchCount++;
        });
      }
      return { ...recipe, matchCount };
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
// GET ALL RECIPES
// ==============================
app.get('/recipes/all', async (req, res) => {
  try {
    const recipes = await Recipe.find().limit(5);
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching recipes' });
  }
});

// ==============================
// GET RECIPE BY ID
// ==============================
app.get('/recipes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({ error: 'Invalid recipe ID' });

    const recipe = await Recipe.findById(id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });

    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Server error while fetching recipe' });
  }
});

// ==============================
// AI DIET RECIPES
// ==============================
app.post('/api/ai/diet', async (req, res) => {
  try {
    const { dietType } = req.body;
    if (!dietType) return res.status(400).json({ error: 'Diet type is required' });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are a professional nutritionist and chef. The user's diet type is: ${dietType}.
Suggest 3-5 recipes that match their diet goal.

For each recipe, provide:
- Recipe name
- Ingredients with exact quantities
- Step-by-step cooking instructions
- Complete nutritional breakdown per serving:
  * Calories, Protein (g), Carbohydrates (g), Fats (g), Fiber (g)
  * Key vitamins (Vitamin A, B12, C, D, E) in mg/mcg
  * Key minerals (Iron, Calcium, Potassium) in mg

Also mention:
- Who this recipe is best suited for
- What health benefits it provides
- Any ingredients to avoid for specific conditions

Format the response in clean Markdown with clear headings.`
      }]
    });

    res.json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error('Groq API error (diet):', error);
    res.status(500).json({ error: 'Failed to generate recipes' });
  }
});

// ==============================
// AI DISH RECIPE
// ==============================
app.post('/api/ai/dish', async (req, res) => {
  try {
    const { dishName } = req.body;
    if (!dishName) return res.status(400).json({ error: 'Dish name is required' });

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{
        role: 'user',
        content: `You are an expert chef and culinary assistant. The user wants to make: ${dishName}.

Respond with:
1. **Ingredients List** (with exact measurements for 2 servings)
2. **Equipment Needed**
3. **Step-by-step Recipe** (beginner-friendly)
4. **Pro Tips**
5. **Nutritional Info** per serving
6. **Variations** (eggless, gluten-free, healthier version)

Format in clean Markdown with clear headings.`
      }]
    });

    res.json({ text: response.choices[0].message.content });
  } catch (error) {
    console.error('Groq API error (dish):', error);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
});

// ==============================
// HELPERS FOR FOOD INTELLIGENCE
// ==============================
function hammingDistance(hash1, hash2) {
  let diffs = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) {
      diffs++;
    }
  }
  return diffs;
}

function getMealType(customHour) {
  const hour = customHour !== undefined ? customHour : new Date().getHours();

  if (hour >= 5 && hour < 11) {
    return "Breakfast";
  }

  if (hour >= 11 && hour < 16) {
    return "Lunch";
  }

  if (hour >= 16 && hour < 22) {
    return "Dinner";
  }

  return "Snacks";
}

// ==============================
// FOOD INTELLIGENCE ENDPOINTS
// ==============================

// 1. Upload food image, analyze ingredients/duplicate/meal type, generate AI recommendations
app.post('/api/food/upload', upload.single('image'), async (req, res) => {
  const { clerkUserId, mealType: clientMealType, foodPreference = 'all', detectedFood, ingredients } = req.body;
  const isRegen = !req.file && detectedFood;

  if (!req.file && !isRegen) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  if (!clerkUserId) return res.status(400).json({ error: 'Provide clerkUserId' });

  try {
    let imageUrl = '';
    let imageHash = '';
    let detectedIngredients = ingredients || [];
    let foodName = detectedFood || 'food';
    let foods = detectedIngredients;

    if (!isRegen) {
      imageUrl = req.file.path;

      // A. Perceptual hashing using Jimp
      try {
        const jimpImg = await Jimp.read(imageUrl);
        imageHash = jimpImg.hash(2); // 64-bit binary string
      } catch (jimpError) {
        console.error('Jimp error generating hash:', jimpError.message);
      }

      // B. Call Groq Vision to identify specific food items
      const visionResponse = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a food recognition AI.

Analyze the uploaded image carefully.

Rules:
- Return ONLY edible food names.
- Do NOT return generic labels like:
  "groceries"
  "fridge contents"
  "kitchen items"
  "ingredients"
  "food items"
  "mixed food"

- Identify specific foods only.

Examples:
GOOD:
- apple
- banana
- pizza
- burger
- paneer curry
- rice
- sandwich

BAD:
- groceries
- fridge contents
- meal
- ingredients

Return JSON format:
{
  "foods": ["apple", "bread", "egg"]
}
Do not include any explanation or markdown formatting. Return ONLY JSON.`
            },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }]
      });

      const visionText = visionResponse.choices[0].message.content.trim();
      try {
        const cleaned = visionText.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);
        foods = parsed.foods || [];
      } catch (parseError) {
        console.error('Groq Vision parse error:', parseError, visionText);
        foods = [];
      }

      // Add Validation Layer
      const invalidLabels = [
        "groceries",
        "fridge contents",
        "food items",
        "ingredients",
        "mixed groceries",
        "meal"
      ];

      foods = foods.filter(
        food => !invalidLabels.includes(food.toLowerCase())
      );

      if (foods.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Could not detect a valid food item"
        });
      }

      // Normalize food names to lowercase
      foods = foods.map(food => food.toLowerCase());

      detectedIngredients = foods;
      foodName = foods.join(', ');

      // C. Save to ScanHistory
      await ScanHistory.create({
        clerkUserId,
        imageUrl,
        ingredients: detectedIngredients
      });
    }

    // D. Time-based Meal Type Detection
    const mealType = clientMealType || getMealType();

    // E. Duplicate Detection (Similarity > 85%)
    const previousUploads = isRegen ? [] : await FoodMemory.find({ userId: clerkUserId }).sort({ uploadTime: -1 });

    let duplicateDetected = false;
    let similarityScore = 0;
    let duplicateInfo = null;

    if (!isRegen && imageHash && previousUploads.length > 0) {
      for (const prev of previousUploads) {
        if (prev.imageHash) {
          const dist = hammingDistance(imageHash, prev.imageHash);
          const similarity = (imageHash.length - dist) / imageHash.length;
          if (similarity > 0.85 && similarity > similarityScore) {
            similarityScore = similarity;
            duplicateDetected = true;
            duplicateInfo = {
              previousUploadDate: prev.uploadTime,
              previousMealType: prev.mealType,
              foodName: prev.foodName
            };
          }
        }
      }
    }

    // F. Generate AI Recommendations using Groq Chat
    let aiRecs = {
      recipes: [],
      healthierAlternatives: [],
      complementaryFoods: [],
      nutritionTips: []
    };

    try {
      let dietaryRule = "";

      if (foodPreference === "veg") {
        dietaryRule = `
        ONLY suggest vegetarian dishes.
        Do NOT include:
        chicken, egg, fish, meat, seafood, pork, beef.
        Veg should ONLY return:
        paneer, tofu, vegetables, fruits, dairy, grains, vegetarian recipes.
        `;
      }

      if (foodPreference === "nonveg") {
        dietaryRule = `
        You may include chicken, fish, eggs, and meat dishes.
        `;
      }

      const prompt = `
${dietaryRule}

User uploaded:
${foodName}

Meal Type:
${mealType}

Generate:
1. Recipe suggestions
2. Healthier alternatives
3. Complementary pairings
4. Nutrition tips

Return the suggestions as clean bullet points within a raw JSON object matching this schema:
{
  "recipes": ["Recipe suggestion 1", "Recipe suggestion 2"],
  "healthierAlternatives": ["Alternative 1", "Alternative 2"],
  "complementaryFoods": ["Pairing 1", "Pairing 2"],
  "nutritionTips": ["Tip 1", "Tip 2"]
}
Do not include any explanation or markdown markup. Return ONLY JSON.`;

      const chatResponse = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }]
      });

      const recText = chatResponse.choices[0].message.content.trim();
      const cleanedRec = recText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedRec = JSON.parse(cleanedRec);
      aiRecs = {
        recipes: parsedRec.recipes || [],
        healthierAlternatives: parsedRec.healthierAlternatives || [],
        complementaryFoods: parsedRec.complementaryFoods || [],
        nutritionTips: parsedRec.nutritionTips || []
      };
    } catch (recError) {
      console.error('Error generating recommendations:', recError);
    }

    // G. Store in User Food Memory
    let newMemory = null;
    if (!isRegen) {
      for (let i = 0; i < foods.length; i++) {
        const food = foods[i];
        const mem = await FoodMemory.create({
          userId: clerkUserId,
          imageUrl,
          foodName: food,
          mealType,
          aiSuggestions: {
            recipes: aiRecs.recipes,
            healthierAlternatives: aiRecs.healthierAlternatives,
            complementaryFoods: aiRecs.complementaryFoods,
            nutritionTips: aiRecs.nutritionTips
          },
          similarityScore,
          imageHash
        });
        if (i === 0) {
          newMemory = mem;
        }
      }
    }

    res.json({
      message: 'Image scanned successfully',
      ingredients: detectedIngredients,
      foodName,
      mealType,
      aiSuggestions: aiRecs,
      duplicateDetected,
      similarityScore,
      duplicateInfo,
      foodMemory: newMemory
    });

  } catch (error) {
    console.error('Error in /api/food/upload:', error);
    res.status(500).json({ error: 'Failed to upload and analyze food' });
  }
});

// 2. Compare two images for duplicate check
app.post('/api/food/compare', async (req, res) => {
  const { image1Url, image2Url } = req.body;
  if (!image1Url || !image2Url) {
    return res.status(400).json({ error: 'Please provide both image1Url and image2Url' });
  }

  try {
    const img1 = await Jimp.read(image1Url);
    const img2 = await Jimp.read(image2Url);
    const hash1 = img1.hash(2);
    const hash2 = img2.hash(2);
    const dist = hammingDistance(hash1, hash2);
    const similarity = (hash1.length - dist) / hash1.length;
    res.json({ similarity, duplicate: similarity > 0.85 });
  } catch (error) {
    console.error('Error in /api/food/compare:', error);
    res.status(500).json({ error: error.message });
  }
});

// 3. Get user food memory history
app.get('/api/food/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await FoodMemory.find({ userId }).sort({ uploadTime: -1 });
    res.json(history);
  } catch (error) {
    console.error('Error in /api/food/history:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Get time-based suggestions
app.get('/api/food/suggestions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { hour } = req.query;
    const history = await FoodMemory.find({ userId }).sort({ uploadTime: -1 }).limit(10);
    const mealType = getMealType(hour !== undefined ? parseInt(hour, 10) : undefined);
    const historySummary = history.map(h => `${h.foodName} (${h.mealType})`).join(', ');

    const prompt = `You are a personalized nutritionist. The user's current meal time is for: ${mealType}.
The user has recently eaten: ${historySummary || 'nothing recorded yet'}.
Please suggest 3 specific food or meal suggestions suitable for ${mealType}.
Provide suggestions that:
- Guide them to healthier choices based on what they've eaten.
- If they have eaten morning fruit, suggest smoothie or oats.
- If they have eaten bread at night, suggest healthier dinner suggestions.
Return the suggestions in raw JSON format matching this schema:
{
  "suggestions": [
    {
      "name": "Suggestion Name",
      "reason": "Reason why this is suggested."
    }
  ]
}
Do not include any explanation or markdown formatting. Return ONLY JSON.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.choices[0].message.content.trim();
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) {
    console.error('Error in /api/food/suggestions:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Get personalized food insights
app.get('/api/food/insights/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await FoodMemory.find({ userId });
    if (history.length === 0) {
      return res.json({
        repeatedFoods: [],
        patterns: ["No food history recorded yet. Start scanning your meals to get insights!"],
        missingNutrients: ["Insights will appear after you scan some meals."],
        favoriteFoods: []
      });
    }

    const historySummary = history.map(h => `${h.foodName} (${h.mealType})`).join(', ');

    const prompt = `You are a personalized nutrition AI. Analyze the following food history of a user:
[${historySummary}]

Please generate insights regarding:
1. Repeated foods
2. Healthy/unhealthy patterns
3. Missing nutrients
4. Favorite foods

Format your response in raw JSON matching this schema:
{
  "repeatedFoods": ["Food Item 1 (X times)", "Food Item 2 (Y times)"],
  "patterns": ["Insight pattern 1", "Insight pattern 2"],
  "missingNutrients": ["Nutrient 1 (source food recommendation)", "Nutrient 2"],
  "favoriteFoods": ["Favorite 1", "Favorite 2"]
}
Do not include any explanation or markdown formatting. Return ONLY JSON.`;

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }]
    });

    const text = response.choices[0].message.content.trim();
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    res.json(parsed);
  } catch (error) {
    console.error('Error in /api/food/insights:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => res.send('SnapChef API is running'));

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));