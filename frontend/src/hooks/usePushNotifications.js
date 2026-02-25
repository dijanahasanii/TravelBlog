/**
 * usePushNotifications
 *
 * Handles:
 *  1. Checking/requesting Notification permission
 *  2. Fetching the VAPID public key from the backend
 *  3. Subscribing the browser to push notifications
 *  4. Persisting the subscription to the notification-service
 */
import { useEffect, useCallback, useState } from 'react'
import { NOTIF_SERVICE } from '../constants/api'
import api from '../utils/api'
import { fetchWithTimeout } from '../utils/fetchWithTimeout'
import { parseResponse } from '../utils/parseResponse'

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = atob(base64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

const SUB_KEY = 'wandr_push_subscribed'

export default function usePushNotifications() {
  const [supported,   setSupported]   = useState(false)
  const [permission,  setPermission]  = useState('default')
  const [subscribed,  setSubscribed]  = useState(false)

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setSupported(true)
      setPermission(Notification.permission)
      setSubscribed(
        Notification.permission === 'granted' &&
        localStorage.getItem(SUB_KEY) === 'true'
      )
    }
  }, [])

  const subscribe = useCallback(async () => {
    if (!supported) return { ok: false, reason: 'not_supported' }

    try {
      // 1. Request permission
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') return { ok: false, reason: 'denied' }

      const keyRes = await fetchWithTimeout(`${NOTIF_SERVICE}/push/vapid-public-key`, { timeout: 5000 })
      const parsed = await parseResponse(keyRes)
      if (!parsed.ok || !parsed.data?.key) return { ok: false, reason: 'vapid_fetch_failed' }
      const { key } = parsed.data

      // 3. Subscribe via PushManager
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly:      true,
        applicationServerKey: urlBase64ToUint8Array(key),
      })

      // 4. Save to backend
      const userId = localStorage.getItem('currentUserId')
      if (!userId) return { ok: false, reason: 'not_logged_in' }

      try {
        await api.post(`${NOTIF_SERVICE}/push/subscribe`, { userId, subscription: subscription.toJSON() })
      } catch (_) {
        return { ok: false, reason: 'save_failed' }
      }
      localStorage.setItem(SUB_KEY, 'true')
      setSubscribed(true)
      return { ok: true }
    } catch (err) {
      console.warn('Push subscribe error:', err)
      return { ok: false, reason: err.message }
    }
  }, [supported])

  const unsubscribe = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        const userId = localStorage.getItem('currentUserId')
        if (userId) {
          await api.delete(`${NOTIF_SERVICE}/push/unsubscribe`, {
            data: { userId, endpoint: subscription.endpoint },
          })
        }
      }
      localStorage.removeItem(SUB_KEY)
      setSubscribed(false)
    } catch (err) {
      console.warn('Push unsubscribe error:', err)
    }
  }, [])

  // Auto-subscribe on mount if previously subscribed and permission is granted
  useEffect(() => {
    if (!supported) return
    const wasSubscribed = localStorage.getItem(SUB_KEY) === 'true'
    if (wasSubscribed && Notification.permission === 'granted') {
      subscribe()
    }
  }, [supported, subscribe])

  return { supported, permission, subscribed, subscribe, unsubscribe }
}
