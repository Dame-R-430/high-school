# System Architecture

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  (HTML/CSS/JavaScript - Static Files)                       │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Login   │  │  Admin   │  │ Student  │                 │
│  │  Page    │  │Dashboard │  │Dashboard │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ HTTP/HTTPS
                          │ REST API
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Node.js/Express)                 │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Routes (API Endpoints)                 │    │
│  │                                                     │    │
│  │  /api/auth          - Login, Register              │    │
│  │  /api/registrations - Approve/Reject, Stats        │    │
│  │  /api/users         - Profile, Students, Teachers  │    │
│  │  /api/subjects      - CRUD Operations              │    │
│  │  /api/grades        - Submit, View, Edit           │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Middleware                             │    │
│  │                                                     │    │
│  │  - JWT Authentication                              │    │
│  │  - Role Authorization (admin/teacher/student)      │    │
│  │  - File Upload (Multer)                           │    │
│  │  - CORS                                            │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Business Logic                         │    │
│  │                                                     │    │
│  │  - Section Assignment (60 students per section)    │    │
│  │  - Duplicate Prevention                            │    │
│  │  - Photo Hash Validation                           │    │
│  │  - Grade Calculations                              │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                   │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Models (Mongoose)                      │    │
│  │                                                     │    │
│  │  - User Model                                      │    │
│  │  - Subject Model                                   │    │
│  │  - Grade Model                                     │    │
│  │  - TeacherCourse Model                            │    │
│  │  - EditRequest Model                              │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ MongoDB Protocol
                          │ (Mongoose ODM)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    MongoDB Database                          │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   users      │  │   subjects   │  │    grades    │     │
│  │              │  │              │  │              │     │
│  │ - Students   │  │ - Math       │  │ - Scores     │     │
│  │ - Teachers   │  │ - English    │  │ - Semesters  │     │
│  │ - Admins     │  │ - Science    │  │ - Years      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │teachercourses│  │ editrequests │                        │
│  │              │  │              │                        │
│  │ - Assignments│  │ - Pending    │                        │
│  │ - Years      │  │ - Approved   │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Student Registration Flow

```
1. Student fills registration form
   ↓
2. Frontend sends POST /api/auth/register
   ↓
3. Backend validates:
   - Unique username ✓
   - Unique student ID ✓
   - Unique email ✓
   - Unique photo hash ✓
   - Unique name+grade ✓
   ↓
4. Create user with status='pending'
   ↓
5. Save to MongoDB
   ↓
6. Return success message
```

### Student Approval Flow

```
1. Admin views pending registrations
   ↓
2. Admin clicks "Approve"
   ↓
3. Frontend sends PUT /api/registrations/:id/status
   ↓
4. Backend:
   - Updates status to 'approved'
   - Counts approved students in same grade/year
   - Calculates section (count ÷ 60)
   - Assigns section (A-G)
   ↓
5. Save to MongoDB
   ↓
6. Student can now login
```

### Section Assignment Logic

```
Grade 9, Year 2026:

Student #1-60   → Section A
Student #61-120 → Section B
Student #121-180 → Section C
Student #181-240 → Section D
Student #241-300 → Section E
Student #301-360 → Section F
Student #361-420 → Section G
Student #421+    → Section G (overflow)
```

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId("..."),
  username: "student1",
  password: "hashed_password",
  role: "student",              // student | teacher | admin
  name: "Jane Student",
  email: "jane@example.com",
  status: "approved",           // pending | approved | rejected
  
  // Student-specific fields
  studentId: "STU2024001",
  grade: 9,                     // 9-12
  section: "A",                 // A-G
  academicYear: 2026,
  photo: "base64_string",
  photoHash: "md5_hash",
  subjectsSelected: true,
  selectedSubjects: [ObjectId("..."), ObjectId("...")],
  
  createdAt: ISODate("2024-01-01T00:00:00Z")
}
```

### Subjects Collection

```javascript
{
  _id: ObjectId("..."),
  name: "Mathematics",
  grade: 9,
  createdAt: ISODate("2024-01-01T00:00:00Z")
}
```

### Grades Collection

```javascript
{
  _id: ObjectId("..."),
  studentId: ObjectId("..."),   // Reference to User
  subjectId: ObjectId("..."),   // Reference to Subject
  teacherId: ObjectId("..."),   // Reference to User
  score: 85,                    // 0-100
  academicYear: 2026,
  semester: "1",                // 1 | 2
  submittedAt: ISODate("2024-01-01T00:00:00Z"),
  updatedAt: ISODate("2024-01-01T00:00:00Z")
}
```

### TeacherCourses Collection

```javascript
{
  _id: ObjectId("..."),
  teacherId: ObjectId("..."),   // Reference to User
  subjectId: ObjectId("..."),   // Reference to Subject
  academicYear: 2026,
  createdAt: ISODate("2024-01-01T00:00:00Z")
}
```

### EditRequests Collection

```javascript
{
  _id: ObjectId("..."),
  gradeId: ObjectId("..."),     // Reference to Grade
  teacherId: ObjectId("..."),   // Reference to User
  newScore: 90,
  reason: "Calculation error",
  status: "pending",            // pending | approved | rejected
  createdAt: ISODate("2024-01-01T00:00:00Z")
}
```

## Indexes

### Performance Optimization

```javascript
// Users Collection
users.createIndex({ username: 1 }, { unique: true })
users.createIndex({ studentId: 1 }, { unique: true })
users.createIndex({ email: 1 })
users.createIndex({ photoHash: 1 })
users.createIndex({ role: 1, status: 1, grade: 1, academicYear: 1 })

