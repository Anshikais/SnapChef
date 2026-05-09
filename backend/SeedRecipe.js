const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// ── Recipe Schema (must match your models/Recipe.js) ──────────────────────────
const recipeSchema = new mongoose.Schema({
  title:        String,
  description:  String,
  cuisine:      String,
  course:       String,
  diet:         String,
  prep_time:    String,
  cook_time:    String,
  ingredients:  [String],
  instructions: [String],
  author:       String,
  tags:         [String],
  category:     String,
  rating:       Number,
  url:          String,
});

const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);

// ── Simple CSV parser (handles quoted fields with commas inside) ───────────────
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Clear existing recipes
    await Recipe.deleteMany({});
    console.log('🗑️  Cleared existing recipes');

    const csvPath = path.join(__dirname, 'food_recipes.csv');
    const raw = fs.readFileSync(csvPath, 'utf-8');
    const lines = raw.split('\n').filter(l => l.trim());

    // Parse header
    const headers = parseCSVLine(lines[0]);
    console.log('📋 Headers:', headers);

    const recipes = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        if (values.length < 5) continue;

        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        // Split pipe-separated ingredients and instructions
        const ingredients = row['ingredients']
          ? row['ingredients'].split('|').map(s => s.trim()).filter(Boolean)
          : [];

        const instructions = row['instructions']
          ? row['instructions'].split('|').map(s => s.trim()).filter(Boolean)
          : [];

        const tags = row['tags']
          ? row['tags'].split('|').map(s => s.trim()).filter(Boolean)
          : [];

        recipes.push({
          title:        row['recipe_title'] || '',
          description:  row['description'] || '',
          cuisine:      row['cuisine'] || '',
          course:       row['course'] || '',
          diet:         row['diet'] || '',
          prep_time:    row['prep_time'] || '',
          cook_time:    row['cook_time'] || '',
          ingredients,
          instructions,
          author:       row['author'] || '',
          tags,
          category:     row['category'] || '',
          rating:       parseFloat(row['rating']) || 0,
          url:          row['url'] || '',
        });
      } catch (err) {
        // skip bad rows
      }
    }

    console.log(`📦 Parsed ${recipes.length} recipes, inserting...`);

    // Insert in batches of 500
    const batchSize = 500;
    for (let i = 0; i < recipes.length; i += batchSize) {
      await Recipe.insertMany(recipes.slice(i, i + batchSize), { ordered: false });
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}`);
    }

    console.log(`🎉 Done! ${recipes.length} recipes seeded into MongoDB.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
}

seed();