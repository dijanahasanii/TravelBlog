import React, { useState, useEffect } from 'react'
import EditProfile from '../components/EditProfile'
import axios from 'axios'
import '../styles.css'

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [error, setError] = useState('')

  // Merr email-in e user-it nga localStorage (ose vendos email statik për test)
  const userEmail = localStorage.getItem('email') || 'test@example.com'

  // Merr user-in nga backend kur komponenti ngarkohet
  useEffect(() => {
    if (!userEmail) return
    axios
      .get(`http://localhost:5001/api/user/${userEmail}`)
      .then((res) => setUser(res.data))
      .catch((err) => setError('Could not load user data'))
  }, [userEmail])

  // Funksioni që thirret kur klikojmë "Save" në EditProfile
  const handleSave = async (updatedUser) => {
    try {
      setError('')
      const res = await axios.put(
        `http://localhost:5001/api/user/${userEmail}`,
        updatedUser
      )
      setUser(res.data)
      alert('Profile saved successfully!')
    } catch (err) {
      console.error('Save failed:', err)
      setError('Failed to save profile. Please try again.')
    }
  }

  if (!user) return <p>Loading user data...</p>

  return (
    <div>
      <EditProfile currentUser={user} onSave={handleSave} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  )
}
