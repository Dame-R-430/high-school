const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Subject = require('../models/Subject');

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grade-submission');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Subject.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    await User.create({
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      name: 'Admin User',
      status: 'approved'
    });

    // Create sample teacher
    await User.create({
      username: 'teacher1',
      password: bcrypt.hashSync('teacher123', 10),
      role: 'teacher',
      name: 'John Teacher',
      email: 'teacher@example.com',
      status: 'approved'
    });

    // Create sample student
    await User.create({
      username: 'student1',
      password: bcrypt.hashSync('student123', 10),
      role: 'student',
      name: 'Jane Student',
      grade: 9,
      section: 'A',
      academicYear: 2026,
      studentId: 'STU2024001',
      email: 'student@example.com',
      status: 'approved',
      registrationOrder: 1
    });

    console.log('Created default users');

    // Create subjects for grades 9-12
    const subjects = [
      // Grade 9
      { name: 'Mathematics', grade: 9 },
      { name: 'English', grade: 9 },
      { name: 'Science', grade: 9 },
      { name: 'Social Studies', grade: 9 },
      { name: 'Physical Education', grade: 9 },
      
      // Grade 10
      { name: 'Mathematics', grade: 10 },
      { name: 'English', grade: 10 },
      { name: 'Physics', grade: 10 },
      { name: 'Chemistry', grade: 10 },
      { name: 'Biology', grade: 10 },
      
      // Grade 11
      { name: 'Mathematics', grade: 11 },
      { name: 'English', grade: 11 },
      { name: 'Physics', grade: 11 },
      { name: 'Chemistry', grade: 11 },
      { name: 'Computer Science', grade: 11 },
      
      // Grade 12
      { name: 'Mathematics', grade: 12 },
      { name: 'English', grade: 12 },
      { name: 'Physics', grade: 12 },
      { name: 'Chemistry', grade: 12 },
      { name: 'Economics', grade: 12 }
    ];

    await Subject.insertMany(subjects);
    console.log('Created subjects for grades 9-12');

    console.log('Seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
