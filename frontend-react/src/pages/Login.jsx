import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [view, setView] = useState('login')
  const [alert, setAlert] = useState({ msg: '', type: '' })
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [regForm, setRegForm] = useState({
    name: '', email: '', username: '', password: '',
    grade: '9', academicYear: '2026', grade8MinisterResult: null
  })
  const [ministerPreview, setMinisterPreview] = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    try {
      const res = await axios.post('/api/auth/login', loginForm)
      login(res.data.user, res.data.token)
      const role = res.data.user.role
      navigate(role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student')
    } catch (err) {
      setAlert({ msg: err.response?.data?.message || 'Login failed', type: 'error' })
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    if (regForm.grade === '9' && !regForm.grade8MinisterResult) {
      setAlert({ msg: 'Grade 8 Minister result is required for Grade 9 registration', type: 'error' }); return
    }
    const fd = new FormData()
    Object.entries(regForm).forEach(([k, v]) => {
      if (k !== 'grade8MinisterResult' && v !== null) fd.append(k, v)
    })
    if (regForm.grade8MinisterResult) fd.append('grade8MinisterResult', regForm.grade8MinisterResult)
    try {
      const res = await axios.post('/api/auth/register', fd)
      setAlert({ msg: res.data.message, type: 'success' })
      setTimeout(() => setView('login'), 3000)
    } catch (err) {
      setAlert({ msg: err.response?.data?.message || 'Registration failed', type: 'error' })
    }
  }

  function onMinisterChange(e) {
    const file = e.target.files[0]
    if (!file) return
    setRegForm({ ...regForm, grade8MinisterResult: file })
    const reader = new FileReader()
    reader.onload = ev => setMinisterPreview(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="container login-container">
      <h1 style={{ textAlign: 'center', color: '#667eea', marginBottom: 30 }}>Grade Submission System</h1>
      {alert.msg && <div className={`alert alert-${alert.type}`}>{alert.msg}</div>}

      {view === 'login' ? (
        <div>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Username</label>
              <input type="text" value={loginForm.username} onChange={e => setLoginForm({ ...loginForm, username: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={loginForm.password} onChange={e => setLoginForm({ ...loginForm, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Login</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20 }}>
            Don't have an account? <a href="#" onClick={e => { e.preventDefault(); setView('register') }}>Register as Student</a>
          </p>
        </div>
      ) : (
        <div>
          <h2>Student Registration</h2>
          <form onSubmit={handleRegister}>
            {[
              { label: 'Full Name', key: 'name', type: 'text' },
              { label: 'Email (Optional)', key: 'email', type: 'email' },
              { label: 'Username', key: 'username', type: 'text' },
              { label: 'Password', key: 'password', type: 'password', minLength: 6 },
            ].map(f => (
              <div className="form-group" key={f.key}>
                <label>{f.label}</label>
                <input type={f.type} minLength={f.minLength}
                  value={regForm[f.key]} onChange={e => setRegForm({ ...regForm, [f.key]: e.target.value })}
                  required={f.key !== 'email'} />
              </div>
            ))}
            <div className="form-group">
              <label>Grade</label>
              <select value={regForm.grade} onChange={e => setRegForm({ ...regForm, grade: e.target.value })}>
                {[9,10,11,12].map(g => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Academic Year</label>
              <select value={regForm.academicYear} onChange={e => setRegForm({ ...regForm, academicYear: e.target.value })}>
                {[2024,2025,2026,2027,2028].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            {/* Grade 8 minister result — only for grade 9 */}
            {regForm.grade === '9' && (
              <div className="form-group">
                <label>Grade 8 Minister Result (Required for Grade 9)</label>
                <small style={{ display: 'block', color: '#888', marginBottom: 6 }}>
                  Upload your Grade 8 national exam result as evidence of passing.
                </small>
                <input type="file" accept="image/jpeg,image/jpg,image/png" onChange={onMinisterChange} required />
                {ministerPreview && (
                  <img src={ministerPreview} style={{ maxWidth: 200, borderRadius: 5, marginTop: 10, border: '2px solid #e74c3c' }} />
                )}
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Register</button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20 }}>
            Already have an account? <a href="#" onClick={e => { e.preventDefault(); setView('login') }}>Login</a>
          </p>
        </div>
      )}
    </div>
  )
}
