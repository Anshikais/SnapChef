const mongoose = require('mongoose');

const scanHistorySchema = new mongoose.Schema({

  clerkUserId: {
    type: String,
    required: true
  },

  imageUrl: {
    type: String,
    required: true
  },

  ingredients: {
    type: [String],
    default: []
  },

  scannedAt: {
    type: Date,
    default: Date.now
  }

});

module.exports = mongoose.model(
  'ScanHistory',
  scanHistorySchema
);