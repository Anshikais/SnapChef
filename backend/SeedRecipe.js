const mongoose = require('mongoose');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config();

const recipeSchema = new mongoose.Schema({
  title: String,
  description: String,
  cuisine: String,
  course: String,
  diet: String,
  prep_time: String,
  cook_time: String,
  ingredients: [String],
  instructions: [String],
  author: String,
  tags: [String],
  category: String,
  rating: Number,
  url: String,
});

const Recipe =
  mongoose.models.Recipe || mongoose.model('Recipe', recipeSchema);

function parseList(text) {
  if (!text) return [];

  return text
    .split(/\||\n|\. /)
    .map(s => s.trim())
    .filter(Boolean);
}

async function seed() {
  try {
    // MongoDB Connect
    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB Connected');

    // Delete old recipes
    await Recipe.deleteMany({});
    console.log('Old recipes deleted');

    const recipes = [];

    fs.createReadStream('food_recipes.csv')
      .pipe(
        csv({
          mapHeaders: ({ header }) => header.trim(),
        })
      )

      .on('data', (row) => {
        try {
          // DEBUG
          console.log('ROW DATA:', row);

          recipes.push({
            title: row.recipe_title || '',
            description: row.description || '',
            cuisine: row.cuisine || '',
            course: row.course || '',
            diet: row.diet || '',
            prep_time: row.prep_time || '',
            cook_time: row.cook_time || '',

            ingredients: parseList(
              row.ingredients || row.Ingredients || ''
            ),

            instructions: parseList(
              row.instructions ||
              row.Instructions ||
              row.directions ||
              row.steps ||
              ''
            ),

            author: row.author || '',

            tags: parseList(
              row.tags || ''
            ),

            category: row.category || '',

            rating: parseFloat(row.rating) || 0,

            url: row.url || '',
          });
        } catch (err) {
          console.log('Row Error:', err.message);
        }
      })

      .on('end', async () => {
        try {
          console.log('Parsed Recipes:', recipes.length);

          for (let i = 0; i < recipes.length; i += 500) {
            await Recipe.insertMany(
              recipes.slice(i, i + 500),
              { ordered: false }
            );

            console.log(`Batch ${i / 500 + 1} inserted`);
          }

          console.log('Seeding Completed Successfully');

          process.exit();
        } catch (err) {
          console.log('Insert Error:', err.message);
          process.exit(1);
        }
      })

      .on('error', (err) => {
        console.log('CSV Error:', err.message);
      });

  } catch (err) {
    console.log('MongoDB Error:', err.message);
  }
}

seed();