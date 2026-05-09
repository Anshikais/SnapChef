const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

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

function parseCSV(content) {
  const results = [];

  // Parse a single CSV line respecting quotes
  function parseLine(str) {
    const fields = [];
    let field = '';
    let inQ = false;
    for (let j = 0; j < str.length; j++) {
      const c = str[j];
      if (c === '"') {
        if (inQ && str[j + 1] === '"') {
          field += '"';
          j++;
        } else {
          inQ = !inQ;
        }
      } else if (c === ',' && !inQ) {
        fields.push(field);
        field = '';
      } else {
        field += c;
      }
    }
    fields.push(field);
    return fields;
  }

  // Split into lines respecting quoted newlines
  const lines = [];
  let line = '';
  let inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      line += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && content[i+1] === '\n') i++; // skip \r\n
      if (line.trim()) lines.push(line);
      line = '';
    } else {
      line += ch;
    }
  }
  if (line.trim()) lines.push(line);

  if (lines.length < 2) return results;

  const headers = parseLine(lines[0]).map(h => h.trim());
  console.log('Headers:', headers);

  for (let li = 1; li < lines.length; li++) {
    if (!lines[li].trim()) continue;
    try {
      const values = parseLine(lines[li]);
      const row = {};
      headers.forEach((h, idx) => {
        row[h] = (values[idx] || '').trim();
      });
      results.push(row);
    } catch (e) {
      // skip bad rows
    }
  }

  return results;
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    await Recipe.deleteMany({});
    console.log('🗑️  Cleared existing recipes');

    const csvPath = path.join(__dirname, 'food_recipes.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');

    const rows = parseCSV(content);
    console.log(`📋 Parsed ${rows.length} rows`);

    // Debug first row
    if (rows[0]) {
      console.log('Sample instructions raw:', rows[0]['instructions']?.substring(0, 150));
    }

    const recipes = rows.map(row => {
      const ingredients = row['ingredients']
        ? row['ingredients'].split('|').map(s => s.trim()).filter(Boolean)
        : [];

      const instructions = row['instructions']
        ? row['instructions'].split('|').map(s => s.trim()).filter(Boolean)
        : [];

      const tags = row['tags']
        ? row['tags'].split('|').map(s => s.trim()).filter(Boolean)
        : [];

      return {
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
      };
    }).filter(r => r.title);

    console.log(`📦 ${recipes.length} recipes ready`);
    console.log('Sample instructions array:', recipes[0]?.instructions?.slice(0, 2));

    const batchSize = 500;
    for (let i = 0; i < recipes.length; i += batchSize) {
      await Recipe.insertMany(recipes.slice(i, i + batchSize), { ordered: false });
      console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}`);
    }

    console.log(`🎉 Done! ${recipes.length} recipes seeded.`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

seed();