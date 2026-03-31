import { useTheme } from '../context/ThemeContext'

export default function Settings() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <div className="page-title">Settings</div>
      <div className="card" style={{ maxWidth: 420 }}>
        <h3 style={{ marginBottom: 20, fontSize: 15, color: 'var(--text-secondary)' }}>Appearance</h3>

        <div style={{ display: 'flex', gap: 16 }}>
          {/* Light */}
          <div
            onClick={() => setTheme('light')}
            style={{
              flex: 1, cursor: 'pointer', borderRadius: 10, overflow: 'hidden',
              border: `2px solid ${theme === 'light' ? '#667eea' : 'var(--border-color)'}`,
              transition: 'border 0.2s'
            }}
          >
            {/* Preview */}
            <div style={{ background: '#f0f2f5', padding: 12 }}>
              <div style={{ display: 'flex', gap: 6, height: 60 }}>
                <div style={{ width: 28, background: '#fff', borderRadius: 4, border: '1px solid #e8e8f0' }} />
                <div style={{ flex: 1, background: '#fff', borderRadius: 4, border: '1px solid #e8e8f0' }} />
              </div>
            </div>
            <div style={{
              padding: '10px 14px', background: 'var(--card-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--text-primary)' }}>☀️ Light</span>
              {theme === 'light' && <span style={{ color: '#667eea', fontSize: 16 }}>✓</span>}
            </div>
          </div>

          {/* Dark */}
          <div
            onClick={() => setTheme('dark')}
            style={{
              flex: 1, cursor: 'pointer', borderRadius: 10, overflow: 'hidden',
              border: `2px solid ${theme === 'dark' ? '#667eea' : 'var(--border-color)'}`,
              transition: 'border 0.2s'
            }}
          >
            {/* Preview */}
            <div style={{ background: '#12121a', padding: 12 }}>
              <div style={{ display: 'flex', gap: 6, height: 60 }}>
                <div style={{ width: 28, background: '#1e1e2e', borderRadius: 4, border: '1px solid #2e2e42' }} />
                <div style={{ flex: 1, background: '#1e1e2e', borderRadius: 4, border: '1px solid #2e2e42' }} />
              </div>
            </div>
            <div style={{
              padding: '10px 14px', background: 'var(--card-bg)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--text-primary)' }}>🌙 Dark</span>
              {theme === 'dark' && <span style={{ color: '#667eea', fontSize: 16 }}>✓</span>}
            </div>
          </div>
        </div>

        <p style={{ marginTop: 16, fontSize: 12, color: 'var(--text-secondary)' }}>
          Your preference is saved automatically.
        </p>
      </div>
    </div>
  )
}
