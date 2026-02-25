import { USER_SERVICE, CONTENT_SERVICE, NOTIF_SERVICE } from './constants/api'

const BASE_URL = {
  posts:     CONTENT_SERVICE,
  users:     USER_SERVICE,
  locations: process.env.REACT_APP_LOCATION_SERVICE_URL || 'http://localhost:5003',
}

// 🔁 POST routes
export const createPost = async (postData) => {
  const res = await fetch(`${BASE_URL.posts}/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(postData),
  })
  return res.json()
}

export const createComment = async (commentData) => {
  const res = await fetch(`${BASE_URL.posts}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(commentData),
  })
  return res.json()
}

export const toggleLike = async (likeData) => {
  const res = await fetch(`${BASE_URL.posts}/likes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(likeData),
  })
  return res.json()
}

export const updateProfile = async (userId, profileData) => {
  const res = await fetch(`${BASE_URL.users}/users/${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profileData),
  })
  return res.json()
}

// 📥 GET routes
export const getAllPosts = async () => {
  const res = await fetch(`${BASE_URL.posts}/posts`)
  return res.json()
}

export const getUserById = async (userId) => {
  const res = await fetch(`${BASE_URL.users}/users/${userId}`)
  return res.json()
}

export const getCommentsForPost = async (postId) => {
  const res = await fetch(`${BASE_URL.posts}/comments/${postId}`)
  return res.json()
}

export const getLikesForPost = async (postId) => {
  const res = await fetch(`${BASE_URL.posts}/likes/${postId}`)
  return res.json()
}

export const getLocations = async () => {
  const res = await fetch(`${BASE_URL.locations}/locations`)
  return res.json()
}

export const getUserPosts = async (userId) => {
  const res = await fetch(`${BASE_URL.posts}/posts`)
  const allPosts = await res.json()
  return allPosts.filter((post) => post.author === userId)
}

export const fetchNotifications = async (token) => {
  const res = await fetch(`${NOTIF_SERVICE}/notifications`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return res.json()
}

export const createNotification = async (token, data) => {
  const res = await fetch(`${NOTIF_SERVICE}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  })
  return res.json()
}
