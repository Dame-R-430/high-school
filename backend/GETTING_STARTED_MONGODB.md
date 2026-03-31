# Getting Started with MongoDB - Quick Guide

This is a quick 5-minute guide to get MongoDB running for your school system.

## Step 1: Choose Your Option (2 minutes)

### Option A: Local MongoDB (Best for Development)
- Install on your computer
- Free forever
- Works offline
- Good for testing

### Option B: MongoDB Atlas (Best for Production)
- Cloud-based (no installation)
- Free tier available
- Automatic backups
- Access from anywhere

## Step 2: Setup (5-10 minutes)

### Option A: Local MongoDB

**Windows:**
1. Download: https://www.mongodb.com/try/download/community
2. Run installer (keep default settings)
3. MongoDB starts automatically
4. Done! ✅

**Mac:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux:**
```bash
# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### Option B: MongoDB Atlas (Cloud)

1. **Sign up**: https://www.mongodb.com/cloud/atlas/register
2. **Create cluster**: Choose FREE tier (M0)
3. **Create user**: 
   - Go to "Database Access"
   - Add user with password
   - Remember username and password!
4. **Allow access**:
   - Go to "Network Access"
   - Click "Add IP Address"
   - Choose "Allow Access from Anywhere" (for now)
5. **Get connection string**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - It looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`

## Step 3: Configure Your App (2 minutes)

1. **Edit `.env` file** in `backend` folder:

For Local MongoDB:
```env
PORT=3000
JWT_SECRET=your_jwt_secret_key_change_this_in_production
MONGODB_URI=mongodb://localhost:27017/grade-submission
```

For MongoDB Atlas:
```env
PORT=3000
JWT_SECRET=your_jwt_secret_key_change_this_in_production
MONGODB_URI=mongodb+srv://YOUR_USERNAME:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/grade-submission?retryWrites=true&w=majority
```

**Important**: Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your actual credentials!

## Step 4: Seed Database (1 minute)

```bash
cd backend
npm run seed
```

You should see:
```
MongoDB connected successfully
Clearing existing data...
Creating admin user...
Creating teacher...
Creating sample student...
Creating subjects...
Assigning courses to teacher...

✅ Database seeded successfully!

Default credentials:
Admin: username=admin, password=admin123
Teacher: username=teacher1, password=teacher123
Student: username=student1, password=student123
```

## Step 5: Start Server (1 minute)

```bash
npm start
```

You should see:
```
MongoDB connected successfully
Server running on port 3000
```

## Step 6: Test (2 minutes)

1. Open browser: http://localhost:8080/login.html
2. Login as admin: `admin` / `admin123`
3. Try registering a new student
4. Approve the student
5. Check that section is assigned automatically ✅

## Verify MongoDB is Working

### Check 1: Connection
Server logs should show: `MongoDB connected successfully`

### Check 2: Data Exists
```bash
# Open MongoDB shell
mongosh

# Switch to database
use grade-submission

# Count users
db.users.countDocuments()
# Should show: 3 (admin, teacher, student)

# Show all users
db.users.find()
```

### Check 3: Section Assignment
1. Register 2 new students as admin
2. Approve both
3. Both should get Section A (first 60 students)

## Common Issues

### Issue 1: "MongoDB connection error"
**Solution**: Make sure MongoDB is running
```bash
# Windows
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

### Issue 2: "Authentication failed" (Atlas)
**Solution**: Check your connection string
- Username and password correct?
- Password has special characters? Encode them:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`

### Issue 3: "Network timeout" (Atlas)
**Solution**: Check Network Access in Atlas
- Add your IP address
- Or allow access from anywhere (0.0.0.0/0)

### Issue 4: "Cannot find module 'mongoose'"
**Solution**: Install dependencies
```bash
cd backend
npm install
```

## What's Next?

Your system now has:
- ✅ Persistent database (data survives restarts)
- ✅ Automatic section assignment (60 students per section)
- ✅ User authentication with MongoDB
- ✅ Student registration with approval workflow

### Remaining Work

Some routes still use in-memory storage and need updating:
- Users routes (viewing students, teachers)
- Subjects routes (add/delete subjects)
- Grades routes (submit/view grades)

These will be updated in the next phase.

## Quick Commands

```bash
# Start MongoDB (local)
mongod

# Connect to MongoDB shell
mongosh

# Seed database
npm run seed

# Start server
npm start

# Start server with auto-reload
npm run dev
```

## Resources

- **Setup Guide**: `MONGODB_SETUP.md` (detailed instructions)
- **Commands**: `MONGODB_COMMANDS.md` (useful MongoDB commands)
- **Comparison**: `DATABASE_COMPARISON.md` (why MongoDB?)
- **MongoDB Docs**: https://docs.mongodb.com/
- **Mongoose Docs**: https://mongoosejs.com/

## Support

If you need help:
1. Check the error message
2. Look in the guides above
3. Search MongoDB documentation
4. Ask in MongoDB community forums

## Success Checklist

- [ ] MongoDB installed/Atlas account created
- [ ] `.env` file configured with connection string
- [ ] `npm run seed` completed successfully
- [ ] Server starts without errors
- [ ] Can login as admin
- [ ] Can register and approve students
- [ ] Sections assigned automatically

If all checked ✅, you're ready to go! 🎉
