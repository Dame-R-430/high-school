# MongoDB Quick Reference

## Connecting to MongoDB

```bash
# Local MongoDB
mongosh

# MongoDB Atlas
mongosh "mongodb+srv://cluster0.xxxxx.mongodb.net/grade-submission" --username your_username
```

## Database Operations

```javascript
// Show all databases
show dbs

// Switch to your database
use grade-submission

// Show all collections
show collections

// Get database stats
db.stats()
```

## User Operations

```javascript
// Count all users
db.users.countDocuments()

// Count by role
db.users.countDocuments({ role: 'student' })
db.users.countDocuments({ role: 'teacher' })
db.users.countDocuments({ role: 'admin' })

// Count pending registrations
db.users.countDocuments({ role: 'student', status: 'pending' })

// Count approved students by grade
db.users.countDocuments({ role: 'student', status: 'approved', grade: 9 })

// Find all students in section A
db.users.find({ role: 'student', section: 'A' })

// Find recent registrations
db.users.find({ role: 'student' }).sort({ createdAt: -1 }).limit(10)

// Find student by studentId
db.users.findOne({ studentId: 'STU2024001' })

// Update student section
db.users.updateOne(
  { studentId: 'STU2024001' },
  { $set: { section: 'B' } }
)

// Delete a user (careful!)
db.users.deleteOne({ username: 'test_user' })
```

## Section Statistics

```javascript
// Count students per section for Grade 9, Year 2026
db.users.aggregate([
  {
    $match: {
      role: 'student',
      status: 'approved',
      grade: 9,
      academicYear: 2026
    }
  },
  {
    $group: {
      _id: '$section',
      count: { $sum: 1 }
    }
  },
  {
    $sort: { _id: 1 }
  }
])
```

## Subject Operations

```javascript
// Count all subjects
db.subjects.countDocuments()

// Find subjects by grade
db.subjects.find({ grade: 9 })

// Add new subject
db.subjects.insertOne({
  name: 'Art',
  grade: 10,
  createdAt: new Date()
})

// Update subject name
db.subjects.updateOne(
  { name: 'Mathematics' },
  { $set: { name: 'Advanced Mathematics' } }
)

// Delete subject
db.subjects.deleteOne({ name: 'Art' })
```

## Grade Operations

```javascript
// Count all grades
db.grades.countDocuments()

// Find grades for a student
db.grades.find({ studentId: ObjectId('...') })

// Find grades for a subject
db.grades.find({ subjectId: ObjectId('...') })

// Find grades by academic year and semester
db.grades.find({ academicYear: 2026, semester: '1' })

// Average score for a subject
db.grades.aggregate([
  { $match: { subjectId: ObjectId('...') } },
  { $group: { _id: null, avgScore: { $avg: '$score' } } }
])
```

## Teacher Course Operations

```javascript
// Find courses for a teacher
db.teachercourses.find({ teacherId: ObjectId('...') })

// Find teachers for a subject
db.teachercourses.find({ subjectId: ObjectId('...') })

// Assign course to teacher
db.teachercourses.insertOne({
  teacherId: ObjectId('...'),
  subjectId: ObjectId('...'),
  academicYear: 2026,
  createdAt: new Date()
})
```

## Backup & Restore

```bash
# Backup entire database
mongodump --db grade-submission --out ./backup

# Backup specific collection
mongodump --db grade-submission --collection users --out ./backup

# Restore database
mongorestore --db grade-submission ./backup/grade-submission

# Restore specific collection
mongorestore --db grade-submission --collection users ./backup/grade-submission/users.bson
```

## Useful Aggregations

### Students per grade and section
```javascript
db.users.aggregate([
  {
    $match: {
      role: 'student',
      status: 'approved'
    }
  },
  {
    $group: {
      _id: { grade: '$grade', section: '$section' },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { '_id.grade': 1, '_id.section': 1 }
  }
])
```

### Average grades per student
```javascript
db.grades.aggregate([
  {
    $group: {
      _id: '$studentId',
      avgScore: { $avg: '$score' },
      totalGrades: { $sum: 1 }
    }
  },
  {
    $sort: { avgScore: -1 }
  }
])
```

### Top performing students
```javascript
db.grades.aggregate([
  {
    $group: {
      _id: '$studentId',
      avgScore: { $avg: '$score' }
    }
  },
  {
    $sort: { avgScore: -1 }
  },
  {
    $limit: 10
  },
  {
    $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'student'
    }
  },
  {
    $unwind: '$student'
  },
  {
    $project: {
      name: '$student.name',
      grade: '$student.grade',
      section: '$student.section',
      avgScore: 1
    }
  }
])
```

## Index Management

```javascript
// List all indexes
db.users.getIndexes()

// Create index
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ studentId: 1 }, { unique: true })

// Drop index
db.users.dropIndex('username_1')

// Analyze query performance
db.users.find({ username: 'student1' }).explain('executionStats')
```

## Maintenance

```javascript
// Get collection size
db.users.stats()

// Compact collection (reclaim space)
db.runCommand({ compact: 'users' })

// Validate collection
db.users.validate()

// Repair database (if needed)
db.repairDatabase()
```

## Security

```javascript
// Create admin user (run in admin database)
use admin
db.createUser({
  user: 'admin',
  pwd: 'secure_password',
  roles: ['root']
})

// Create application user
use grade-submission
db.createUser({
  user: 'app_user',
  pwd: 'app_password',
  roles: [
    { role: 'readWrite', db: 'grade-submission' }
  ]
})
```

## Monitoring

```javascript
// Current operations
db.currentOp()

// Server status
db.serverStatus()

// Database profiling (slow queries)
db.setProfilingLevel(1, { slowms: 100 })
db.system.profile.find().sort({ ts: -1 }).limit(5)
```
