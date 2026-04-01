const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const ProfileEditRequest = require('../models/ProfileEditRequest');
const User = require('../models/User');

const router = express.Router();

// Teacher submits a profile edit request
router.post('/', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name && !email) return res.status(400).json({ message: 'Provide at least name or email to update' });

    // Cancel any existing pending request from this user
    await ProfileEditRequest.deleteMany({ userId: req.user.id, status: 'pending' });

    const request = await ProfileEditRequest.create({
      userId: req.user.id,
      requestedName: name || undefined,
      requestedEmail: email || undefined
    });
    res.status(201).json({ message: 'Edit request submitted. Waiting for admin approval.', request });
  } catch (e) {
    res.status(500).json({ message: 'Failed to submit request' });
  }
});

// Admin: get all pending profile edit requests (used for notifications)
router.get('/pending', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const requests = await ProfileEditRequest.find({ status: 'pending' })
      .populate('userId', 'name username email role')
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch requests' });
  }
});

// Admin: approve or reject
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const request = await ProfileEditRequest.findById(req.params.id).populate('userId');
    if (!request) return res.status(404).json({ message: 'Request not found' });

    request.status = status;
    await request.save();

    if (status === 'approved') {
      const user = await User.findById(request.userId);
      if (user) {
        if (request.requestedName)  user.name  = request.requestedName;
        if (request.requestedEmail) user.email = request.requestedEmail;
        await user.save();
      }
    }

    res.json({ message: `Request ${status}` });
  } catch (e) {
    res.status(500).json({ message: 'Failed to update request' });
  }
});

// Teacher: get their own request status
router.get('/mine', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  try {
    const request = await ProfileEditRequest.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(request || null);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch request' });
  }
});

module.exports = router;
