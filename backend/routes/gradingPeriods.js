const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const GradingPeriod = require('../models/GradingPeriod');

const router = express.Router();

// GET /grading-periods/active — anyone can check if grading is open
router.get('/active', authenticateToken, async (req, res) => {
  try {
    const now = new Date();
    const period = await GradingPeriod.findOne({
      openDate:  { $lte: now },
      closeDate: { $gte: now }
    }).sort({ openDate: -1 });
    res.json(period || null);
  } catch (e) {
    res.status(500).json({ message: 'Failed to check grading period' });
  }
});

// GET /grading-periods — admin sees all
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const periods = await GradingPeriod.find().sort({ openDate: -1 });
    res.json(periods);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch grading periods' });
  }
});

// POST /grading-periods — admin creates a period
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { label, openDate, closeDate } = req.body;
    if (!label || !openDate || !closeDate)
      return res.status(400).json({ message: 'Label, open date and close date are required' });
    if (new Date(closeDate) <= new Date(openDate))
      return res.status(400).json({ message: 'Close date must be after open date' });

    const period = await GradingPeriod.create({
      label, openDate, closeDate, createdBy: req.user.id
    });
    res.status(201).json(period);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create grading period' });
  }
});

// DELETE /grading-periods/:id — admin deletes
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    await GradingPeriod.findByIdAndDelete(req.params.id);
    res.json({ message: 'Grading period deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete grading period' });
  }
});

module.exports = router;