// Grades Collection
grades.createIndex({ 
  studentId: 1, 
  subjectId: 1, 
  academicYear: 1, 
  semester: 1 
}, { unique: true })

// TeacherCourses Collection
teachercourses.createIndex({ 
  teacherId: 1, 
  subjectId: 1, 
  academicYear: 1 
}, { unique: true })
```

## Security Layers

```
┌─────────────────────────────────────────┐
│  1. HTTPS/TLS Encryption                │
│     (Transport Layer Security)          │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  2. CORS Policy                         │
│     (Cross-Origin Resource Sharing)     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  3. JWT Authentication                  │
│     (JSON Web Token)                    │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  4. Role-Based Authorization            │
│     (admin/teacher/student)             │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  5. Input Validation                    │
│     (Mongoose Schema Validation)        │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  6. Password Hashing                    │
│     (bcrypt with salt)                  │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  7. MongoDB Authentication              │
│     (Database User Credentials)         │
└─────────────────────────────────────────┘
```

## Scalability

### Current Capacity

```
Single Server Setup:
- Students: 10,000+
- Concurrent Users: 100+
- Requests/Second: 1,000+
- Database Size: 10GB+
```

### Scaling Options

```
┌─────────────────────────────────────────┐
│  Small School (< 1,000 students)        │
│  - Single server                        │
│  - Local MongoDB or Atlas Free          │
│  - Cost: $0-50/month                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Medium School (1,000-10,000 students)  │
│  - Single server                        │
│  - MongoDB Atlas M10                    │
│  - Cost: $57-200/month                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Large School (10,000+ students)        │
│  - Load balanced servers                │
│  - MongoDB Atlas M30+ (Replica Set)     │
│  - CDN for static files                 │
│  - Cost: $250-1000/month                │
└─────────────────────────────────────────┘
```

## Deployment Options

### Development

```
Local Machine
├── Node.js Server (localhost:3000)
├── MongoDB (localhost:27017)
└── Frontend (localhost:8080)
```

### Production - Simple

```
Single VPS (DigitalOcean, AWS EC2, etc.)
├── Node.js Server (port 3000)
├── MongoDB (port 27017)
├── Nginx (reverse proxy)
└── SSL Certificate (Let's Encrypt)
```

### Production - Scalable

```
┌─────────────────────────────────────────┐
│  Load Balancer (AWS ALB, Nginx)         │
└─────────────────────────────────────────┘
           │
           ├─────────────┬─────────────┐
           ▼             ▼             ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Server 1 │  │ Server 2 │  │ Server 3 │
    │ Node.js  │  │ Node.js  │  │ Node.js  │
    └──────────┘  └──────────┘  └──────────┘
           │             │             │
           └─────────────┴─────────────┘
                      │
                      ▼
           ┌─────────────────────┐
           │  MongoDB Atlas      │
           │  (Replica Set)      │
           │  - Primary          │
           │  - Secondary 1      │
           │  - Secondary 2      │
           └─────────────────────┘
```

## Monitoring

### Key Metrics

```
Application Metrics:
- Request rate (req/sec)
- Response time (ms)
- Error rate (%)
- Active users

Database Metrics:
- Query performance
- Index usage
- Storage size
- Connection pool

System Metrics:
- CPU usage
- Memory usage
- Disk I/O
- Network bandwidth
```

### Tools

- **Application**: PM2, New Relic, DataDog
- **Database**: MongoDB Atlas Dashboard, MongoDB Compass
- **Infrastructure**: CloudWatch, Grafana, Prometheus
- **Logs**: Winston, Morgan, ELK Stack

## Backup Strategy

```
Daily Backups:
├── Automated (MongoDB Atlas)
├── Manual (mongodump)
└── Retention: 30 days

Weekly Backups:
├── Full database export
├── Store in S3/Cloud Storage
└── Retention: 90 days

Monthly Backups:
├── Archive to cold storage
└── Retention: 1 year
```

## Disaster Recovery

```
Recovery Time Objective (RTO): 1 hour
Recovery Point Objective (RPO): 24 hours

Backup Locations:
1. Primary: MongoDB Atlas (automatic)
2. Secondary: S3/Cloud Storage (daily)
3. Tertiary: Local backup (weekly)
```
