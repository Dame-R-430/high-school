import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Alert from '../components/Alert'
import ChangePasswordModal from '../components/ChangePasswordModal'
import Modal from '../components/Modal'
import api from '../services/api'
import Settings from './Settings'
import ProfilePage from '../components/ProfilePage'

const NAV = [
  { id: 'profile',       icon: '👤', label: 'Profile' },
  { id: 'overview',      icon: '🏠', label: 'Overview' },
  { id: 'registrations', icon: '📝', label: 'Registrations' },
  { id: 'students',      icon: '🎓', label: 'Students', isGroup: true },
  { id: 'grade9',        icon: '·',  label: 'Grade 9',  indent: true },
  { id: 'grade10',       icon: '·',  label: 'Grade 10', indent: true },
  { id: 'grade11',       icon: '·',  label: 'Grade 11', indent: true },
  { id: 'grade12',       icon: '·',  label: 'Grade 12', indent: true },
  { id: 'teachers',      icon: '👨‍🏫', label: 'Manage Teachers' },
  { id: 'subjects',      icon: '📚', label: 'Manage Subjects', isGroup: true },
  { id: 'subj9',         icon: '·',  label: 'Grade 9',  indent: true },
  { id: 'subj10',        icon: '·',  label: 'Grade 10', indent: true },
  { id: 'subj11',        icon: '·',  label: 'Grade 11', indent: true },
  { id: 'subj12',        icon: '·',  label: 'Grade 12', indent: true },
  { id: 'grades',        icon: '📊', label: 'Grades' },
  { id: 'rankings',      icon: '🏆', label: 'Rankings' },
  { id: 'gradingPeriod', icon: '📅', label: 'Grading Period' },
  { id: 'editRequests',  icon: '✏️', label: 'Edit Requests' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'settings',      icon: '⚙️', label: 'Settings' },
]

