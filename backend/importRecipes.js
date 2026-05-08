const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// ==============================
// Schema
// ==============================
const recipeSchema = new mongoose.Schema({
  recipeName: String,
  ingredients: [String],
  instructions: String,
  imageUrl: String,
  cuisine: String,
  course: String,
  diet: String,
  rating: Number
});

const Recipe = mongoose.model('Recipe', recipeSchema);

// ==============================
// Image Mapper
// ==============================
function getFoodImage(name, diet = '') {
  const n = (name || '').toLowerCase();
  const d = (diet || '').toLowerCase();

  if (n.includes("pasta") || n.includes("spaghetti") || n.includes("noodle") || n.includes("lasagna"))
    return "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&h=400&fit=crop";

  if (n.includes("chicken"))
    return "https://images.unsplash.com/photo-1604908176997-4315fbd6f6e4?w=600&h=400&fit=crop";

  if (n.includes("salad"))
    return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop";

  if (n.includes("cake") || n.includes("dessert") || n.includes("cookie") || n.includes("brownie") || n.includes("pie") || n.includes("sweet"))
    return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop";

  if (n.includes("rice") || n.includes("biryani") || n.includes("pilaf") || n.includes("risotto") || n.includes("pulao") || n.includes("khichdi"))
    return "https://images.unsplash.com/photo-1512058564366-c9e3e0464f15?w=600&h=400&fit=crop";

  if (n.includes("soup") || n.includes("stew") || n.includes("broth") || n.includes("chowder") || n.includes("rasam") || n.includes("dal") || n.includes("curry"))
    return "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop";

  if (n.includes("beef") || n.includes("steak") || n.includes("lamb") || n.includes("pork") || n.includes("mutton"))
    return "https://images.unsplash.com/photo-1546964124-0cce460f38ef?w=600&h=400&fit=crop";

  if (n.includes("fish") || n.includes("salmon") || n.includes("tuna") || n.includes("shrimp") || n.includes("seafood") || n.includes("prawn") || n.includes("crab"))
    return "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=400&fit=crop";

  if (n.includes("bread") || n.includes("muffin") || n.includes("biscuit") || n.includes("roll") || n.includes("loaf") || n.includes("roti") || n.includes("naan") || n.includes("paratha"))
    return "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&h=400&fit=crop";

  if (n.includes("pizza"))
    return "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop";

  if (n.includes("burger") || n.includes("sandwich") || n.includes("wrap") || n.includes("taco"))
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&h=400&fit=crop";

  if (n.includes("egg") || n.includes("omelette") || n.includes("frittata"))
    return "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=600&h=400&fit=crop";

  if (n.includes("mushroom"))
    return "https://images.unsplash.com/photo-1504544750208-dc0358e63f7f?w=600&h=400&fit=crop";

  if (n.includes("chocolate"))
    return "https://images.unsplash.com/photo-1511381939415-e44015466834?w=600&h=400&fit=crop";

  if (n.includes("cheese") || n.includes("paneer"))
    return "https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?w=600&h=400&fit=crop";

  if (n.includes("curry") || n.includes("masala") || n.includes("tandoori") || n.includes("tikka") || n.includes("sabzi"))
    return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop";

  if (n.includes("pancake") || n.includes("waffle") || n.includes("crepe") || n.includes("dosa") || n.includes("idli") || n.includes("uttapam"))
    return "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop";

  if (n.includes("smoothie") || n.includes("juice") || n.includes("drink") || n.includes("shake") || n.includes("lassi") || n.includes("chai"))
    return "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=600&h=400&fit=crop";

  if (n.includes("potato") || n.includes("fries") || n.includes("aloo"))
    return "https://images.unsplash.com/photo-1518013431117-eb1465fa5752?w=600&h=400&fit=crop";

  if (n.includes("fruit") || n.includes("mango") || n.includes("lemon") || n.includes("orange") || n.includes("apple"))
    return "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=600&h=400&fit=crop";

  if (n.includes("vegetable") || n.includes("veggie") || n.includes("tofu") || n.includes("vegan") || d.includes("vegetarian"))
    return "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop";

  if (n.includes("samosa") || n.includes("chaat") || n.includes("pakora") || n.includes("bhaji"))
    return "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&h=400&fit=crop";

  if (n.includes("halwa") || n.includes("kheer") || n.includes("ladoo") || n.includes("barfi") || n.includes("gulab"))
    return "https://images.unsplash.com/photo-1598511726623-d2e9996892f0?w=600&h=400&fit=crop";

  // Rotating fallbacks
  const fallbacks = [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1484723091739-30a097e8f929?w=600&h=400&fit=crop",
  ];

  return fallbacks[name.length % fallbacks.length];
}

// ==============================
// CSV Parser (no external library)
// ==============================
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));

  const results = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Handle quoted fields with commas inside
    const fields = [];
    let current = '';
    let inQuotes = false;

    for (let c = 0; c < line.length; c++) {
      if (line[c] === '"') {
        inQuotes = !inQuotes;
      } else if (line[c] === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += line[c];
      }
    }
    fields.push(current.trim());

    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = fields[idx] || '';
    });

    results.push(obj);
  }

  return results;
}

// ==============================
// Import Function
// ==============================
const importData = async () => {
  try {
    // 1) Connect
    await mongoose.connect('mongodb://127.0.0.1:27017/snapchef');
    console.log("✅ MongoDB Connected");

    // 2) Read CSV
    const csvPath = path.join(__dirname, 'food_recipes.csv');
    const data = parseCSV(csvPath);
    console.log(`📦 Total recipes in CSV: ${data.length}`);

    // 3) Format
    const formatted = data
      .map(r => {
        const title = (r.recipe_title || '').trim();
        if (!title) return null;

        // ingredients are pipe-separated: "Tomato|Onion|Garlic"
        const ingredients = (r.ingredients || '')
          .split('|')
          .map(i => i.toLowerCase().trim())
          .filter(Boolean);

        if (ingredients.length === 0) return null;

        const instructions = (r.instructions || '')
          .split('|')
          .join(' ')
          .trim();

        const rating = parseFloat(r.rating) || 0;
        const cuisine = (r.cuisine || '').trim();
        const course = (r.course || '').trim();
        const diet = (r.diet || '').trim();

        return {
          recipeName: title,
          ingredients,
          instructions,
          imageUrl: getFoodImage(title, diet),
          cuisine,
          course,
          diet,
          rating
        };
      })
      .filter(Boolean);

    console.log(`🍽️  Recipes after filtering: ${formatted.length}`);

    // 4) Clear old data
    await Recipe.deleteMany({});
    console.log("🗑️  Old recipes cleared");

    // 5) Insert in batches of 500
    const batchSize = 500;
    for (let i = 0; i < formatted.length; i += batchSize) {
      const batch = formatted.slice(i, i + batchSize);
      await Recipe.insertMany(batch);
      console.log(`✅ Inserted ${Math.min(i + batchSize, formatted.length)} / ${formatted.length}`);
    }

    console.log(`\n🎉 Import Complete! Total recipes: ${formatted.length}`);
    process.exit(0);

  } catch (err) {
    console.error("❌ Error during import:", err);
    process.exit(1);
  }
};

importData();