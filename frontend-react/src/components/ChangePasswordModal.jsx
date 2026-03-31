import { useState } from 'react'
import Modal from './Modal'
import api from '../services/api'

export default function ChangePasswordModal({ show, onClose, onAlert }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.newPassword !== form.confirmPassword) {
      onAlert('Passwords do not match', 'error'); return
    }
    try {
      await api.put('/users/change-password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      })
      onAlert('Password changed successfully')
      onClose()
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err) {
      onAlert(err.message || 'Failed to change password', 'error')
    }
  }

  return (
    <Modal show={show} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Current Password</label>
          <input type="password" value={form.currentPassword} onChange={e => setForm({ ...form, currentPassword: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>New Password</label>
          <input type="password" value={form.newPassword} minLength={6} onChange={e => setForm({ ...form, newPassword: e.target.value })} required />
        </div>
        <div className="form-group">
          <label>Confirm New Password</label>
          <input type="password" value={form.confirmPassword} minLength={6} onChange={e => setForm({ ...form, confirmPassword: e.target.value })} required />
        </div>
        <button type="submit" className="btn btn-primary">Change Password</button>
      </form>
    </Modal>
  )
}
