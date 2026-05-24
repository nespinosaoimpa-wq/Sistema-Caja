'use client'

import { createContext, useContext, useState, useCallback } from 'react'

import { CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

const ToastContext = createContext({})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback(({ message, type = 'info', duration = 3500 }) => {
    const id = Date.now()
    const icons = { 
      success: <CheckCircle size={16} style={{ color: 'var(--color-secondary)' }} />, 
      error: <AlertCircle size={16} style={{ color: 'var(--color-error)' }} />, 
      warning: <AlertTriangle size={16} style={{ color: '#f59e0b' }} />, 
      info: <Info size={16} style={{ color: 'var(--color-primary)' }} /> 
    }

    setToasts(prev => [...prev, { id, message, type, icon: icons[type] }])

    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const toast = {
    success: (msg) => addToast({ message: msg, type: 'success' }),
    error: (msg) => addToast({ message: msg, type: 'error' }),
    warning: (msg) => addToast({ message: msg, type: 'warning' }),
    info: (msg) => addToast({ message: msg, type: 'info' }),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{t.icon}</span>
            <span className="toast-message">{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: '1rem', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}
