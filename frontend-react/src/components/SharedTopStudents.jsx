import { useState, useEffect } from 'react'
import api from '../services/api'

export default function SharedTopStudents() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/rankings/shared')
      .then(data => setStudents(data))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>

  return (
    <div>
      <div className="page-title">🏆 Top Students</div>
      <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
        Published by admin — read only.
      </p>

      {students.length === 0
        ? <div className="card"><p style={{ color: 'var(--text-secondary)' }}>No results have been shared by admin yet.</p></div>
        : (
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {students.map((s, i) => (
              <div key={s._id} style={{
                flex: 1, minWidth: 200, padding: '22px 24px', borderRadius: 12,
                background: i === 0 ? '#fff8e1' : i === 1 ? '#f5f5f5' : '#fff3e0',
                border: `2px solid ${i === 0 ? '#ffc107' : i === 1 ? '#9e9e9e' : '#ff9800'}`,
                textAlign: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: 36 }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</div>
                <div style={{ fontWeight: 'bold', fontSize: 16, marginTop: 8 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                  Grade {s.grade} — Section {s.section}
                </div>
                {s.studentId && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>ID: {s.studentId}</div>
                )}
                <div style={{ fontSize: 26, fontWeight: 'bold', color: '#667eea', marginTop: 12 }}>{s.average}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Average Score</div>
                <div style={{ marginTop: 8 }}>
                  <span style={{
                    padding: '3px 12px', borderRadius: 20, fontSize: 12, fontWeight: 'bold',
                    background: s.passed ? '#e6f4ea' : '#fdecea',
                    color: s.passed ? '#1e7e34' : '#c62828'
                  }}>
                    {s.passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  )
}
