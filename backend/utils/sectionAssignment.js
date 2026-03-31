const User = require('../models/User');

/**
 * Automatically assigns section (A-G) based on registration order
 * 60 students per section for each grade and academic year
 * Sections: A, B, C, D, E, F, G (7 sections, max 420 students per grade/year)
 * 
 * This is the MongoDB version - use this when connected to database
 */
async function assignSectionDB(grade, academicYear) {
  // Count approved students in this grade and year
  const count = await User.countDocuments({
    role: 'student',
    status: 'approved',
    grade: grade,
    academicYear: academicYear
  });

  // Calculate section based on count (0-59 = A, 60-119 = B, etc.)
  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const sectionIndex = Math.floor(count / 60);
  
  // If we exceed 7 sections (420 students), wrap around or handle overflow
  if (sectionIndex >= sections.length) {
    return sections[sections.length - 1]; // Assign to last section (G)
  }
  
  return sections[sectionIndex];
}

/**
 * Get section statistics for a grade and year (MongoDB version)
 */
async function getSectionStatsDB(grade, academicYear) {
  const students = await User.find({
    role: 'student',
    status: 'approved',
    grade: grade,
    academicYear: academicYear
  }).select('section');

  const stats = {
    A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0
  };

  students.forEach(student => {
    if (student.section) {
      stats[student.section]++;
    }
  });

  return stats;
}

module.exports = {
  assignSectionDB,
  getSectionStatsDB
};
