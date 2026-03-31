const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const gradeRoutes = require('./routes/grades');
const userRoutes = require('./routes/users');
const registrationRoutes = require('./routes/registrations');

// Connect to MongoDB
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/registrations', registrationRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
