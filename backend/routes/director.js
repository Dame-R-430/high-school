const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');
const Grade = require('../models/Grade');

const router = express.Router();

// GET /director/overview — school-wide stats
router.get('/overview', authenticateToken, authorizeRoles('director'), async (req, res) => {
  try {
    const grades = [9, 10, 11, 12];
    const overview = await Promise.all(grades.map(async grade => {
      const students = await User.find({ role: 'student', status: 'approved', grade });
      const withResults = students.filter(s => s.average !== null);
      const passed = withResults.filter(s => s.passed).length;
      const failed = withResults.filter(s => !s.passed).length;
      const avgScore = withResults.length
        ? parseFloat((withResults.reduce((a, s) => a + s.average, 0) / withResults.length).toFixed(2))
        : null;

      return { grade, total: students.length, graded: withResults.length, passed, failed, avgScore };
    }));

    const totalStudents = await User.countDocuments({ role: 'student', status: 'approved' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalGraded  = overview.reduce((a, g) => a + g.graded, 0);
    const totalPassed  = overview.reduce((a, g) => a + g.passed, 0);
    const totalFailed  = overview.reduce((a, g) => a + g.failed, 0);

    res.json({ totalStudents, totalTeachers, totalGraded, totalPassed, totalFailed, byGrade: overview });
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch overview' });
  }
});

// GET /director/students?grade=9&section=A — view students (read-only)
router.get('/students', authenticateToken, authorizeRoles('director'), async (req, res) => {
  try {
    const { grade, section, academicYear } = req.query;
    const query = { role: 'student', status: 'approved' };
    if (grade)        query.grade = parseInt(grade);
    if (section)      query.section = section;
    if (academicYear) query.academicYear = parseInt(academicYear);

    const students = await User.find(query)
      .select('name studentId grade section academicYear average passed failReason nextGrade')
      .sort({ grade: 1, section: 1, average: -1 });

    res.json(students);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

module.exports = router;
