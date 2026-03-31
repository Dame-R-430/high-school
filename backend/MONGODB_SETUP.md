# MongoDB Setup Guide

This guide will help you migrate from in-memory storage to MongoDB for production use.

## Why MongoDB?

For a large-scale school system, MongoDB provides:
- **Persistent storage**: Data survives server restarts
- **Scalability**: Handles thousands of students, teachers, and grades
- **Performance**: Indexed queries for fast data retrieval
- **Reliability**: Data backup and recovery options
- **Concurrent access**: Multiple users can access simultaneously
- **Data integrity**: ACID transactions for critical operations

## Installation Options

### Option 1: Local MongoDB (Development)

1. **Download MongoDB Community Server**
   - Visit: https://www.mongodb.com/try/download/community
   - Choose your OS (Windows/Mac/Linux)
   - Install with default settings

2. **Start MongoDB Service**
   
   Windows:
   ```bash
   # MongoDB usually starts automatically as a service
   # To check status:
   net start MongoDB
   ```

   Mac:
   ```bash
   brew services start mongodb-community
   ```

   Linux:
   ```bash
   sudo systemctl start mongod
   sudo systemctl enable mongod
   ```

3. **Verify Installation**
   ```bash
   mongosh
   # Should connect to mongodb://localhost:27017
   ```

### Option 2: MongoDB Atlas (Cloud - Recommended for Production)

MongoDB Atlas is a fully managed cloud database service (FREE tier available).

1. **Create Account**
   - Visit: https://www.mongodb.com/cloud/atlas/register
   - Sign up for free

2. **Create Cluster**
   - Choose FREE tier (M0)
   - Select region closest to your users
   - Click "Create Cluster"

3. **Setup Database Access**
   - Go to "Database Access"
   - Add new database user
   - Choose password authentication
   - Save username and password

4. **Setup Network Access**
   - Go to "Network Access"
   - Add IP Address
   - For development: Allow access from anywhere (0.0.0.0/0)
   - For production: Add specific IP addresses

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

   Example:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/grade-submission?retryWrites=true&w=majority
   ```

## Configuration

1. **Update .env file**
   ```env
   PORT=3000
   JWT_SECRET=your_jwt_secret_key_change_this_in_production
   
   # For local MongoDB:
   MONGODB_URI=mongodb://localhost:27017/grade-submission
   
   # For MongoDB Atlas:
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/grade-submission?retryWrites=true&w=majority
   ```

2. **Seed the Database**
   ```bash
   cd backend
   node scripts/migrate-to-mongodb.js
   ```

   This will:
   - Clear existing data
   - Create admin, teacher, and sample student accounts
   - Create sample subjects
   - Assign sample courses

## Migration Steps

### Step 1: Install MongoDB
Choose Option 1 (Local) or Option 2 (Atlas) above.

### Step 2: Update Environment Variables
Edit `backend/.env` with your MongoDB connection string.

### Step 3: Run Migration Script
```bash
cd backend
node scripts/migrate-to-mongodb.js
```

### Step 4: Update Routes (Already Done)
The following routes have been updated to use MongoDB:
- ✅ Authentication (login, register)
- ✅ Registrations (approve/reject, section stats)
- ⚠️ Users (needs update)
- ⚠️ Subjects (needs update)
- ⚠️ Grades (needs update)

### Step 5: Start Server
```bash
npm start
```

## Verification

1. **Check MongoDB Connection**
   - Server should log: "MongoDB connected successfully"

2. **Test Login**
   - Admin: username=admin, password=admin123
   - Teacher: username=teacher1, password=teacher123
   - Student: username=student1, password=student123

3. **Test Registration**
   - Register a new student
   - Login as admin and approve
   - Verify section is automatically assigned

## Database Structure

### Collections

1. **users**
   - Stores students, teachers, and admins
   - Indexed on: username, studentId, email, photoHash
   - Section assignment on approval

2. **subjects**
   - Stores available subjects per grade
   - Indexed on: grade

3. **grades**
   - Stores student grades
   - Indexed on: studentId, subjectId, academicYear, semester
   - Unique constraint prevents duplicate grades

4. **teachercourses**
   - Maps teachers to subjects and academic years
   - Indexed on: teacherId, subjectId, academicYear

5. **editrequests**
   - Stores grade edit requests from teachers
   - Indexed on: gradeId, status

## Performance Optimization

### Indexes (Already Configured)
- User: username, studentId, email, photoHash
- Grade: studentId + subjectId + academicYear + semester (unique)
- TeacherCourse: teacherId + subjectId + academicYear (unique)

### Query Optimization Tips
- Use `.select()` to fetch only needed fields
- Use `.lean()` for read-only queries (faster)
- Use pagination for large result sets
- Use aggregation pipeline for complex queries

## Backup & Recovery

### Local MongoDB Backup
```bash
# Backup
mongodump --db grade-submission --out ./backup

# Restore
mongorestore --db grade-submission ./backup/grade-submission
```

### MongoDB Atlas Backup
- Automatic backups enabled on paid tiers
- Free tier: Use mongodump/mongorestore
- Or export data from Atlas UI

## Monitoring

### Local MongoDB
```bash
# Connect to MongoDB shell
mongosh

# Show databases
show dbs

# Use your database
use grade-submission

# Show collections
show collections

# Count documents
db.users.countDocuments()
db.users.countDocuments({ role: 'student', status: 'approved' })

# View recent registrations
db.users.find({ role: 'student' }).sort({ createdAt: -1 }).limit(5)
```

### MongoDB Atlas
- Built-in monitoring dashboard
- Real-time metrics
- Query performance insights
- Alerts and notifications

## Troubleshooting

### Connection Issues
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
Solution: Make sure MongoDB service is running

### Authentication Failed
```
Error: Authentication failed
```
Solution: Check username/password in connection string

### Network Timeout (Atlas)
```
Error: connection timed out
```
Solution: Check Network Access settings in Atlas, add your IP

### Duplicate Key Error
```
Error: E11000 duplicate key error
```
Solution: Unique constraint violated (username, studentId, etc.)

## Next Steps

After successful migration:
1. Update remaining routes (users, subjects, grades)
2. Test all functionality thoroughly
3. Set up regular backups
4. Monitor database performance
5. Consider adding data validation middleware
6. Implement rate limiting for API endpoints
7. Add logging for audit trails

## Production Checklist

- [ ] Use MongoDB Atlas or managed MongoDB service
- [ ] Enable authentication
- [ ] Restrict network access to specific IPs
- [ ] Use strong JWT_SECRET
- [ ] Enable SSL/TLS connections
- [ ] Set up automated backups
- [ ] Configure monitoring and alerts
- [ ] Implement rate limiting
- [ ] Add request logging
- [ ] Use environment-specific configs
- [ ] Test disaster recovery procedures

## Support

- MongoDB Documentation: https://docs.mongodb.com/
- MongoDB University (Free Courses): https://university.mongodb.com/
- MongoDB Community Forums: https://www.mongodb.com/community/forums/
