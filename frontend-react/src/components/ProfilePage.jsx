import { useState, useEffect } from 'react'
import api from '../services/api'

export default function ProfilePage({ onAlert }) {
  const [profile, setProfile] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [myRequest, setMyRequest] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const data = await api.get('/users/profile')
    setProfile(data)
    setEditForm({ name: data.name || '', email: data.email || '' })
    if (data.role === 'teacher') {
      try {
        const req = await api.get('/profile-requests/mine')
        setMyRequest(req)
      } catch { setMyRequest(null) }
    }
  }

  async function uploadPhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async ev => {
      const base64 = ev.target.result.split(',')[1]
      try {
        await api.put('/users/profile/photo', { photo: base64 })
        onAlert('Photo updated successfully')
        load()
      } catch (err) { onAlert(err.message || 'Failed to upload photo', 'error') }
    }
    reader.readAsDataURL(file)
  }

  async function submitEditRequest(e) {
    e.preventDefault()
    try {
      await api.post('/profile-requests', editForm)
      onAlert('Edit request submitted — waiting for admin approval')
      setEditMode(false)
      load()
    } catch (err) { onAlert(err.message || 'Failed to submit request', 'error') }
  }

  if (!profile) return <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>

  const photoSrc = profile.photo
    ? `data:image/jpeg;base64,${profile.photo}`
    : 'https://via.placeholder.com/113x113?text=Photo'

  const statusColor = { pending: '#856404', approved: '#1e7e34', rejected: '#c62828' }
  const statusBg    = { pending: '#fff3cd', approved: '#e6f4ea', rejected: '#fdecea' }

  return (
    <div>
      <div className="page-title">My Profile</div>
      <div className="profile-card">
        <img src={photoSrc} className="profile-photo-large" alt="Profile" />
        <button className="upload-btn" onClick={() => document.getElementById('profilePhotoInput').click()}>
          📷 Upload Photo
        </button>
        <input type="file" id="profilePhotoInput" accept="image/*" style={{ display: 'none' }} onChange={uploadPhoto} />

        {/* Info */}
        {!editMode ? (
          <div className="profile-info" style={{ marginTop: 20 }}>
            {[
              ['Name',     profile.name],
              ['Username', profile.username],
              ['Email',    profile.email],
              ['Role',     profile.role?.charAt(0).toUpperCase() + profile.role?.slice(1)],
            ].map(([l, v]) => (
              <p key={l}>{l}: <span>{v || '—'}</span></p>
            ))}

            {/* Show pending request status */}
            {myRequest && (
              <div style={{
                marginTop: 14, padding: '8px 14px', borderRadius: 8,
                background: statusBg[myRequest.status],
                color: statusColor[myRequest.status],
                fontSize: 13
              }}>
                {myRequest.status === 'pending' && '⏳ Edit request pending admin approval'}
                {myRequest.status === 'approved' && '✅ Your last edit request was approved'}
                {myRequest.status === 'rejected' && '❌ Your last edit request was rejected'}
              </div>
            )}

            {/* Only teachers can request edits */}
            {profile.role === 'teacher' && (
              <button
                className="upload-btn"
                style={{ marginTop: 16 }}
                onClick={() => setEditMode(true)}
              >
                ✏️ Request Info Edit
              </button>
            )}
          </div>
        ) : (
          /* Edit form */
          <form onSubmit={submitEditRequest} style={{ marginTop: 20 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              Changes require admin approval before taking effect.
            </p>
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={editForm.name}
                onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={editForm.email}
                onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button type="submit" className="btn btn-primary">Submit Request</button>
              <button type="button" className="btn" style={{ background: '#888', color: '#fff' }}
                onClick={() => setEditMode(false)}>Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
