const mongoose = require('mongoose');
const fs = require('fs');

// Schema
const recipeSchema = new mongoose.Schema({
  recipeName: String,
  ingredients: [String],
  instructions: String,
  imageUrl: String
});

const Recipe = mongoose.model('Recipe', recipeSchema);

const importData = async () => {
  try {
    // 1) Connect
    await mongoose.connect('mongodb://127.0.0.1:27017/snapchef');
    console.log("MongoDB Connected");

    // 2) Read JSON
    const raw = fs.readFileSync(
      'D:/PROJECT/backend/full_format_recipes.json',
      'utf-8'
    );
    const data = JSON.parse(raw);

    // 3) Clean + format
    const formatted = data
      .slice(0, 1000)
      .map(r => {
        const title = (r.title || 'food').trim();

        const keyword = encodeURIComponent(title.split(' ')[0] || 'food');

        const ingredients = Array.isArray(r.ingredients)
          ? r.ingredients
              .map(i => String(i).toLowerCase().trim())
              .filter(Boolean)
          : [];

        const instructions = Array.isArray(r.directions)
          ? r.directions.join(' ')
          : (r.directions || '');

        function getFoodImage(name) {
          const n = name.toLowerCase();

          if (n.includes("pasta")) return "https://images.unsplash.com/photo-1521389508051-d7ffb5dc8d23?w=600&h=400&fit=crop";
          if (n.includes("chicken")) return "https://images.unsplash.com/photo-1604908176997-4315fbd6f6e4?w=600&h=400&fit=crop";
          if (n.includes("salad")) return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop";
          if (n.includes("cake") || n.includes("dessert")) return "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&h=400&fit=crop";
          if (n.includes("rice")) return "https://images.unsplash.com/photo-1512058564366-c9e3e0464f15?w=600&h=400&fit=crop";

          return "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop";
        }

        return {
          recipeName: title,
          ingredients,
          instructions,
          // ✅ FIXED LINE
          imageUrl: getFoodImage(title)
        };
      })
      .filter(r => r.recipeName && r.ingredients.length);

    // 4) Clear old data
    await Recipe.deleteMany({});
    console.log("Old recipes cleared");

    // 5) Insert new data
    await Recipe.insertMany(formatted);
    console.log("✅ Recipes Imported Successfully:", formatted.length);

    process.exit();

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
};

importData();