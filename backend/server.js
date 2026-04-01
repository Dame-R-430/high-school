const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');

const authRoutes = require('./routes/auth');
const subjectRoutes = require('./routes/subjects');
const gradeRoutes = require('./routes/grades');
const userRoutes = require('./routes/users');
const registrationRoutes = require('./routes/registrations');
const profileRequestRoutes = require('./routes/profileRequests');
const gradingPeriodRoutes  = require('./routes/gradingPeriods');
const rankingRoutes        = require('./routes/rankings');
const directorRoutes       = require('./routes/director');
const registrationPeriodRoutes = require('./routes/registrationPeriods');

// Connect to MongoDB
connectDB();

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/grades', gradeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/profile-requests', profileRequestRoutes);
app.use('/api/grading-periods', gradingPeriodRoutes);
app.use('/api/rankings', rankingRoutes);
app.use('/api/director', directorRoutes);
app.use('/api/registration-periods', registrationPeriodRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
