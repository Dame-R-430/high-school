const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const Grade = require('../models/Grade');
const EditRequest = require('../models/EditRequest');
const User = require('../models/User');
const TeacherCourse = require('../models/TeacherCourse');
const GradingPeriod = require('../models/GradingPeriod');
const router = express.Router();

async function getActivePeriod() {
  const now = new Date();
  return GradingPeriod.findOne({ openDate: { $lte: now }, closeDate: { $gte: now } });
}

async function recalc(sid) {
  const student = await User.findById(sid);
  if (!student || student.role !== 'student') return;
  const grades = await Grade.find({ studentId: sid });
  if (!grades.length) return;
  const enrolled = (student.selectedSubjects || []).map(s => String(s));
  if (!enrolled.length) return;
  if (grades.some(g => g.ng)) {
    student.average = 0; student.passed = false;
    student.failReason = 'Non-Grade (NG) recorded - automatic failure';
    student.nextGrade = student.grade;
    await student.save(); return;
  }
  const by = {};
  grades.forEach(g => { const k = String(g.subjectId); if (!by[k]) by[k] = {}; by[k][g.semester] = g.score; });
  if (!enrolled.every(id => by[id] && by[id]['1'] !== undefined && by[id]['2'] !== undefined)) return;
  const avgs = enrolled.map(id => (by[id]['1'] + by[id]['2']) / 2);
  const overall = avgs.reduce((a, b) => a + b, 0) / avgs.length;
  const low = avgs.filter(s => s < 50).length;
  const passed = overall > 53 && low < 3;
  student.average = parseFloat(overall.toFixed(2));
  student.passed = passed;
  student.failReason = passed ? null : (low >= 3 ? low + ' subjects below 50' : 'Average ' + overall.toFixed(2) + ' not above 53');
  student.nextGrade = passed ? (student.grade < 12 ? student.grade + 1 : 'Graduated') : student.grade;
  await student.save();
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    let q = {};
    if (req.user.role === 'student') q.studentId = req.user.id;
    if (req.user.role === 'teacher') {
      const c = await TeacherCourse.find({ teacherId: req.user.id });
      q.subjectId = { $in: c.map(x => x.subjectId) };
    }
    const grades = await Grade.find(q).populate('subjectId', 'name grade').populate('studentId', 'name studentId').sort({ submittedAt: -1 });
    res.json(grades);
  } catch (e) { res.status(500).json({ message: 'Failed to fetch grades' }); }
});

router.post('/', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  try {
    const period = await getActivePeriod();
    if (!period) return res.status(403).json({ message: 'Grade submission is closed. No active grading period.' });
    const { studentId, subjectId, score, semester, ng } = req.body;
    const isNG = ng === true || ng === 'true';
    if (!isNG) { const s = parseFloat(score); if (isNaN(s) || s <= 0 || s > 100) return res.status(400).json({ message: 'Score must be 1-100' }); }
    const ex = await Grade.findOne({ studentId, subjectId, semester });
    if (ex) return res.status(400).json({ message: 'Grade already submitted' });
    const grade = await Grade.create({ studentId, subjectId, teacherId: req.user.id, score: isNG ? 0 : parseFloat(score), ng: isNG, semester, academicYear: new Date().getFullYear() });
    await recalc(studentId);
    res.status(201).json(grade);
  } catch (e) { res.status(500).json({ message: 'Failed to submit grade' }); }
});

router.post('/edit-request', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
  try {
    const { gradeId, newScore, reason, ng } = req.body;
    const grade = await Grade.findById(gradeId);
    if (!grade) return res.status(404).json({ message: 'Grade not found' });
    const isNG = ng === true || ng === 'true';
    if (!isNG) { const s = parseFloat(newScore); if (isNaN(s) || s <= 0 || s > 100) return res.status(400).json({ message: 'Score must be 1-100' }); }
    const er = await EditRequest.create({ gradeId, teacherId: req.user.id, newScore: isNG ? 0 : parseFloat(newScore), reason, ng: isNG });
    res.status(201).json({ message: 'Edit request submitted', editRequest: er });
  } catch (e) { res.status(500).json({ message: 'Failed to submit edit request' }); }
});

router.get('/edit-requests', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const r = await EditRequest.find().populate('gradeId').populate('teacherId', 'name');
    res.json(r);
  } catch (e) { res.status(500).json({ message: 'Failed to fetch edit requests' }); }
});

router.put('/edit-requests/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const request = await EditRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    request.status = status; await request.save();
    if (status === 'approved') {
      const grade = await Grade.findById(request.gradeId);
      if (grade) { grade.score = request.newScore; grade.ng = request.ng || false; grade.updatedAt = new Date(); await grade.save(); await recalc(grade.studentId); }
    }
    res.json({ message: 'Request ' + status });
  } catch (e) { res.status(500).json({ message: 'Failed to update request' }); }
});

router.get('/result/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    if (req.user.role === 'student' && req.user.id !== studentId) return res.status(403).json({ message: 'Forbidden' });
    await recalc(studentId);
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') return res.status(404).json({ message: 'Student not found' });
    if (student.average === null || student.average === undefined) return res.json({ calculated: false, message: 'Both semesters must be graded' });
    res.json({ calculated: true, average: student.average, passed: student.passed, failReason: student.failReason, currentGrade: student.grade, nextGrade: student.nextGrade });
  } catch (e) { res.status(500).json({ message: 'Failed to fetch result' }); }
});

module.exports = router;
