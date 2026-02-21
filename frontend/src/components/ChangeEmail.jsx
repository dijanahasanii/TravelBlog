import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChangeEmail() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (!email.includes('@')) {
      setMessage('Please enter a valid email');
      return;
    }

    const userId = localStorage.getItem("currentUserId");
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5004/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Email updated successfully');
        setEmail('');
      } else {
        setMessage(data.message || 'Failed to update email');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto' }}>
      <h2>Change Email</h2>

      <form onSubmit={handleEmailSubmit}>
        <label>
          New Email:
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="New email"
            required
            style={{ width: '100%', marginTop: 5, marginBottom: 10 }}
          />
        </label>
        <button type="submit">Update Email</button>
      </form>

      {message && <p style={{ marginTop: 15, color: 'green' }}>{message}</p>}

      <button onClick={() => navigate("/profile")} style={{ marginTop: 20 }}>
        Back to Profile
      </button>
    </div>
  );
}
