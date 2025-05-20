const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Expense = require('../models/Expense');

// Validation middleware
const validateExpense = [
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('category').isIn(['Food', 'Transport', 'Entertainment', 'Bills', 'Shopping', 'Other'])
    .withMessage('Invalid category'),
  body('date').isISO8601().withMessage('Invalid date format')
];

// Get all expenses for a user
router.get('/:userId', async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.params.userId })
      .sort({ date: -1 });
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new expense
router.post('/', validateExpense, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const expense = new Expense({
      ...req.body,
      lastModified: new Date(),
      syncStatus: 'synced'
    });
    const savedExpense = await expense.save();
    res.status(201).json(savedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update expense
router.put('/:id', validateExpense, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // Check for conflicts
    if (expense.lastModified > new Date(req.body.lastModified)) {
      return res.status(409).json({ 
        message: 'Conflict detected',
        serverVersion: expense
      });
    }

    Object.assign(expense, {
      ...req.body,
      lastModified: new Date(),
      syncStatus: 'synced'
    });

    const updatedExpense = await expense.save();
    res.json(updatedExpense);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Sync endpoint for mobile app
router.post('/sync', async (req, res) => {
  try {
    const { userId, lastSyncTime, pendingChanges } = req.body;
    
    // Get server changes since last sync
    const serverChanges = await Expense.find({
      userId,
      lastModified: { $gt: new Date(lastSyncTime) }
    });

    // Process pending changes from client
    const syncResults = await Promise.all(
      pendingChanges.map(async (change) => {
        try {
          if (change.type === 'create') {
            const newExpense = new Expense(change.data);
            await newExpense.save();
            return { status: 'success', id: newExpense._id };
          } else if (change.type === 'update') {
            const expense = await Expense.findById(change.id);
            if (!expense) return { status: 'error', message: 'Expense not found' };
            
            if (expense.lastModified > new Date(change.data.lastModified)) {
              return { 
                status: 'conflict',
                serverVersion: expense
              };
            }
            
            Object.assign(expense, change.data);
            await expense.save();
            return { status: 'success' };
          } else if (change.type === 'delete') {
            await Expense.findByIdAndDelete(change.id);
            return { status: 'success' };
          }
        } catch (error) {
          return { status: 'error', message: error.message };
        }
      })
    );

    res.json({
      serverChanges,
      syncResults
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 