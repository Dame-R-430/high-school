const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Subject = require('../models/Subject');

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const query = req.query.grade ? { grade: parseInt(req.query.grade) } : {};
    const subjects = await Subject.find(query).sort({ grade: 1, name: 1 });
    res.json(subjects);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch subjects' });
  }
});

// GET /subjects/teachers?grade=9&academicYear=2026
// Returns map of subjectId -> teacher name for the slip
router.get('/teachers', authenticateToken, async (req, res) => {
  try {
    const { grade, academicYear } = req.query;
    const TeacherCourse = require('../models/TeacherCourse');
    const User = require('../models/User');

    let subjectQuery = {};
    if (grade) subjectQuery.grade = parseInt(grade);
    const subjects = await Subject.find(subjectQuery);
    const subjectIds = subjects.map(s => s._id);

    const assignments = await TeacherCourse.find({
      subjectId: { $in: subjectIds },
      ...(academicYear ? { academicYear: parseInt(academicYear) } : {})
    }).populate('teacherId', 'name');

    // Build map: subjectId -> teacher name
    const map = {};
    assignments.forEach(a => {
      map[String(a.subjectId)] = a.teacherId?.name || 'TBA';
    });

    res.json(map);
  } catch (e) {
    res.status(500).json({ message: 'Failed to fetch subject teachers' });
  }
});

router.post('/', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, grade } = req.body;
    const subject = await Subject.create({ name, grade: parseInt(grade) });
    res.status(201).json(subject);
  } catch (e) {
    res.status(500).json({ message: 'Failed to create subject' });
  }
});

router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json({ message: 'Subject deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Failed to delete subject' });
  }
});

module.exports = router;
