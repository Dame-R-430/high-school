const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const RegistrationPeriod = require('../models/RegistrationPeriod');

const router = express.Router();

// Public — anyone can check if registration is open (used on login page)
router.get('/active', async (req, res) => {
  try {
    const now = new Date();
    const period = await RegistrationPeriod.findOne({
      openDate:  { $lte: now },
      closeDate: { $gte: now }
    }).sort({ openDate: -1 });
    res.json(period || null);
  } catch (e) {
    res.status(500).json({ message: 'Failed to check registration period' });
  }
});

// Admin — list all
router.get('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const periods = await RegistrationPeriod.find().sort({ openDate: -1 });
    res.json(periods);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch registration periods' });
  }
});

// Admin — create
router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { label, openDate, closeDate } = req.body;
    if (!label || !openDate || !closeDate)
      return res.status(400).json({ message: 'Label, open date and close date are required' });
    if (new Date(closeDate) <= new Date(openDate))
      return res.status(400).json({ message: 'Close date must be after open date' });
    const period = await RegistrationPeriod.create({ label, openDate, closeDate, createdBy: req.user.id });
    res.status(201).json(period);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create registration period' });
  }
});

// Admin — delete
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    await RegistrationPeriod.findByIdAndDelete(req.params.id);
    res.json({ message: 'Registration period deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete registration period' });
  }
});

module.exports = router;
