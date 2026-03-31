const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const upload = require('../middleware/upload');

const router = express.Router();

function getEthiopianYear() {
  const now = new Date();
  const ethYear = now.getMonth() >= 8 ? now.getFullYear() - 7 : now.getFullYear() - 8;
  return ethYear % 100;
}

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    if (!bcrypt.compareSync(password, user.password))
      return res.status(401).json({ message: 'Invalid credentials' });
    if (user.role === 'student' && user.status === 'pending')
      return res.status(403).json({ message: 'Your account is pending admin approval. Please wait for approval before logging in.' });
    if (user.role === 'student' && user.status === 'rejected')
      return res.status(403).json({ message: 'Your registration was rejected. Please contact the administrator.' });

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: { id: user._id, username: user.username, name: user.name, role: user.role, grade: user.grade, academicYear: user.academicYear }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

router.post('/register', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'grade8MinisterResult', maxCount: 1 }
]), async (req, res) => {
  try {
    const { username, password, name, email, grade, academicYear } = req.body;
    const gradeNum = parseInt(grade);

    if (!req.files?.photo?.[0])
      return res.status(400).json({ message: 'Photo is required for registration' });

    if (gradeNum === 9 && !req.files?.grade8MinisterResult?.[0])
      return res.status(400).json({ message: 'Grade 8 Minister result is required for Grade 9 registration' });

    if (await User.findOne({ username }))
      return res.status(400).json({ message: 'Username already exists' });

    if (email && await User.findOne({ email, role: 'student' }))
      return res.status(400).json({ message: 'This email is already registered' });

    const duplicateName = await User.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') },
      grade: gradeNum, role: 'student'
    });
    if (duplicateName)
      return res.status(400).json({ message: 'A student with this name is already registered in this grade.' });

    const photoBuffer = req.files.photo[0].buffer;
    const photoBase64 = photoBuffer.toString('base64');
    const photoHash = crypto.createHash('md5').update(photoBuffer).digest('hex');

    if (await User.findOne({ photoHash, role: 'student' }))
      return res.status(400).json({ message: 'This photo is already registered in the system.' });

    const userData = {
      username,
      password: bcrypt.hashSync(password, 10),
      role: 'student',
      name,
      grade: gradeNum,
      academicYear: parseInt(academicYear),
      email: email || null,
      photo: photoBase64,
      photoHash,
      status: 'pending',
      subjectsSelected: false
    };

    if (gradeNum === 9) {
      const ministerBuffer = req.files.grade8MinisterResult[0].buffer;
      userData.grade8MinisterResult = ministerBuffer.toString('base64');
      userData.grade8MinisterHash = crypto.createHash('md5').update(ministerBuffer).digest('hex');
    }

    await User.create(userData);
    res.status(201).json({ message: 'Registration submitted successfully. Please wait for admin approval before you can login.' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

module.exports = router;
