export default function Modal({ show, onClose, title, children }) {
  if (!show) return null
  return (
    <div className="modal" style={{ display: 'block' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span>
        {title && <h3>{title}</h3>}
        {children}
      </div>
    </div>
  )
}
