import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (!currentPassword || !newPassword) {
      setMessage('Please fill out all password fields');
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
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage(data.message || 'Failed to change password');
      }
    } catch (err) {
      setMessage('Network error. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto' }}>
      <h2>Change Password</h2>

      <form onSubmit={handlePasswordChange}>
        <label>
          Current Password:
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            required
            style={{ width: '100%', marginTop: 5, marginBottom: 10 }}
          />
        </label>

        <label>
          New Password:
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            required
            style={{ width: '100%', marginTop: 5, marginBottom: 10 }}
          />
        </label>

        <label>
          Confirm New Password:
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={{ width: '100%', marginTop: 5, marginBottom: 10 }}
          />
        </label>

        <button type="submit">Change Password</button>
      </form>

      {message && (
        <p style={{ marginTop: 15, color: message.includes('successfully') ? 'green' : 'red' }}>
          {message}
        </p>
      )}

      <button onClick={() => navigate("/profile")} style={{ marginTop: 20 }}>
        Back to Profile
      </button>
    </div>
  );
}
