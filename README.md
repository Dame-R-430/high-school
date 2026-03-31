# Grade Submission System

A web-based grade submission system for grades 9-12 with role-based access control.

## Features

- **Student**: Register with photo and unique Student ID, login after admin approval, and view submitted grades
- **Teacher**: Submit grades, request edits from admin, view assigned courses by academic year
- **Admin**: 
  - Manage subjects (add/delete)
  - Approve/reject student registrations
  - Approve/reject grade edit requests
  - Add teachers and assign courses to them
  - View teacher courses by academic year
  - View section statistics by grade and academic year
- **Automatic Section Assignment**: 
  - Students are automatically assigned to sections (A-G) when approved by admin
  - 60 students per section based on registration order
  - Sections are assigned per grade and academic year
  - Example: First 60 approved students in Grade 9 (2026) → Section A, next 60 → Section B, etc.
- **Duplicate Prevention**: Multiple checks to prevent same student registering twice:
  - Unique Student ID (required)
  - Unique username
  - Unique email (optional)
  - Unique photo (hash-based)
  - Name + Grade combination check
  - Admin approval required for all student registrations

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (Local installation or MongoDB Atlas account)

### Quick Start

**New to MongoDB?** Follow the quick guide: [`backend/GETTING_STARTED_MONGODB.md`](backend/GETTING_STARTED_MONGODB.md)

### Backend

1. Navigate to backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Setup MongoDB:
   - **Option A - Local MongoDB**: Install from https://www.mongodb.com/try/download/community
   - **Option B - MongoDB Atlas (Cloud)**: Create free account at https://www.mongodb.com/cloud/atlas
   - See [`backend/MONGODB_SETUP.md`](backend/MONGODB_SETUP.md) for detailed instructions

4. Configure environment:
   - Edit `backend/.env` file
   - Update `MONGODB_URI` with your connection string

5. Seed the database:
```bash
npm run seed
```

6. Start the server:
```bash
npm start
```

Server runs on http://localhost:3000

### Frontend

Open `frontend/login.html` in your browser or use a local server:

```bash
cd frontend
python -m http.server 8080
```

Then visit http://localhost:8080/login.html

## Default Credentials

- **Admin**: username: `admin`, password: `admin123`
- **Teacher**: username: `teacher1`, password: `teacher123`
- **Student**: username: `student1`, password: `student123`

## Permissions

- **Students**: Can only register and view their own grades
- **Teachers**: Can submit grades but cannot edit (must request from admin), can view their assigned courses
- **Admin**: Can add/delete subjects, approve/reject edit requests, add teachers, and assign courses to teachers by academic year

## Tech Stack

- Backend: Node.js, Express, JWT authentication, MongoDB with Mongoose
- Frontend: HTML, CSS, JavaScript
- Database: MongoDB (supports both local and cloud deployment)


## API Endpoints

### Section Management

#### Get Section Statistics
```
GET /api/registrations/section-stats?grade=9&academicYear=2026
Authorization: Bearer <admin_token>
```

Response:
```json
{
  "grade": 9,
  "academicYear": 2026,
  "sections": {
    "A": 60,
    "B": 60,
    "C": 45,
    "D": 0,
    "E": 0,
    "F": 0,
    "G": 0
  },
  "total": 165
}
```

### How Section Assignment Works

1. Student registers and waits for admin approval
2. When admin approves the student, the system automatically:
   - Counts approved students in the same grade and academic year
   - Assigns section based on count: 0-59 → A, 60-119 → B, 120-179 → C, etc.
   - Maximum 7 sections (A-G), supporting up to 420 students per grade/year
3. Section is stored in the student's profile and visible to teachers and admins


## Database Documentation

- **Quick Start**: [`backend/GETTING_STARTED_MONGODB.md`](backend/GETTING_STARTED_MONGODB.md) - 5-minute setup guide
- **Detailed Setup**: [`backend/MONGODB_SETUP.md`](backend/MONGODB_SETUP.md) - Complete installation and configuration
- **MongoDB Commands**: [`backend/MONGODB_COMMANDS.md`](backend/MONGODB_COMMANDS.md) - Useful database operations
- **Comparison**: [`backend/DATABASE_COMPARISON.md`](backend/DATABASE_COMPARISON.md) - Why MongoDB for large schools

## Database Features

- **Persistent Storage**: Data survives server restarts
- **Scalability**: Handles 100,000+ students
- **Performance**: Indexed queries for fast retrieval
- **Automatic Backups**: Available with MongoDB Atlas
- **Section Assignment**: Automatic assignment integrated with database
- **Data Integrity**: Unique constraints prevent duplicates
