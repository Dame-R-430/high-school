/**
 * Automatically assigns section (A-G) based on registration order
 * 60 students per section for each grade and academic year
 */
function assignSection(students, grade, academicYear) {
  // Count approved students in this grade and year
  const approvedStudents = students.filter(s => 
    s.role === 'student' && 
    s.status === 'approved' && 
    s.grade === grade && 
    s.academicYear === academicYear
  );

  const count = approvedStudents.length;
  
  // Calculate section based on count (0-59 = A, 60-119 = B, etc.)
  const sections = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const sectionIndex = Math.floor(count / 60);
  
  // If we exceed 7 sections (420 students), assign to last section (G)
  if (sectionIndex >= sections.length) {
    return sections[sections.length - 1];
  }
  
  return sections[sectionIndex];
}

/**
 * Get section statistics for a grade and year
 */
function getSectionStats(students, grade, academicYear) {
  const filteredStudents = students.filter(s => 
    s.role === 'student' && 
    s.status === 'approved' && 
    s.grade === grade && 
    s.academicYear === academicYear
  );

  const stats = {
    A: 0, B: 0, C: 0, D: 0, E: 0, F: 0, G: 0
  };

  filteredStudents.forEach(student => {
    if (student.section) {
      stats[student.section]++;
    }
  });

  return stats;
}

module.exports = {
  assignSection,
  getSectionStats
};
