import React, { useEffect, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { USER_SERVICE, CONTENT_SERVICE } from '../constants/api'
import api from '../utils/api'

export default function UserProfile({ userId, onBack }) {
  const [user, setUser] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserAndPosts = async () => {
      try {
        const [userRes, postsRes] = await Promise.all([
          api.get(`${USER_SERVICE}/users/${userId}`),
          api.get(`${CONTENT_SERVICE}/posts/user/${userId}`),
        ])
        setUser(userRes?.data ?? null)
        setUserPosts(Array.isArray(postsRes?.data) ? postsRes.data : [])
      } catch (err) {
        setUser(null)
        setUserPosts([])
      } finally {
        setLoading(false)
      }
    }
    fetchUserAndPosts()
  }, [userId])

  if (loading) return <p>Loading...</p>
  if (!user) return <div>User not found</div>

  return (
    <div>
      <button onClick={onBack}>Back to Feed</button>
      <h2>{user.username || user.fullName}</h2>
      <p>{user.bio || 'No bio provided.'}</p>
      <p>Location: {user.location || 'Unknown'}</p>

      <h3>Posts by {user.username || user.fullName}</h3>
      {userPosts.length === 0 && <p>No posts to show</p>}
      {userPosts.map((post) => (
        <div
          key={post._id}
          style={{ border: '1px solid #ccc', margin: 10, padding: 10 }}
        >
          <img src={post.image} alt={post.caption} style={{ width: '100%' }} />
          <div>{post.caption}</div>
          <div style={{ fontSize: '0.8em', color: 'gray' }}>
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
          </div>
        </div>
      ))}
    </div>
  )
}
