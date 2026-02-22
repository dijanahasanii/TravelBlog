/**
 * Returns an avatar src for a given user object.
 * Prefers the stored base64 `avatar` field; falls back to DiceBear.
 */
export function getAvatarSrc(user) {
  if (!user) return dicebearUrl('user')
  if (user.avatar) return user.avatar
  return dicebearUrl(user.username || user._id || 'user')
}

export function dicebearUrl(seed) {
  return `https://api.dicebear.com/7.x/thumbs/svg?seed=${encodeURIComponent(seed || 'user')}`
}

/**
 * Returns the current logged-in user's avatar src.
 * Reads from localStorage so it's always fresh without an API call.
 */
export function getCurrentUserAvatar() {
  try {
    const stored = localStorage.getItem('currentUser')
    if (stored) {
      const user = JSON.parse(stored)
      if (user.avatar) return user.avatar
      if (user.username) return dicebearUrl(user.username)
    }
  } catch (_) {}
  const username = localStorage.getItem('username')
  return dicebearUrl(username || 'user')
}
