const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const User = require('../models/User');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/grade-submission');
  console.log('Connected');

  const existing = await User.findOne({ username: 'director' });
  if (existing) {
    console.log('Director already exists, updating password...');
    existing.password = bcrypt.hashSync('director123', 10);
    existing.role = 'director';
    existing.status = 'approved';
    await existing.save();
  } else {
    await User.create({
      username: 'director',
      password: bcrypt.hashSync('director123', 10),
      role: 'director',
      name: 'School Director',
      status: 'approved'
    });
    console.log('Director account created');
  }

  console.log('Done. Login: director / director123');
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
