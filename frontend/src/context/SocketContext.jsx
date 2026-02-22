import React, { createContext, useContext, useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { io } from 'socket.io-client'
import { NOTIF_SERVICE } from '../constants/api'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const socketRef   = useRef(null)
  const [unreadCount, setUnreadCount] = useState(0)

  const connectSocket = useCallback((userId) => {
    if (socketRef.current) {
      socketRef.current.disconnect()
      socketRef.current = null
    }

    if (!userId) return

    const socket = io(NOTIF_SERVICE, {
      query: { userId },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    })

    socketRef.current = socket

    socket.on('connect', () => {
      console.log('[Socket] Connected to notification service as', userId)
    })

    socket.on('notification', (notif) => {
      console.log('[Socket] New notification received:', notif)
      setUnreadCount((n) => n + 1)
      window.dispatchEvent(new CustomEvent('new-notification', { detail: notif }))
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected')
    })
  }, [])

  const clearUnread = useCallback(() => setUnreadCount(0), [])

  useEffect(() => {
    const userId = localStorage.getItem('currentUserId')
    if (userId) connectSocket(userId)

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [connectSocket])

  const value = useMemo(
    () => ({ socket: socketRef.current, unreadCount, clearUnread, connectSocket }),
    [unreadCount, clearUnread, connectSocket]
  )

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
