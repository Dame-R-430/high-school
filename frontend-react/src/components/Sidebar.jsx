import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'

export default function Sidebar({ title, subtitle, navItems, activePage, onNav, onPasswordModal, badge = {}, children }) {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState({})

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function toggleGroup(id) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
        {children}
      </div>
      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.isGroup) {
            const isOpen = !collapsed[item.id]
            return (
              <div key={item.id}>
                {/* Collapsible group header — acts like a nav button */}
                <div
                  className="nav-item"
                  style={{ justifyContent: 'space-between' }}
                  onClick={() => toggleGroup(item.id)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                    <span className="nav-icon">{item.icon}</span> {item.label}
                  </span>
                  <span style={{ fontSize: 12, opacity: 0.7 }}>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Sub-items: only those immediately following this group, stop at next non-indent */}
                {isOpen && (() => {
                  const subItems = []
                  for (let i = idx + 1; i < navItems.length; i++) {
                    if (!navItems[i].indent) break
                    subItems.push(navItems[i])
                  }
                  return subItems.map(sub => (
                    <div
                      key={sub.id}
                      className={`nav-item${activePage === sub.id ? ' active' : ''}`}
                      style={{ paddingLeft: 40, fontSize: 13 }}
                      onClick={() => onNav(sub.id)}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: activePage === sub.id ? '#fff' : 'rgba(255,255,255,0.5)', display: 'inline-block', marginRight: 10 }} />
                      {sub.label}
                    </div>
                  ))
                })()}
              </div>
            )
          }

          // Skip indent items — they're rendered inside the group above
          if (item.indent) return null

          return (
            <div
              key={item.id}
              className={`nav-item${activePage === item.id ? ' active' : ''}`}
              onClick={() => onNav(item.id)}
            >
              <span className="nav-icon">{item.icon}</span> {item.label}
              {badge[item.id] > 0 && (
                <span style={{ marginLeft: 'auto', background: '#e74c3c', color: '#fff', borderRadius: 20, padding: '1px 8px', fontSize: 11, fontWeight: 'bold' }}>
                  {badge[item.id]}
                </span>
              )}
            </div>
          )
        })}
      </nav>
      <div className="sidebar-footer">
        <button style={{ background: '#fff', color: '#667eea' }} onClick={onPasswordModal}>
          🔒 Change Password
        </button>
        <button style={{ background: '#e74c3c', color: '#fff' }} onClick={handleLogout}>
          ⏻ Logout
        </button>
      </div>
    </aside>
  )
}