export default function AdminDashboard() {
  const { user } = useAuth()
  const [page, setPage] = useState('profile')
  const [alert, setAlert] = useState({ msg: '', type: 'success' })
  const [showPwModal, setShowPwModal] = useState(false)
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [selectedTeacher, setSelectedTeacher] = useState(null)

  // Data states
  const [stats, setStats] = useState({ students: 0, teachers: 0, subjects: 0, pending: 0 })
  const [registrations, setRegistrations] = useState([])
  const [students, setStudents] = useState([])
  const [teachers, setTeachers] = useState([])
  const [teacherCourses, setTeacherCourses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [grades, setGrades] = useState([])
  const [editRequests, setEditRequests] = useState([])
  const [profileRequests, setProfileRequests] = useState([])
  const [notifCount, setNotifCount] = useState(0)
  const [gradingPeriods, setGradingPeriods] = useState([])
  const [periodForm, setPeriodForm] = useState({ label: '', openDate: '', closeDate: '' })
  const [classRankings, setClassRankings] = useState([])
  const [top3, setTop3] = useState([])
  const [rankFilter, setRankFilter] = useState({ grade: '9', section: 'A', academicYear: new Date().getFullYear() })
  const [filterGrade, setFilterGrade] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [photoModal, setPhotoModal] = useState(null)
  const [studentGrade, setStudentGrade] = useState(null)
  const [subjectGrade, setSubjectGrade] = useState(null)

  // Forms
  const [teacherForm, setTeacherForm] = useState({ name: '', username: '', password: '', email: '' })
  const [subjectForm, setSubjectForm] = useState({ name: '', grade: '9' })
  const [courseForm, setCourseForm] = useState({ subjectId: '', academicYear: '2026' })
  const [editingCourse, setEditingCourse] = useState(null) // { subjectId, academicYear } of course being edited

  const showAlert = (msg, type = 'success') => setAlert({ msg, type })

  const loadOverview = useCallback(async () => {
    try {
      const [s, t, sub, r] = await Promise.all([
        api.get('/users/by-grade?'), api.get('/users/teachers'),
        api.get('/subjects'), api.get('/registrations/pending')
      ])
      setStats({ students: s.length, teachers: t.length, subjects: sub.length, pending: r.length })
    } catch {}
  }, [])

  useEffect(() => { loadOverview(); loadProfileRequests() }, [])

  async function navigate(id) {
    setPage(id)
    if (id === 'registrations') loadRegistrations()
    if (id.startsWith('grade')) {
      const g = parseInt(id.replace('grade', ''))
      setStudentGrade(g)
      loadStudentsByGrade(g)
    }
    if (id.startsWith('subj')) {
      const g = parseInt(id.replace('subj', ''))
      setSubjectGrade(g)
      setSubjectForm(prev => ({ ...prev, grade: String(g) }))
      loadSubjectsByGrade(g)
    }
    if (id === 'teachers') loadTeachers()
    if (id === 'subjects') loadSubjects()
    if (id === 'grades') loadGrades()
    if (id === 'editRequests') loadEditRequests()
    if (id === 'notifications') { loadProfileRequests(); loadRegistrations(); loadEditRequests() }
    if (id === 'gradingPeriod') loadGradingPeriods()
    if (id === 'rankings') { loadClassRankings(); loadTop3() }
  }

  // ── Registrations ──
  async function loadRegistrations() {
    const data = await api.get('/registrations/pending')
    setRegistrations(data)
  }
  async function approveRegistration(id) {
    if (!confirm('Approve?')) return
    await api.put(`/registrations/${id}/status`, { status: 'approved' })
    showAlert('Registration approved'); loadRegistrations(); loadOverview()
  }
  async function rejectRegistration(id) {
    if (!confirm('Reject?')) return
    await api.put(`/registrations/${id}/status`, { status: 'rejected' })
    showAlert('Registration rejected'); loadRegistrations()
  }

  // ── Students ──
  const [editingStudent, setEditingStudent] = useState(null)

  async function saveStudentInfo(id) {
    try {
      await api.put(`/users/students/${id}/info`, {
        name: editingStudent.name,
        email: editingStudent.email,
        studentId: editingStudent.studentId
      })
      showAlert('Student info updated')
      setEditingStudent(null)
      loadStudentsByGrade(studentGrade)
    } catch (err) { showAlert(err.message || 'Failed', 'error') }
  }
  async function loadStudentsByGrade(grade) {
    let url = `/users/by-grade?grade=${grade}`
    if (filterYear) url += `&academicYear=${filterYear}`
    const data = await api.get(url)
    setStudents(data)
  }

  // ── Teachers ──
  async function loadTeachers() {
    const data = await api.get('/users/teachers')
    const withCourses = await Promise.all(data.map(async t => {
      const courses = await api.get(`/users/teachers/${t._id}/courses`)
      return { ...t, courses }
    }))
    setTeachers(withCourses)
  }
  async function addTeacher(e) {
    e.preventDefault()
    try {
      await api.post('/users/teachers', teacherForm)
      showAlert('Teacher added'); setTeacherForm({ name: '', username: '', password: '', email: '' })
      loadTeachers(); loadOverview()
    } catch (err) { showAlert(err.message || 'Failed', 'error') }
  }
  async function openCourseModal(teacher) {
    setSelectedTeacher(teacher)
    const allSubs = await api.get('/subjects')
    setSubjects(allSubs)
    const courses = await api.get(`/users/teachers/${teacher._id}/courses`)
    setTeacherCourses(courses)
    setShowCourseModal(true)
  }
  async function assignCourse(e) {
    e.preventDefault()
    try {
      if (editingCourse) {
        // Remove old assignment first, then add new one
        await api.delete(`/users/teachers/${selectedTeacher._id}/courses/${editingCourse.subjectId}/${editingCourse.academicYear}`)
      }
      await api.post(`/users/teachers/${selectedTeacher._id}/courses`, courseForm)
      showAlert(editingCourse ? 'Course updated' : 'Course assigned')
      setEditingCourse(null)
      setCourseForm({ subjectId: '', academicYear: '2026' })
      const courses = await api.get(`/users/teachers/${selectedTeacher._id}/courses`)
      setTeacherCourses(courses); loadTeachers()
    } catch (err) { showAlert(err.message || 'Failed', 'error') }
  }

  function startEditCourse(course) {
    setEditingCourse({ subjectId: course.subjectId, academicYear: course.academicYear })
    setCourseForm({ subjectId: String(course.subjectId), academicYear: String(course.academicYear) })
  }

  function cancelEdit() {
    setEditingCourse(null)
    setCourseForm({ subjectId: '', academicYear: '2026' })
  }
  async function removeCourse(subjectId, year) {
    if (!confirm('Remove?')) return
    await api.delete(`/users/teachers/${selectedTeacher._id}/courses/${subjectId}/${year}`)
    showAlert('Course removed')
    const courses = await api.get(`/users/teachers/${selectedTeacher._id}/courses`)
    setTeacherCourses(courses); loadTeachers()
  }

  // ── Subjects ──
  async function loadSubjectsByGrade(grade) {
    const data = await api.get(`/subjects?grade=${grade}`)
    setSubjects(data)
  }
  async function addSubject(e) {
    e.preventDefault()
    await api.post('/subjects', subjectForm)
    showAlert('Subject added')
    setSubjectForm({ name: '', grade: String(subjectGrade || 9) })
    loadSubjectsByGrade(subjectGrade)
    loadOverview()
  }
  async function deleteSubject(id) {
    if (!confirm('Delete?')) return
    await api.delete(`/subjects/${id}`)
    showAlert('Subject deleted')
    loadSubjectsByGrade(subjectGrade)
    loadOverview()
  }

  // ── Grades ──
  async function loadGrades() {
    const [g, s] = await Promise.all([api.get('/grades'), api.get('/users/by-grade?')])
    const resultMap = {}
    await Promise.all(s.map(async st => {
      try { resultMap[st._id] = await api.get(`/grades/result/${st._id}`) } catch {}
    }))
    setGrades(g.map(grade => ({ ...grade, result: resultMap[grade.studentId?._id || grade.studentId] })))
  }

  // ── Edit Requests ──
  async function loadEditRequests() {
    const data = await api.get('/grades/edit-requests'); setEditRequests(data)
  }

  async function loadProfileRequests() {
    const [profileReqs, studentRegs, gradeEdits] = await Promise.all([
      api.get('/profile-requests/pending'),
      api.get('/registrations/pending'),
      api.get('/grades/edit-requests')
    ])
    const pendingGradeEdits = gradeEdits.filter(r => r.status === 'pending')
    setProfileRequests(profileReqs)
    setNotifCount(profileReqs.length + studentRegs.length + pendingGradeEdits.length)
  }

  async function handleProfileRequest(id, status) {
    await api.put(`/profile-requests/${id}`, { status })
    showAlert(`Request ${status}`)
    loadProfileRequests()
  }

  async function loadGradingPeriods() {
    const data = await api.get('/grading-periods')
    setGradingPeriods(data)
  }

  async function createPeriod(e) {
    e.preventDefault()
    try {
      await api.post('/grading-periods', periodForm)
      showAlert('Grading period created')
      setPeriodForm({ label: '', openDate: '', closeDate: '' })
      loadGradingPeriods()
    } catch (err) { showAlert(err.message || 'Failed', 'error') }
  }

  async function deletePeriod(id) {
    if (!confirm('Delete this grading period?')) return
    await api.delete(`/grading-periods/${id}`)
    showAlert('Grading period deleted')
    loadGradingPeriods()
  }

  async function loadClassRankings(filter = rankFilter) {
    try {
      const data = await api.get(`/rankings/class?grade=${filter.grade}&section=${filter.section}&academicYear=${filter.academicYear}`)
      setClassRankings(data)
    } catch { setClassRankings([]) }
  }

  async function loadTop3() {
    try {
      const data = await api.get(`/rankings/top3?academicYear=${new Date().getFullYear()}`)
      setTop3(data)
    } catch { setTop3([]) }
  }

  async function shareTop3() {
    if (!confirm('Share top 3 results with all teachers and students?')) return
    try {
      await api.post('/rankings/share', { academicYear: new Date().getFullYear() })
      showAlert('Top 3 results shared successfully')
    } catch (err) { showAlert(err.message || 'Failed to share', 'error') }
  }
  async function handleRequest(id, status) {
    await api.put(`/grades/edit-requests/${id}`, { status })
    showAlert(`Request ${status}`); loadEditRequests(); loadGrades()
  }

  return (
    <div className="dashboard-layout">
      <Sidebar title="⚙️ Admin Panel" subtitle={user?.name} navItems={NAV} activePage={page} onNav={navigate} onPasswordModal={() => setShowPwModal(true)} badge={{ notifications: notifCount }} />

      <main className="main-content">
        <Alert message={alert.msg} type={alert.type} onClose={() => setAlert({ msg: '' })} />

        {/* Profile */}
        {page === 'profile' && <ProfilePage onAlert={showAlert} />}

        {/* Overview */}
        {page === 'overview' && (
          <div>
            <div className="page-title">Overview</div>
            <div className="stats-row">
              {[['Students', stats.students], ['Teachers', stats.teachers], ['Subjects', stats.subjects], ['Pending', stats.pending]].map(([l, v]) => (
                <div className="stat-card" key={l}><div className="val">{v}</div><div className="lbl">{l}</div></div>
              ))}
            </div>
          </div>
        )}

        {/* Registrations */}
        {page === 'registrations' && (
          <div>
            <div className="page-title">Pending Registrations</div>
            <div className="card">
              <table><thead><tr><th>Name</th><th>Grade</th><th>Year</th><th>Email</th><th>Photo</th><th>Min. Result</th><th>Action</th></tr></thead>
                <tbody>
                  {registrations.length === 0 ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No pending registrations</td></tr>
                    : registrations.map(r => (
                      <tr key={r._id}>
                        <td>{r.name}</td><td>Grade {r.grade}</td>
                        <td>{r.academicYear || 'N/A'}</td><td>{r.email || 'N/A'}</td>
                        <td><img src={`data:image/jpeg;base64,${r.photo}`} style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }} onClick={() => setPhotoModal({ photo: r.photo, name: r.name })} /></td>
                        <td>
                          {r.grade === 9 && r.grade8MinisterResult
                            ? <img src={`data:image/jpeg;base64,${r.grade8MinisterResult}`} style={{ width: 46, height: 46, objectFit: 'cover', borderRadius: 4, cursor: 'pointer', border: '2px solid #e74c3c' }} onClick={() => setPhotoModal({ photo: r.grade8MinisterResult, name: `${r.name} — Grade 8 Result` })} />
                            : <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>{r.grade === 9 ? 'Missing' : 'N/A'}</span>
                          }
                        </td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success" onClick={() => approveRegistration(r._id)}>Approve</button>
                          <button className="btn btn-danger" onClick={() => rejectRegistration(r._id)}>Reject</button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Students by grade */}
        {page.startsWith('grade') && (
          <div>
            <div className="page-title">Grade {studentGrade} Students</div>
            <div className="card">
              <div className="filter-row" style={{ marginBottom: 16 }}>
                <select value={filterYear} onChange={e => { setFilterYear(e.target.value); loadStudentsByGrade(studentGrade) }}>
                  <option value="">All Years</option>
                  {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <table>
                <thead><tr><th>Student ID</th><th>Name</th><th>Email</th><th>Section</th><th>Year</th><th>Action</th></tr></thead>
                <tbody>
                  {students.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No students in Grade {studentGrade}</td></tr>
                    : students.map(s => {
                      const editing = editingStudent?.id === s._id
                      return (
                        <tr key={s._id}>
                          <td>
                            {editing
                              ? <input type="text" value={editingStudent.studentId}
                                  onChange={e => setEditingStudent({ ...editingStudent, studentId: e.target.value })}
                                  style={{ width: 90, padding: '3px 6px', border: '1px solid var(--border-color)', borderRadius: 4, background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 12 }} />
                              : s.studentId || '—'}
                          </td>
                          <td>
                            {editing
                              ? <input type="text" value={editingStudent.name} autoFocus
                                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                                  style={{ width: 130, padding: '3px 6px', border: '1px solid var(--border-color)', borderRadius: 4, background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 12 }} />
                              : s.name}
                          </td>
                          <td>
                            {editing
                              ? <input type="email" value={editingStudent.email}
                                  onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                                  style={{ width: 150, padding: '3px 6px', border: '1px solid var(--border-color)', borderRadius: 4, background: 'var(--input-bg)', color: 'var(--text-primary)', fontSize: 12 }} />
                              : s.email || '—'}
                          </td>
                          <td>{s.section || '—'}</td>
                          <td>{s.academicYear}</td>
                          <td style={{ display: 'flex', gap: 6 }}>
                            {editing
                              ? <>
                                  <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => saveStudentInfo(s._id)}>Save</button>
                                  <button className="btn" style={{ padding: '4px 10px', fontSize: 12, background: '#888', color: '#fff' }} onClick={() => setEditingStudent(null)}>✕</button>
                                </>
                              : <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => setEditingStudent({ id: s._id, name: s.name, email: s.email || '', studentId: s.studentId || '' })}>
                                  ✏️ Edit
                                </button>
                            }
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Teachers */}
        {page === 'teachers' && (
          <div>
            <div className="page-title">Manage Teachers</div>
            <div className="card">
              <h3 style={{ marginBottom: 14, fontSize: 15, color: '#555' }}>Add New Teacher</h3>
              <form onSubmit={addTeacher}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                  {[['Name','name','text'],['Username','username','text'],['Password','password','password'],['Email','email','email']].map(([l,k,t]) => (
                    <div className="form-group" key={k}>
                      <label>{l}</label>
                      <input type={t} value={teacherForm[k]} onChange={e => setTeacherForm({ ...teacherForm, [k]: e.target.value })} required={k !== 'email'} />
                    </div>
                  ))}
                  <div><button type="submit" className="btn btn-primary">Add Teacher</button></div>
                </div>
              </form>
            </div>
            <div className="card">
              <table><thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Courses</th><th>Action</th></tr></thead>
                <tbody>
                  {teachers.map(t => (
                    <tr key={t._id}>
                      <td>{t.name}</td><td>{t.username}</td><td>{t.email || 'N/A'}</td>
                      <td>{t.courses?.map(c => `${c.subjectName} (${c.academicYear})`).join(', ') || 'No courses'}</td>
                      <td><button className="btn btn-primary" onClick={() => openCourseModal(t)}>Manage Courses</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Subjects by grade */}
        {page.startsWith('subj') && (
          <div>
            <div className="page-title">Grade {subjectGrade} Subjects</div>
            <div className="card">
              <h3 style={{ marginBottom: 14, fontSize: 15, color: 'var(--text-secondary)' }}>Add Subject to Grade {subjectGrade}</h3>
              <form onSubmit={addSubject}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', maxWidth: 420 }}>
                  <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Subject Name</label>
                    <input
                      type="text"
                      value={subjectForm.name}
                      onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <button type="submit" className="btn btn-primary">Add Subject</button>
                  </div>
                </div>
              </form>
            </div>
            <div className="card">
              <table>
                <thead>
                  <tr><th>#</th><th>Subject Name</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {subjects.length === 0
                    ? <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No subjects for Grade {subjectGrade}</td></tr>
                    : subjects.map((s, i) => (
                      <tr key={s._id}>
                        <td style={{ width: 40 }}>{i + 1}</td>
                        <td>{s.name}</td>
                        <td><button className="btn btn-danger" onClick={() => deleteSubject(s._id)}>Delete</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grades */}
        {page === 'grades' && (
          <div>
            <div className="page-title">All Grades</div>
            <div className="card">
              <table><thead><tr><th>Student</th><th>Subject</th><th>Score</th><th>Semester</th><th>Status</th></tr></thead>
                <tbody>
                  {grades.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>No grades yet</td></tr>
                    : grades.map(g => {
                      const isLow = g.score < 50 || g.ng
                      const r = g.result
                      return (
                        <tr key={g._id}>
                          <td>{g.studentId?.name || '—'}</td>
                          <td>{g.subjectId?.name || '—'}</td>
                          <td style={isLow || g.ng ? { color: 'red', fontWeight: 'bold' } : {}}>{g.ng ? 'NG' : g.score}</td>
                          <td>Semester {g.semester}</td>
                          <td>{r?.calculated
                            ? <span style={{ color: r.passed ? 'green' : 'red', fontWeight: 'bold' }}>{r.passed ? 'PASS' : 'FAIL'} (avg: {r.average}){r.failReason ? ` — ${r.failReason}` : ''}</span>
                            : <span style={{ color: 'gray' }}>Pending</span>}
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Edit Requests */}
        {page === 'editRequests' && (
          <div>
            <div className="page-title">Grade Edit Requests</div>
            <div className="card">
              <table><thead><tr><th>Teacher</th><th>New Score</th><th>Reason</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {editRequests.length === 0 ? <tr><td colSpan={5} style={{ textAlign: 'center', color: '#999' }}>No edit requests</td></tr>
                    : editRequests.map(r => (
                      <tr key={r._id}>
                        <td>{r.teacherId?.name || '—'}</td>
                        <td>{r.newScore}</td><td>{r.reason}</td><td>{r.status}</td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          {r.status === 'pending' && <>
                            <button className="btn btn-success" onClick={() => handleRequest(r._id, 'approved')}>Approve</button>
                            <button className="btn btn-danger" onClick={() => handleRequest(r._id, 'rejected')}>Reject</button>
                          </>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Rankings */}
        {page === 'rankings' && (
          <div>
            <div className="page-title">Rankings</div>

            {/* Top 3 school-wide */}
            <div className="card" style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 15, color: 'var(--text-secondary)' }}>🏆 Top 3 Students — School Wide</h3>
                <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={shareTop3}>
                  📢 Share with Teachers & Students
                </button>
              </div>
              {top3.length === 0
                ? <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No results calculated yet.</p>
                : <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    {top3.map((s, i) => (
                      <div key={s._id} style={{
                        flex: 1, minWidth: 180, padding: '18px 20px', borderRadius: 10,
                        background: i === 0 ? '#fff8e1' : i === 1 ? '#f5f5f5' : '#fff3e0',
                        border: `2px solid ${i === 0 ? '#ffc107' : i === 1 ? '#9e9e9e' : '#ff9800'}`,
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: 28 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                        <div style={{ fontWeight: 'bold', fontSize: 15, marginTop: 6 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Grade {s.grade} — Section {s.section}</div>
                        <div style={{ fontSize: 20, fontWeight: 'bold', color: '#667eea', marginTop: 8 }}>{s.average}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Average</div>
                      </div>
                    ))}
                  </div>
              }
            </div>

            {/* Class rankings */}
            <div className="card">
              <h3 style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 14 }}>📋 Class Rankings</h3>
              <div className="filter-row" style={{ marginBottom: 16 }}>
                <select value={rankFilter.grade} onChange={e => { const f={...rankFilter,grade:e.target.value}; setRankFilter(f); loadClassRankings(f) }}>
                  {[9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
                <select value={rankFilter.section} onChange={e => { const f={...rankFilter,section:e.target.value}; setRankFilter(f); loadClassRankings(f) }}>
                  {['A','B','C','D','E','F','G'].map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
                <select value={rankFilter.academicYear} onChange={e => { const f={...rankFilter,academicYear:e.target.value}; setRankFilter(f); loadClassRankings(f) }}>
                  {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <table>
                <thead>
                  <tr><th>Rank</th><th>Name</th><th>Student ID</th><th>Section</th><th>Average</th><th>Status</th></tr>
                </thead>
                <tbody>
                  {classRankings.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No results for this class yet.</td></tr>
                    : classRankings.map(s => (
                      <tr key={s._id}>
                        <td style={{ fontWeight: 'bold', color: s.rank <= 3 ? '#667eea' : 'inherit' }}>
                          {s.rank === 1 ? '🥇' : s.rank === 2 ? '🥈' : s.rank === 3 ? '🥉' : `#${s.rank}`}
                        </td>
                        <td>{s.name}</td>
                        <td>{s.studentId || '—'}</td>
                        <td>Section {s.section}</td>
                        <td style={{ fontWeight: 'bold' }}>{s.average}</td>
                        <td>
                          <span style={{ color: s.passed ? 'green' : 'red', fontWeight: 'bold' }}>
                            {s.passed ? 'PASS' : 'FAIL'}
                          </span>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Grading Period */}
        {page === 'gradingPeriod' && (
          <div>
            <div className="page-title">Grading Period</div>
            <div className="card">
              <h3 style={{ marginBottom: 14, fontSize: 15, color: 'var(--text-secondary)' }}>Create New Grading Period</h3>
              <form onSubmit={createPeriod}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Label (e.g. Semester 1 - 2026)</label>
                    <input type="text" value={periodForm.label}
                      onChange={e => setPeriodForm({ ...periodForm, label: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Open Date</label>
                    <input type="date" value={periodForm.openDate}
                      onChange={e => setPeriodForm({ ...periodForm, openDate: e.target.value })} required />
                  </div>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label>Close Date</label>
                    <input type="date" value={periodForm.closeDate}
                      onChange={e => setPeriodForm({ ...periodForm, closeDate: e.target.value })} required />
                  </div>
                  <div><button type="submit" className="btn btn-primary">Create</button></div>
                </div>
              </form>
            </div>
            <div className="card">
              {gradingPeriods.length === 0
                ? <p style={{ color: 'var(--text-secondary)' }}>No grading periods created yet.</p>
                : <table>
                    <thead><tr><th>Label</th><th>Open Date</th><th>Close Date</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                      {gradingPeriods.map(p => {
                        const now = new Date()
                        const open  = new Date(p.openDate)
                        const close = new Date(p.closeDate)
                        const active  = now >= open && now <= close
                        const expired = now > close
                        const upcoming = now < open
                        return (
                          <tr key={p._id}>
                            <td>{p.label}</td>
                            <td>{new Date(p.openDate).toLocaleDateString()}</td>
                            <td>{new Date(p.closeDate).toLocaleDateString()}</td>
                            <td>
                              {active   && <span style={{ color: '#1e7e34', fontWeight: 'bold' }}>🟢 Open</span>}
                              {expired  && <span style={{ color: '#c62828' }}>🔴 Closed</span>}
                              {upcoming && <span style={{ color: '#856404' }}>🟡 Upcoming</span>}
                            </td>
                            <td><button className="btn btn-danger" onClick={() => deletePeriod(p._id)}>Delete</button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
              }
            </div>
          </div>
        )}

        {/* Notifications */}
        {page === 'notifications' && (
          <div>
            <div className="page-title">
              Notifications
              {notifCount > 0 && (
                <span style={{ marginLeft: 10, background: '#e74c3c', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: 13 }}>
                  {notifCount}
                </span>
              )}
            </div>

            {/* Student registrations */}
            <div className="card">
              <h3 style={{ marginBottom: 14, fontSize: 15, color: 'var(--text-secondary)' }}>📝 Pending Student Registrations</h3>
              {registrations.length === 0
                ? <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No pending registrations.</p>
                : registrations.map(r => (
                  <div key={r._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>{r.name} <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Grade {r.grade} — {r.academicYear}</span></p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{r.email || 'No email'}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => approveRegistration(r._id)}>Approve</button>
                      <button className="btn btn-danger"  style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => rejectRegistration(r._id)}>Reject</button>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Grade edit requests */}
            <div className="card">
              <h3 style={{ marginBottom: 14, fontSize: 15, color: 'var(--text-secondary)' }}>✏️ Pending Grade Edit Requests</h3>
              {editRequests.filter(r => r.status === 'pending').length === 0
                ? <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No pending grade edits.</p>
                : editRequests.filter(r => r.status === 'pending').map(r => (
                  <div key={r._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>{r.teacherId?.name || '—'}</p>
                      <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>New score: {r.newScore} — {r.reason}</p>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => handleRequest(r._id, 'approved')}>Approve</button>
                      <button className="btn btn-danger"  style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => handleRequest(r._id, 'rejected')}>Reject</button>
                    </div>
                  </div>
                ))
              }
            </div>

            {/* Profile edit requests */}
            <div className="card">
              <h3 style={{ marginBottom: 14, fontSize: 15, color: 'var(--text-secondary)' }}>👤 Pending Profile Edit Requests</h3>
              {profileRequests.length === 0
                ? <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No pending profile edits.</p>
                : profileRequests.map(r => (
                  <div key={r._id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ fontWeight: 'bold' }}>{r.userId?.name} <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>({r.userId?.username})</span></p>
                      {r.requestedName  && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Name → <strong>{r.requestedName}</strong></p>}
                      {r.requestedEmail && <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Email → <strong>{r.requestedEmail}</strong></p>}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-success" style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => handleProfileRequest(r._id, 'approved')}>Approve</button>
                      <button className="btn btn-danger"  style={{ padding: '5px 12px', fontSize: 12 }} onClick={() => handleProfileRequest(r._id, 'rejected')}>Reject</button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Settings */}
        {page === 'settings' && <Settings />}

      </main>

      <ChangePasswordModal show={showPwModal} onClose={() => setShowPwModal(false)} onAlert={showAlert} />

      {/* Course Modal */}
      <Modal show={showCourseModal} onClose={() => { setShowCourseModal(false); setEditingCourse(null); setCourseForm({ subjectId: '', academicYear: '2026' }) }} title={`${editingCourse ? 'Edit' : 'Assign'} Course — ${selectedTeacher?.name}`}>
        <form onSubmit={assignCourse}>
          {editingCourse && (
            <div style={{ background: '#fff3cd', border: '1px solid #ffc107', borderRadius: 6, padding: '8px 12px', marginBottom: 14, fontSize: 13 }}>
              ✏️ Editing existing course assignment. Change subject and/or year below.
            </div>
          )}
          <div className="form-group">
            <label>Subject</label>
            <select value={courseForm.subjectId} onChange={e => setCourseForm({ ...courseForm, subjectId: e.target.value })} required>
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.name} (Grade {s.grade})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Academic Year</label>
            <select value={courseForm.academicYear} onChange={e => setCourseForm({ ...courseForm, academicYear: e.target.value })}>
              {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="submit" className="btn btn-primary">{editingCourse ? 'Save Changes' : 'Assign Course'}</button>
            {editingCourse && <button type="button" className="btn" style={{ background: '#888', color: '#fff' }} onClick={cancelEdit}>Cancel</button>}
          </div>
        </form>
        <h4 style={{ margin: '16px 0 8px' }}>Current Courses</h4>
        <table><thead><tr><th>Subject</th><th>Grade</th><th>Year</th><th>Action</th></tr></thead>
          <tbody>
            {teacherCourses.length === 0 ? <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>No courses</td></tr>
              : teacherCourses.map(c => (
                <tr key={`${c.subjectId}-${c.academicYear}`}>
                  <td>{c.subjectName}</td><td>Grade {c.grade}</td><td>{c.academicYear}</td>
                  <td style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-primary" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => startEditCourse(c)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: 12 }} onClick={() => removeCourse(c.subjectId, c.academicYear)}>Remove</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </Modal>

      {/* Photo Modal */}
      {photoModal && (
        <div className="modal" style={{ display: 'block' }} onClick={() => setPhotoModal(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <span className="close" onClick={() => setPhotoModal(null)}>&times;</span>
            <h3>{photoModal.name}'s Photo</h3>
            <img src={`data:image/jpeg;base64,${photoModal.photo}`} style={{ width: '100%', maxWidth: 400, borderRadius: 10 }} />
          </div>
        </div>
      )}
    </div>
  )
}
