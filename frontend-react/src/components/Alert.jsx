import { useEffect, useState } from 'react'

export default function Alert({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, 3000)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null
  return (
    <div className={`alert alert-${type}`}>{message}</div>
  )
}
