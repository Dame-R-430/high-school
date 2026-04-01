import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Alert from '../components/Alert'
import ChangePasswordModal from '../components/ChangePasswordModal'
import SharedTopStudents from '../components/SharedTopStudents'
import api from '../services/api'

const NAV = [
  { id: 'profile',  icon: '👤', label: 'Profile' },
  { id: 'register', icon: '📋', label: 'Register' },
  { id: 'audit',    icon: '📊', label: 'Course Audit' },
  { id: 'top',      icon: '🏆', label: 'Top Students' },
]

export default function StudentDashboard() {
  const { user } = useAuth()
  const [page, setPage] = useState('profile')
  const [alert, setAlert] = useState({ msg: '', type: 'success' })
  const [showPwModal, setShowPwModal] = useState(false)
  const [profile, setProfile] = useState(null)
  const [grades, setGrades] = useState([])
  const [result, setResult] = useState(null)
  const [availableSubjects, setAvailableSubjects] = useState([])
  const [selectedSubjectIds, setSelectedSubjectIds] = useState([])
  const [registered, setRegistered] = useState(false)
  const [teacherMap, setTeacherMap] = useState({})

  const showAlert = (msg, type = 'success') => setAlert({ msg, type })

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    const data = await api.get('/users/profile')
    setProfile(data)
  }

  async function loadRegisterPage() {
    const p = await api.get('/users/profile')
    setProfile(p)
    const subs = await api.get(`/subjects?grade=${p.grade}`)
    setAvailableSubjects(subs)
    setSelectedSubjectIds(subs.map(s => s._id))
    setRegistered(p.selectedSubjects?.length > 0)
    try {
      const map = await api.get(`/subjects/teachers?grade=${p.grade}&academicYear=${p.academicYear}`)
      setTeacherMap(map)
    } catch (e) { setTeacherMap({}) }
  }

  async function submitRegistration() {
    try {
      await api.post('/users/select-subjects', { subjectIds: selectedSubjectIds })
      setRegistered(true)
      loadProfile()
    } catch (err) {
      showAlert(err.message || 'Registration failed', 'error')
    }
  }

  async function printSlip() {
    // Fetch teacher assignments for this grade and year
    let teacherMap = {}
    try {
      teacherMap = await api.get(`/subjects/teachers?grade=${profile.grade}&academicYear=${profile.academicYear}`)
    } catch (e) { /* fallback to TBA */ }

    const win = window.open('', '_blank')
    const rows = availableSubjects.map((s, i) => {
      const teacher = teacherMap[s._id] || 'TBA'
      return `
        <tr>
          <td style="text-align:center">${i + 1}</td>
          <td>${s.name}</td>
          <td style="text-align:center">${teacher}</td>
        </tr>`
    }).join('')

    win.document.write(`<!DOCTYPE html>
<html><head><title>Course Registration Slip</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; background:#e8e8e8; padding: 20px; }
  .page { background:#fff; max-width:680px; margin:0 auto; padding:30px 36px; box-shadow:0 2px 8px rgba(0,0,0,0.15); }
  .top-bar { display:flex; justify-content:space-between; align-items:center; border-bottom:2px solid #2a7a6e; padding-bottom:8px; margin-bottom:20px; }
  .top-bar span { color:#2a7a6e; font-size:13px; font-weight:bold; }
  .logo-area { text-align:center; margin-bottom:18px; }
  .logo-area .circle { width:72px; height:72px; border-radius:50%; border:3px solid #2a7a6e; margin:0 auto 6px; display:flex; align-items:center; justify-content:center; font-size:28px; }
  .logo-area p { font-size:12px; font-weight:bold; letter-spacing:1px; color:#333; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px 20px; margin-bottom:14px; font-size:13px; border-bottom:1px solid #ccc; padding-bottom:12px; }
  .info-grid .lbl { color:#555; }
  .info-grid .val { font-weight:bold; color:#222; }
  .slip-title { text-align:center; font-size:14px; font-weight:bold; border:1px solid #333; padding:5px; margin-bottom:14px; }
  .student-row { display:grid; grid-template-columns:1fr 1fr; gap:6px; font-size:13px; margin-bottom:12px; }
  table { width:100%; border-collapse:collapse; font-size:13px; margin-bottom:14px; }
  th { background:#2a7a6e; color:#fff; padding:7px 10px; text-align:left; }
  td { padding:6px 10px; border-bottom:1px solid #ddd; }
  .footer-row { display:grid; grid-template-columns:1fr 1fr; gap:10px; font-size:12px; margin-top:10px; }
  .success { color:#7b2fbe; font-size:18px; font-weight:bold; margin-top:16px; line-height:1.4; }
  @media print { body { background:#fff; padding:0; } .page { box-shadow:none; } }
</style></head>
<body>
<div class="page">
  <div class="top-bar">
    <span>Student Semester Course Registration</span>
    <span>🖨</span>
  </div>

  <div class="logo-area">
    <div class="circle">🏫</div>
    <p>OFFICE OF THE REGISTRAR</p>
  </div>

  <div class="info-grid">
    <div><span class="lbl">Grade Level &nbsp;</span><span class="val">Grade ${profile?.grade}</span></div>
    <div><span class="lbl">Issue Date &nbsp;</span><span class="val">${new Date().toLocaleDateString('en-US', { month:'long', day:'2-digit', year:'numeric' })}</span></div>
    <div><span class="lbl">Section &nbsp;</span><span class="val">${profile?.section || 'TBA'}</span></div>
    <div><span class="lbl">Academic Year &nbsp;</span><span class="val">${profile?.academicYear}</span></div>
  </div>

  <div class="slip-title">Course Registration Slip</div>

  <div class="student-row">
    <div><span class="lbl">ID Number &nbsp;</span><span class="val">${profile?.studentId || '—'}</span></div>
    <div><span class="lbl">Name &nbsp;</span><span class="val">${profile?.name}</span></div>
  </div>

  <table>
    <thead>
      <tr><th>#</th><th>Course Title</th><th>Instructor</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="2" style="text-align:right;font-weight:bold;padding:8px 10px;">Total Subjects</td><td style="font-weight:bold;padding:8px 10px;">${availableSubjects.length}</td></tr>
    </tfoot>
  </table>

  <div class="footer-row">
    <div>Advisor Name: ___________________</div>
    <div>Registrar Name: ___________________</div>
  </div>

  <div class="success">REGISTERED<br>SUCCESSFULLY</div>
</div>
<script>window.onload = () => window.print()</script>
</body></html>`)
    win.document.close()
  }

  async function loadAudit() {
    const [g, p] = await Promise.all([api.get('/grades'), api.get('/users/profile')])
    setGrades(g)
    setProfile(p)
    try {
      const r = await api.get(`/grades/result/${p._id}`)
      setResult(r)
    } catch { setResult(null) }
  }

  function navigate(id) {
    setPage(id)
    if (id === 'register') loadRegisterPage()
    if (id === 'audit') loadAudit()
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const base64 = ev.target.result.split(',')[1]
      try {
        await api.put('/users/profile/photo', { photo: base64 })
        showAlert('Photo updated successfully')
        loadProfile()
      } catch (err) { showAlert(err.message || 'Failed to upload photo', 'error') }
    }
    reader.readAsDataURL(file)
  }

  const photoSrc = profile?.photo
    ? `data:image/jpeg;base64,${profile.photo}`
    : 'https://via.placeholder.com/113x113?text=Photo'

  return (
    <div className="dashboard-layout">
      <Sidebar
        title=""
        navItems={NAV}
        activePage={page}
        onNav={navigate}
        onPasswordModal={() => setShowPwModal(true)}
      >
        {/* Photo in sidebar header */}
        <div style={{ textAlign: 'center', paddingBottom: 10 }}>
          <div className="profile-photo-wrap" onClick={() => document.getElementById('photoInputSidebar').click()}>
            <img src={photoSrc} alt="Profile" />
            <div className="photo-overlay">Click to change</div>
          </div>
          <input type="file" id="photoInputSidebar" accept="image/*" style={{ display: 'none' }} onChange={uploadPhoto} />
          <h3 style={{ color: '#fff', fontSize: 15, marginTop: 8 }}>{profile?.name || user?.name}</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12 }}>Grade {profile?.grade} • {profile?.academicYear}</p>
        </div>
      </Sidebar>

      <main className="main-content">
        <Alert message={alert.msg} type={alert.type} onClose={() => setAlert({ msg: '' })} />

        {/* Profile */}
        {page === 'profile' && profile && (
          <div>
            <div className="page-title">My Profile</div>
            <div className="profile-card">
              <img src={photoSrc} className="profile-photo-large" alt="Profile" />
              <button className="upload-btn" onClick={() => document.getElementById('photoInputSidebar').click()}>
                📷 Upload 3×3 Photo
              </button>
              <div className="profile-info" style={{ marginTop: 20 }}>
                {[['Name', profile.name], ['Student ID', profile.studentId], ['Grade', profile.grade],
                  ['Section', profile.section], ['Academic Year', profile.academicYear], ['Email', profile.email]
                ].map(([l, v]) => (
                  <p key={l}>{l}: <span>{v || '—'}</span></p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Register — formal registration slip */}
        {page === 'register' && profile && (
          <div>
            <div className="page-title">Course Registration</div>

            {!registered ? (
              /* Pre-registration view */
              <div className="course-card">
                <div style={{ marginBottom: 16 }}>
                  <span className="year-badge">Academic Year: {profile.academicYear}</span>
                  <span style={{ marginLeft: 10, fontSize: 13, color: '#666' }}>Grade {profile.grade} — Mandatory Courses</span>
                </div>
                {availableSubjects.length === 0
                  ? <p style={{ color: '#999' }}>No subjects available for Grade {profile.grade}.</p>
                  : <>
                      <table>
                        <thead><tr><th>#</th><th>Course Title</th><th>Instructor</th></tr></thead>
                        <tbody>
                          {availableSubjects.map((s, i) => (
                            <tr key={s._id}>
                              <td style={{ textAlign: 'center', width: 40 }}>{i + 1}</td>
                              <td>{s.name}</td>
                              <td style={{ color: '#999' }}>TBA</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div style={{ marginTop: 20 }}>
                        <button className="btn btn-primary" onClick={submitRegistration}>
                          📋 Register
                        </button>
                      </div>
                    </>
                }
              </div>
            ) : (
              /* Post-registration slip */
              <div>
                {/* Action bar */}
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <button className="btn btn-success" onClick={printSlip}>🖨️ Print Slip</button>
                  <button className="btn btn-primary" onClick={() => setRegistered(false)} style={{ background: '#888' }}>
                    ← Back
                  </button>
                </div>

                {/* Slip */}
                <div className="reg-slip">
                  <div className="reg-slip-topbar">
                    <span>Student Semester Course Registration</span>
                  </div>

                  <div className="reg-slip-logo">
                    <div className="reg-slip-circle">🏫</div>
                    <p>OFFICE OF THE REGISTRAR</p>
                  </div>

                  <div className="reg-slip-inforow">
                    <div><span className="lbl">Grade Level</span><span className="val">Grade {profile.grade}</span></div>
                    <div><span className="lbl">Issue Date</span><span className="val">{new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })}</span></div>
                    <div><span className="lbl">Section</span><span className="val">{profile.section || 'TBA'}</span></div>
                    <div><span className="lbl">Academic Year</span><span className="val">{profile.academicYear}</span></div>
                  </div>

                  <div className="reg-slip-title">Course Registration Slip</div>

                  <div className="reg-slip-student">
                    <div><span className="lbl">ID Number</span> <span className="val">{profile.studentId || '—'}</span></div>
                    <div><span className="lbl">Name</span> <span className="val">{profile.name}</span></div>
                  </div>

                  <table>
                    <thead>
                      <tr><th style={{ width: 40 }}>#</th><th>Course Title</th><th>Instructor</th></tr>
                    </thead>
                    <tbody>
                      {availableSubjects.map((s, i) => (
                        <tr key={s._id}>
                          <td style={{ textAlign: 'center' }}>{i + 1}</td>
                          <td>{s.name}</td>
                          <td style={{ color: teacherMap[s._id] ? '#333' : '#999' }}>
                            {teacherMap[s._id] || 'TBA'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={2} style={{ textAlign: 'right', fontWeight: 'bold', padding: '8px 12px' }}>Total Subjects</td>
                        <td style={{ fontWeight: 'bold', padding: '8px 12px' }}>{availableSubjects.length}</td>
                      </tr>
                    </tfoot>
                  </table>

                  <div className="reg-slip-footer">
                    <div>Advisor Name: ___________________</div>
                    <div>Registrar Name: ___________________</div>
                  </div>

                  <div className="reg-slip-success">REGISTERED<br />SUCCESSFULLY</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Course Audit */}
        {page === 'audit' && (
          <div>
            <div className="page-title">Course Audit</div>
            <div className="audit-summary">
              <div className="audit-stat">
                <div className="stat-value">{result?.calculated ? result.average : '—'}</div>
                <div className="stat-label">Average Score</div>
              </div>
              <div className="audit-stat">
                <div className="stat-value">{grades.length}</div>
                <div className="stat-label">Subjects Graded</div>
              </div>
              <div className="audit-stat">
                <div className={`status-badge ${result?.calculated ? (result.passed ? 'status-pass' : 'status-fail') : 'status-pending'}`}>
                  {result?.calculated ? (result.passed ? 'PASSED' : 'FAILED') : 'Pending'}
                </div>
                <div className="stat-label" style={{ marginTop: 8 }}>Overall Status</div>
              </div>
            </div>

            {/* Promotion banner */}
            {result?.calculated && (
              <div className={`promotion-banner ${result.passed ? 'promotion-pass' : 'promotion-fail'}`} style={{ marginBottom: 18 }}>
                {result.passed
                  ? result.nextGrade === 'Graduated'
                    ? '🎓 Congratulations! You have graduated.'
                    : `✅ You passed Grade ${result.currentGrade}. You are promoted to Grade ${result.nextGrade} next academic year.`
                  : `❌ You did not pass Grade ${result.currentGrade}. You must re-register for Grade ${result.nextGrade} next academic year.${result.failReason ? ` (${result.failReason})` : ''}`
                }
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: 10, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <table id="auditTable">
                <thead><tr><th>Subject</th><th>Score</th><th>Semester</th><th>Date</th></tr></thead>
                <tbody>
                  {grades.length === 0
                    ? <tr><td colSpan={4} style={{ textAlign: 'center', color: '#999' }}>No grades submitted yet</td></tr>
                    : grades.map(g => (
                      <tr key={g._id}>
                        <td>{g.subjectId?.name || 'N/A'}</td>
                        <td style={g.score < 50 || g.ng ? { color: 'red', fontWeight: 'bold' } : {}}>
                          {g.ng ? 'NG' : g.score}
                        </td>
                        <td>Semester {g.semester}</td>
                        <td>{new Date(g.submittedAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
              {!result?.calculated && profile && (
                <p style={{ marginTop: 12, fontSize: 13, color: '#888' }}>
                  {grades.length} of {(profile.selectedSubjects || []).length} subject(s) graded. Result will appear when all grades are submitted.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      <ChangePasswordModal show={showPwModal} onClose={() => setShowPwModal(false)} onAlert={showAlert} />
        {/* Top Students */}
        {page === 'top' && <div style={{ padding: '0' }}><SharedTopStudents /></div>}
    </div>
  )
}
