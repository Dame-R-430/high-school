const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Subject = require('../models/Subject');
const TeacherCourse = require('../models/TeacherCourse');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grade-submission');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Subject.deleteMany({});
    await TeacherCourse.deleteMany({});

    // Create admin user
    console.log('Creating admin user...');
    const admin = await User.create({
      username: 'admin',
      password: bcrypt.hashSync('admin123', 10),
      role: 'admin',
      name: 'Admin User',
      status: 'approved'
    });

    // Create teacher
    console.log('Creating teacher...');
    const teacher = await User.create({
      username: 'teacher1',
      password: bcrypt.hashSync('teacher123', 10),
      role: 'teacher',
      name: 'John Teacher',
      status: 'approved',
      email: 'teacher@example.com'
    });

    // Create subjects first
    console.log('Creating subjects...');
    const subjects = await Subject.insertMany([
      { name: 'Mathematics', grade: 9 },
      { name: 'English', grade: 9 },
      { name: 'Science', grade: 9 },
      { name: 'History', grade: 9 },
      { name: 'Physics', grade: 10 },
      { name: 'Chemistry', grade: 10 },
      { name: 'Biology', grade: 11 },
      { name: 'Computer Science', grade: 12 }
    ]);

    // Create sample student with subject ObjectIds
    console.log('Creating sample student...');
    const student = await User.create({
      username: 'student1',
      password: bcrypt.hashSync('student123', 10),
      role: 'student',
      name: 'Jane Student',
      grade: 9,
      section: 'A',
      academicYear: 2026,
      studentId: 'STU2024001',
      email: 'jane@example.com',
      status: 'approved',
      subjectsSelected: true,
      selectedSubjects: [subjects[0]._id, subjects[1]._id],
      registrationOrder: 1
    });

    // Assign courses to teacher
    console.log('Assigning courses to teacher...');
    await TeacherCourse.create({
      teacherId: teacher._id,
      subjectId: subjects[0]._id,
      academicYear: 2026
    });

    console.log('\n✅ Database seeded successfully!');
    console.log('\nDefault credentials:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Teacher: username=teacher1, password=teacher123');
    console.log('Student: username=student1, password=student123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
