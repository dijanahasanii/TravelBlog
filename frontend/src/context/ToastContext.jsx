import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const dismiss = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    )
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 220)
  }, [])

  const toast = useCallback(
    (message, type = 'default', duration = 3500) => {
      const id = ++idRef.current
      setToasts((prev) => [...prev, { id, message, type, exiting: false }])
      setTimeout(() => dismiss(id), duration)
      return id
    },
    [dismiss]
  )

  const api = {
    success: (msg, d) => toast(msg, 'success', d),
    error: (msg, d) => toast(msg, 'error', d),
    warning: (msg, d) => toast(msg, 'warning', d),
    info: (msg, d) => toast(msg, 'info', d),
    show: toast,
    dismiss,
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside ToastProvider')
  return ctx
}

const icons = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
}

function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type} ${t.exiting ? 'toast-exit' : ''}`}
          role="alert"
        >
          {icons[t.type] && (
            <span style={{ flexShrink: 0, marginTop: 1 }}>{icons[t.type]}</span>
          )}
          <span style={{ flex: 1 }}>{t.message}</span>
          <button
            onClick={() => dismiss(t.id)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              opacity: 0.7,
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
