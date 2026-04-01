const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Build ranked list from students who have a calculated average
async function getRankedStudents(query = {}) {
  const students = await User.find({
    role: 'student',
    status: 'approved',
    average: { $ne: null },
    ...query
  }).select('name studentId grade section academicYear average passed nextGrade');

  // Sort by average descending
  students.sort((a, b) => (b.average || 0) - (a.average || 0));

  // Assign rank (ties share the same rank)
  let rank = 1;
  return students.map((s, i) => {
    if (i > 0 && s.average < students[i - 1].average) rank = i + 1;
    return { ...s.toObject(), rank };
  });
}

// GET /rankings/class?grade=9&section=A&academicYear=2026
// Returns students ranked within a specific class
router.get('/class', authenticateToken, authorizeRoles('admin', 'teacher'), async (req, res) => {
  try {
    const { grade, section, academicYear } = req.query;
    const query = {};
    if (grade)        query.grade = parseInt(grade);
    if (section)      query.section = section;
    if (academicYear) query.academicYear = parseInt(academicYear);

    const ranked = await getRankedStudents(query);
    res.json(ranked);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch class rankings' });
  }
});

// GET /rankings/top3 — top 3 school-wide (admin only)
router.get('/top3', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { academicYear } = req.query;
    const query = academicYear ? { academicYear: parseInt(academicYear) } : {};
    const ranked = await getRankedStudents(query);
    res.json(ranked.slice(0, 3));
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch top 3' });
  }
});

// GET /rankings/shared — top 3 that admin has published (visible to all)
router.get('/shared', authenticateToken, async (req, res) => {
  try {
    const { academicYear } = req.query;
    const query = { sharedResult: true };
    if (academicYear) query.academicYear = parseInt(academicYear);
    const students = await User.find({
      role: 'student', status: 'approved',
      average: { $ne: null },
      sharedResult: true,
      ...(academicYear ? { academicYear: parseInt(academicYear) } : {})
    }).select('name studentId grade section academicYear average passed nextGrade rank')
      .sort({ average: -1 });
    res.json(students);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch shared results' });
  }
});

// POST /rankings/share — admin shares top 3 (marks them as shared, read-only)
router.post('/share', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { academicYear } = req.body;
    const query = academicYear ? { academicYear: parseInt(academicYear) } : {};
    const ranked = await getRankedStudents(query);
    const top3 = ranked.slice(0, 3);

    // Clear previous shared flags for this year
    await User.updateMany(
      { role: 'student', ...(academicYear ? { academicYear: parseInt(academicYear) } : {}) },
      { $unset: { sharedResult: '' } }
    );

    // Mark top 3 as shared with their rank
    for (let i = 0; i < top3.length; i++) {
      await User.findByIdAndUpdate(top3[i]._id, { sharedResult: true, rank: i + 1 });
    }

    res.json({ message: `Top ${top3.length} results shared successfully`, shared: top3 });
  } catch (e) {
    res.status(500).json({ message: 'Failed to share results' });
  }
});

module.exports = router;
