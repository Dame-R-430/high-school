import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Alert from '../components/Alert'
import ChangePasswordModal from '../components/ChangePasswordModal'
import ProfilePage from '../components/ProfilePage'
import SharedTopStudents from '../components/SharedTopStudents'
import api from '../services/api'

const NAV = [
  { id: 'profile',   icon: '👤', label: 'Profile' },
  { id: 'overview',  icon: '🏠', label: 'Overview' },
  { id: 'students',  icon: '🎓', label: 'Students', isGroup: true },
  { id: 'dir9',      icon: '·',  label: 'Grade 9',  indent: true },
  { id: 'dir10',     icon: '·',  label: 'Grade 10', indent: true },
  { id: 'dir11',     icon: '·',  label: 'Grade 11', indent: true },
  { id: 'dir12',     icon: '·',  label: 'Grade 12', indent: true },
  { id: 'rankings',  icon: '🏆', label: 'Rankings' },
  { id: 'top3',      icon: '⭐', label: 'Top Students' },
]

export default function DirectorDashboard() {
  const { user } = useAuth()
  const [page, setPage] = useState('overview')
  const [alert, setAlert] = useState({ msg: '', type: 'success' })
  const [showPwModal, setShowPwModal] = useState(false)

  const [overview, setOverview] = useState(null)
  const [students, setStudents] = useState([])
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [filterSection, setFilterSection] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [classRankings, setClassRankings] = useState([])
  const [rankFilter, setRankFilter] = useState({ grade: '9', section: 'A', academicYear: new Date().getFullYear() })

  const showAlert = (msg, type = 'success') => setAlert({ msg, type })

  useEffect(() => { loadOverview() }, [])

  async function loadOverview() {
    try {
      const data = await api.get('/director/overview')
      setOverview(data)
    } catch { setOverview(null) }
  }

  async function navigate(id) {
    setPage(id)
    if (id.startsWith('dir')) {
      const g = parseInt(id.replace('dir', ''))
      setSelectedGrade(g)
      loadStudents(g)
    }
    if (id === 'rankings') loadClassRankings()
  }

  async function loadStudents(grade, section = filterSection, year = filterYear) {
    let url = `/director/students?grade=${grade}`
    if (section) url += `&section=${section}`
    if (year)    url += `&academicYear=${year}`
    const data = await api.get(url)
    setStudents(data)
  }

  async function loadClassRankings(filter = rankFilter) {
    try {
      const data = await api.get(`/rankings/class?grade=${filter.grade}&section=${filter.section}&academicYear=${filter.academicYear}`)
      setClassRankings(data)
    } catch { setClassRankings([]) }
  }

  const passRate = overview
    ? overview.totalGraded > 0
      ? Math.round((overview.totalPassed / overview.totalGraded) * 100)
      : 0
    : 0

  return (
    <div className="dashboard-layout">
      <Sidebar
        title="🏫 Director"
        subtitle={user?.name}
        navItems={NAV}
        activePage={page}
        onNav={navigate}
        onPasswordModal={() => setShowPwModal(true)}
      />

      <main className="main-content">
        <Alert message={alert.msg} type={alert.type} onClose={() => setAlert({ msg: '' })} />

        {/* Profile */}
        {page === 'profile' && <ProfilePage onAlert={showAlert} />}

        {/* Overview */}
        {page === 'overview' && overview && (
          <div>
            <div className="page-title">School Overview</div>

            {/* Summary stats */}
            <div className="stats-row">
              {[
                ['Total Students', overview.totalStudents],
                ['Total Teachers', overview.totalTeachers],
                ['Results Calculated', overview.totalGraded],
                ['Passed', overview.totalPassed],
                ['Failed', overview.totalFailed],
                ['Pass Rate', `${passRate}%`],
              ].map(([l, v]) => (
                <div className="stat-card" key={l}>
                  <div className="val" style={{ fontSize: typeof v === 'string' && v.includes('%') ? 22 : 28 }}>{v}</div>
                  <div className="lbl">{l}</div>
                </div>
              ))}
            </div>

            {/* Per-grade breakdown */}
            <div className="card">
              <h3 style={{ marginBottom: 16, fontSize: 15, color: 'var(--text-secondary)' }}>Results by Grade</h3>
              <table>
                <thead>
                  <tr><th>Grade</th><th>Total Students</th><th>Graded</th><th>Passed</th><th>Failed</th><th>Avg Score</th><th>Pass Rate</th></tr>
                </thead>
                <tbody>
                  {overview.byGrade.map(g => {
                    const rate = g.graded > 0 ? Math.round((g.passed / g.graded) * 100) : 0
                    return (
                      <tr key={g.grade}>
                        <td><strong>Grade {g.grade}</strong></td>
                        <td>{g.total}</td>
                        <td>{g.graded}</td>
                        <td style={{ color: '#1e7e34', fontWeight: 'bold' }}>{g.passed}</td>
                        <td style={{ color: '#c62828', fontWeight: 'bold' }}>{g.failed}</td>
                        <td>{g.avgScore ?? '—'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ flex: 1, height: 8, background: 'var(--border-color)', borderRadius: 4, overflow: 'hidden' }}>
                              <div style={{ width: `${rate}%`, height: '100%', background: rate >= 70 ? '#27ae60' : rate >= 50 ? '#f39c12' : '#e74c3c', borderRadius: 4 }} />
                            </div>
                            <span style={{ fontSize: 12, minWidth: 32 }}>{rate}%</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Students by grade — read only */}
        {page.startsWith('dir') && (
          <div>
            <div className="page-title">Grade {selectedGrade} Students</div>
            <div className="card">
              <div className="filter-row" style={{ marginBottom: 16 }}>
                <select value={filterSection} onChange={e => { setFilterSection(e.target.value); loadStudents(selectedGrade, e.target.value, filterYear) }}>
                  <option value="">All Sections</option>
                  {['A','B','C','D','E','F','G'].map(s => <option key={s} value={s}>Section {s}</option>)}
                </select>
                <select value={filterYear} onChange={e => { setFilterYear(e.target.value); loadStudents(selectedGrade, filterSection, e.target.value) }}>
                  <option value="">All Years</option>
                  {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <table>
                <thead>
                  <tr><th>Student ID</th><th>Name</th><th>Section</th><th>Average</th><th>Status</th><th>Next</th></tr>
                </thead>
                <tbody>
                  {students.length === 0
                    ? <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No students found.</td></tr>
                    : students.map(s => (
                      <tr key={s._id}>
                        <td>{s.studentId || '—'}</td>
                        <td>{s.name}</td>
                        <td>{s.section || '—'}</td>
                        <td style={{ fontWeight: 'bold' }}>{s.average ?? '—'}</td>
                        <td>
                          {s.average !== null
                            ? <span style={{ color: s.passed ? 'green' : 'red', fontWeight: 'bold' }}>{s.passed ? 'PASS' : 'FAIL'}</span>
                            : <span style={{ color: 'var(--text-secondary)' }}>Pending</span>}
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {s.nextGrade === 'Graduated' ? '🎓 Graduated' : s.nextGrade ? `Grade ${s.nextGrade}` : '—'}
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
            <div className="page-title">Class Rankings</div>
            <div className="card">
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
                <thead><tr><th>Rank</th><th>Name</th><th>Student ID</th><th>Section</th><th>Average</th><th>Status</th></tr></thead>
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
                        <td><span style={{ color: s.passed ? 'green' : 'red', fontWeight: 'bold' }}>{s.passed ? 'PASS' : 'FAIL'}</span></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Top 3 shared */}
        {page === 'top3' && <SharedTopStudents />}

      </main>

      <ChangePasswordModal show={showPwModal} onClose={() => setShowPwModal(false)} onAlert={showAlert} />
    </div>
  )
}
