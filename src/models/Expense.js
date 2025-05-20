const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Other']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  userId: {
    type: String,
    required: true
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  syncStatus: {
    type: String,
    enum: ['synced', 'pending', 'conflict'],
    default: 'synced'
  }
}, {
  timestamps: true
});

// Index for efficient querying
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ syncStatus: 1 });

module.exports = mongoose.model('Expense', expenseSchema); 