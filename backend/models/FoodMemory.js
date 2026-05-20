const mongoose = require('mongoose');

const foodMemorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  foodName: {
    type: String,
    required: true
  },
  uploadTime: {
    type: Date,
    default: Date.now
  },
  mealType: {
    type: String,
    required: true
  },
  aiSuggestions: {
    recipes: {
      type: [String],
      default: []
    },
    healthierAlternatives: {
      type: [String],
      default: []
    },
    complementaryFoods: {
      type: [String],
      default: []
    },
    nutritionTips: {
      type: [String],
      default: []
    }
  },
  similarityScore: {
    type: Number,
    default: 0
  },
  imageHash: {
    type: String
  }
}, { timestamps: true });

module.exports = mongoose.model('FoodMemory', foodMemorySchema);
