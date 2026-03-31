const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const User = require('../models/User');
const Subject = require('../models/Subject');
const TeacherCourse = require('../models/TeacherCourse');

const router = express.Router();

router.get('/students', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  try {
    const students = await User.find({ role: 'student', status: 'approved' })
      .select('name username grade academicYear section');
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('selectedSubjects', 'name grade');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
});

// Update profile photo (Student)
router.put('/profile/photo', authenticateToken, async (req, res) => {
  try {
    const { photo } = req.body;
    if (!photo) return res.status(400).json({ message: 'Photo is required' });

    await User.findByIdAndUpdate(req.user.id, { photo });
    res.json({ message: 'Photo updated successfully' });
  } catch (error) {
    console.error('Error updating photo:', error);
    res.status(500).json({ message: 'Failed to update photo' });
  }
});

// Select subjects (Student only)
router.post('/select-subjects', authenticateToken, authorizeRoles('student'), async (req, res) => {
  try {
    const { subjectIds } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.selectedSubjects = subjectIds;
    user.subjectsSelected = true;
    user.subjectsSelectedAt = new Date();
    await user.save();

    res.json({ message: 'Subjects selected successfully' });
  } catch (error) {
    console.error('Error selecting subjects:', error);
    res.status(500).json({ message: 'Failed to select subjects' });
  }
});

// Get students by grade and academic year (Admin/Teacher)
router.get('/by-grade', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  try {
    const { grade, academicYear } = req.query;
    
    let query = { role: 'student', status: 'approved' };
    
    if (grade) {
      query.grade = parseInt(grade);
    }
    
    if (academicYear) {
      query.academicYear = parseInt(academicYear);
    }

    const students = await User.find(query)
      .select('name studentId grade academicYear section selectedSubjects')
      .populate('selectedSubjects', 'name grade');

    res.json(students);
  } catch (error) {
    console.error('Error fetching students by grade:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Get all teachers (Admin only)
router.get('/teachers', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('name username email status');
    res.json(teachers);
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
});

// Add new teacher (Admin only)
router.post('/teachers', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { name, username, password, email } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newTeacher = await User.create({
      username,
      password: bcrypt.hashSync(password, 10),
      role: 'teacher',
      name,
      email: email || '',
      status: 'approved'
    });

    res.status(201).json({ 
      id: newTeacher._id,
      name: newTeacher.name,
      username: newTeacher.username,
      email: newTeacher.email
    });
  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ message: 'Failed to create teacher' });
  }
});

// Assign courses to teacher (Admin only)
router.post('/teachers/:id/courses', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const teacherId = req.params.id;
    const { subjectId, academicYear } = req.body;

    const teacher = await User.findOne({ _id: teacherId, role: 'teacher' });
    if (!teacher) {
      return res.status(404).json({ message: 'Teacher not found' });
    }

    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: 'Subject not found' });
    }

    // Check if assignment already exists
    const exists = await TeacherCourse.findOne({
      teacherId,
      subjectId,
      academicYear: parseInt(academicYear)
    });

    if (exists) {
      return res.status(400).json({ message: 'Course already assigned to this teacher for this year' });
    }

    await TeacherCourse.create({
      teacherId,
      subjectId,
      academicYear: parseInt(academicYear)
    });

    res.status(201).json({ message: 'Course assigned successfully' });
  } catch (error) {
    console.error('Error assigning course:', error);
    res.status(500).json({ message: 'Failed to assign course' });
  }
});

// Get teacher's courses (Admin/Teacher)
router.get('/teachers/:id/courses', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
  try {
    const teacherId = req.params.id;
    
    // Teachers can only view their own courses unless they're admin
    if (req.user.role === 'teacher' && req.user.id !== teacherId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const teacherCourses = await TeacherCourse.find({ teacherId })
      .populate('subjectId', 'name grade');
    
    const coursesWithDetails = teacherCourses.map(tc => ({
      subjectId: tc.subjectId._id,
      subjectName: tc.subjectId.name,
      grade: tc.subjectId.grade,
      academicYear: tc.academicYear
    }));

    res.json(coursesWithDetails);
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    res.status(500).json({ message: 'Failed to fetch courses' });
  }
});

// Remove course from teacher (Admin only)
router.delete('/teachers/:teacherId/courses/:subjectId/:year', authenticateToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const { teacherId, subjectId, year } = req.params;
    const academicYear = parseInt(year);

    const result = await TeacherCourse.findOneAndDelete({
      teacherId,
      subjectId,
      academicYear
    });

    if (!result) {
      return res.status(404).json({ message: 'Course assignment not found' });
    }

    res.json({ message: 'Course removed successfully' });
  } catch (error) {
    console.error('Error removing course:', error);
    res.status(500).json({ message: 'Failed to remove course' });
  }
});

// Change password (All users)
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    user.password = bcrypt.hashSync(newPassword, 10);
    await user.save();
    
    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

module.exports = router;
