const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const recipeSchema = new mongoose.Schema({
  title: String, description: String, cuisine: String, course: String,
  diet: String, prep_time: String, cook_time: String,
  ingredients: [String], instructions: [String],
  author: String, tags: [String], category: String, rating: Number, url: String,
});
const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected');
  await Recipe.deleteMany({});

  const content = fs.readFileSync(require('path').join(__dirname, 'food_recipes.csv'), 'utf-8');

  const lines = [];
  let line = '', inQuotes = false;
  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '"') { inQuotes = !inQuotes; line += ch; }
    else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && content[i+1] === '\n') i++;
      if (line.trim()) lines.push(line);
      line = '';
    } else line += ch;
  }
  if (line.trim()) lines.push(line);

  function parseLine(str) {
    const fields = []; let field = '', inQ = false;
    for (let j = 0; j < str.length; j++) {
      const c = str[j];
      if (c === '"') { if (inQ && str[j+1]==='"'){field+='"';j++;}else inQ=!inQ; }
      else if (c === ',' && !inQ) { fields.push(field); field = ''; }
      else field += c;
    }
    fields.push(field);
    return fields;
  }

  const headers = parseLine(lines[0]).map(h => h.trim());
  console.log('Headers:', headers);

  const recipes = [];
  for (let li = 1; li < lines.length; li++) {
    try {
      const values = parseLine(lines[li]);
      const row = {};
      headers.forEach((h, idx) => { row[h] = (values[idx]||'').trim(); });
      if (!row['recipe_title']) continue;
      recipes.push({
        title: row['recipe_title'],
        description: row['description']||'',
        cuisine: row['cuisine']||'', course: row['course']||'', diet: row['diet']||'',
        prep_time: row['prep_time']||'', cook_time: row['cook_time']||'',
        ingredients: (row['ingredients']||'').split('|').map(s=>s.trim()).filter(Boolean),
        instructions: (row['instructions']||'').split('|').map(s=>s.trim()).filter(Boolean),
        tags: (row['tags']||'').split('|').map(s=>s.trim()).filter(Boolean),
        author: row['author']||'', category: row['category']||'',
        rating: parseFloat(row['rating'])||0, url: row['url']||'',
      });
    } catch(e) {}
  }

  console.log('Sample instructions:', recipes[0]?.instructions?.slice(0,2));
  for (let i = 0; i < recipes.length; i += 500) {
    await Recipe.insertMany(recipes.slice(i, i+500), {ordered:false});
    console.log(`Batch ${Math.floor(i/500)+1} done`);
  }
  console.log(`Done! ${recipes.length} recipes seeded.`);
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });