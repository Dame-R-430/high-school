const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');
const { assignSectionDB, getSectionStatsDB } = require('../utils/sectionAssignment');

const router = express.Router();

function getEthiopianYear() {
  const now = new Date();
  const ethYear = now.getMonth() >= 8 ? now.getFullYear() - 7 : now.getFullYear() - 8;
  return ethYear % 100;
}

async function generateStudentId() {
  const yy = String(getEthiopianYear()).padStart(2, '0');
  const count = await User.countDocuments({ studentId: { $regex: `/${yy}$` }, role: 'student', status: 'approved' });
  return `${String(count + 1).padStart(4, '0')}/${yy}`;
}

router.get('/pending', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const pendingUsers = await User.find({ role: 'student', status: 'pending' })
      .select('name username studentId email grade academicYear photo grade8MinisterResult createdAt status')
      .sort({ createdAt: 1 });
    res.json(pendingUsers);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch pending registrations' });
  }
});

router.put('/:id/status', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role !== 'student') return res.status(400).json({ message: 'Only student registrations can be approved/rejected' });

    user.status = status;
    user.reviewedAt = new Date();
    user.reviewedBy = req.user.id;

    if (status === 'approved') {
      user.section = await assignSectionDB(user.grade, user.academicYear);
      user.studentId = await generateStudentId();
    }

    await user.save();
    res.json({ message: `Registration ${status}`, user: { id: user._id, name: user.name, status: user.status, section: user.section, studentId: user.studentId } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update registration status' });
  }
});

router.get('/section-stats', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { grade, academicYear } = req.query;
    if (!grade || !academicYear) return res.status(400).json({ message: 'Grade and academic year are required' });
    const stats = await getSectionStatsDB(parseInt(grade), parseInt(academicYear));
    res.json({ grade: parseInt(grade), academicYear: parseInt(academicYear), sections: stats, total: Object.values(stats).reduce((s, c) => s + c, 0) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch section statistics' });
  }
});

module.exports = router;
