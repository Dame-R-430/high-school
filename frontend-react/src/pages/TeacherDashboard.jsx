import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Alert from '../components/Alert'
import ChangePasswordModal from '../components/ChangePasswordModal'
import api from '../services/api'
import Settings from './Settings'

const NAV = [
  { id: 'courses',     icon: '📚', label: 'My Courses' },
  { id: 'submitGrade', icon: '✏️', label: 'Submit Grade' },
  { id: 'editRequest', icon: '🔄', label: 'Request Edit' },
  { id: 'settings',   icon: '⚙️', label: 'Settings' },
]

export default function TeacherDashboard() {
  const { user } = useAuth()
  const [page, setPage] = useState('courses')
  const [alert, setAlert] = useState({ msg: '', type: 'success' })
  const [showPwModal, setShowPwModal] = useState(false)

  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [grades, setGrades] = useState([])
  const [gradeForm, setGradeForm] = useState({ studentId: '', subjectId: '', score: '', semester: '1', ng: false })
  const [editForm, setEditForm] = useState({ studentId: '', gradeId: '', newScore: '', reason: '' })
  const [studentGrades, setStudentGrades] = useState([])

  const showAlert = (msg, type = 'success') => setAlert({ msg, type })

  useEffect(() => {
    loadCourses(); loadStudents()
  }, [])

  async function loadCourses() {
    const data = await api.get(`/users/teachers/${user.id}/courses`)
    setCourses(data)
  }
  async function loadStudents() {
    const data = await api.get('/users/students'); setStudents(data)
  }

  async function submitGrade(e) {
    e.preventDefault()
    if (!gradeForm.ng) {
      const s = parseFloat(gradeForm.score)
      if (isNaN(s) || s <= 0 || s > 100) {
        showAlert('Score must be greater than 0 and at most 100', 'error'); return
      }
    }
    try {
      await api.post('/grades', gradeForm)
      showAlert('Grade submitted successfully')
      setGradeForm({ studentId: '', subjectId: '', score: '', semester: '1', ng: false })
    } catch (err) { showAlert(err.message || 'Failed to submit grade', 'error') }
  }

  async function requestEdit(e) {
    e.preventDefault()
    try {
      await api.post('/grades/edit-request', { gradeId: editForm.gradeId, newScore: editForm.newScore, reason: editForm.reason })
      showAlert('Edit request submitted to admin')
      setEditForm({ studentId: '', gradeId: '', newScore: '', reason: '' })
      setStudentGrades([])
    } catch (err) { showAlert(err.message || 'Failed to submit request', 'error') }
  }

  return (
    <div className="dashboard-layout">
      <Sidebar title="👨‍🏫 Teacher Panel" subtitle={user?.name} navItems={NAV} activePage={page} onNav={setPage} onPasswordModal={() => setShowPwModal(true)} />

      <main className="main-content">
        <Alert message={alert.msg} type={alert.type} onClose={() => setAlert({ msg: '' })} />

        {/* My Courses */}
        {page === 'courses' && (
          <div>
            <div className="page-title">My Courses</div>
            <div className="card">
              {courses.length === 0
                ? <p style={{ color: '#999' }}>No courses assigned yet. Contact admin to assign courses.</p>
                : <ul style={{ listStyle: 'none', padding: 0 }}>
                    {courses.map((c, i) => (
                      <li key={i} style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
                        📖 <strong>{c.subjectName}</strong> — Grade {c.grade} ({c.academicYear})
                      </li>
                    ))}
                  </ul>
              }
            </div>
          </div>
        )}

        {/* Submit Grade */}
        {page === 'submitGrade' && (
          <div>
            <div className="page-title">Submit Grade</div>
            <div className="card" style={{ maxWidth: 500 }}>
              <form onSubmit={submitGrade}>
                <div className="form-group">
                  <label>Student</label>
                  <select value={gradeForm.studentId} onChange={e => setGradeForm({ ...gradeForm, studentId: e.target.value })} required>
                    <option value="">Select Student</option>
                    {students.map(s => <option key={s._id} value={s._id}>{s.name} (Grade {s.grade})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Subject</label>
                  <select value={gradeForm.subjectId} onChange={e => setGradeForm({ ...gradeForm, subjectId: e.target.value })} required>
                    <option value="">Select Subject</option>
                    {courses.map(c => (
                      <option key={c.subjectId} value={c.subjectId}>
                        {c.subjectName} (Grade {c.grade} — {c.academicYear})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Score (1–100)</label>
                  <input
                    type="number" min={1} max={100} step={0.01}
                    value={gradeForm.score}
                    onChange={e => setGradeForm({ ...gradeForm, score: e.target.value })}
                    disabled={gradeForm.ng}
                    required={!gradeForm.ng}
                    style={{ opacity: gradeForm.ng ? 0.4 : 1 }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="ngCheck"
                    checked={gradeForm.ng}
                    onChange={e => setGradeForm({ ...gradeForm, ng: e.target.checked, score: '' })}
                    style={{ width: 18, height: 18, accentColor: '#e74c3c' }}
                  />
                  <label htmlFor="ngCheck" style={{ color: '#e74c3c', fontWeight: 'bold', cursor: 'pointer' }}>
                    NG — Non-Grade (automatic failure)
                  </label>
                </div>
                <div className="form-group">
                  <label>Semester</label>
                  <select value={gradeForm.semester} onChange={e => setGradeForm({ ...gradeForm, semester: e.target.value })}>
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Submit Grade</button>
              </form>
            </div>
          </div>
        )}

        {/* Request Edit */}
        {page === 'editRequest' && (
          <div>
            <div className="page-title">Request Grade Edit</div>
            <div className="card" style={{ maxWidth: 560 }}>

              {/* Step 1 — pick student */}
              <div className="form-group">
                <label>Student Name / ID</label>
                <select
                  value={editForm.studentId}
                  onChange={async e => {
                    const sid = e.target.value
                    setEditForm({ studentId: sid, gradeId: '', newScore: '', reason: '' })
                    if (sid) {
                      // load grades for this student
                      const all = await api.get('/grades')
                      setStudentGrades(all.filter(g => (g.studentId?._id || g.studentId) === sid))
                    } else {
                      setStudentGrades([])
                    }
                  }}
                >
                  <option value="">Select Student</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>
                      {s.name}{s.studentId ? ` — ${s.studentId}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 2 — pick which grade to edit */}
              {studentGrades.length > 0 && (
                <div className="form-group">
                  <label>Select Grade to Edit</label>
                  <select
                    value={editForm.gradeId}
                    onChange={e => setEditForm({ ...editForm, gradeId: e.target.value })}
                  >
                    <option value="">Select a grade</option>
                    {studentGrades.map(g => (
                      <option key={g._id} value={g._id}>
                        {g.subjectId?.name || 'Subject'} — Semester {g.semester} — Score: {g.score}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Step 3 — new score + reason */}
              {editForm.gradeId && (
                <form onSubmit={requestEdit}>
                  <div className="form-group">
                    <label>New Score</label>
                    <input type="number" min={0} max={100} step={0.01}
                      value={editForm.newScore}
                      onChange={e => setEditForm({ ...editForm, newScore: e.target.value })}
                      required />
                  </div>
                  <div className="form-group">
                    <label>Reason</label>
                    <textarea rows={3} value={editForm.reason}
                      onChange={e => setEditForm({ ...editForm, reason: e.target.value })}
                      required style={{ width: '100%', padding: 10, border: '1px solid var(--border-color)', borderRadius: 5, background: 'var(--input-bg)', color: 'var(--text-primary)' }} />
                  </div>
                  <button type="submit" className="btn btn-success">Request Edit</button>
                </form>
              )}

              {editForm.studentId && studentGrades.length === 0 && (
                <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>No grades submitted for this student yet.</p>
              )}
            </div>
          </div>
        )}

        {/* Settings */}
        {page === 'settings' && <Settings />}

      </main>

      <ChangePasswordModal show={showPwModal} onClose={() => setShowPwModal(false)} onAlert={showAlert} />
    </div>
  )
}

