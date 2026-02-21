import React, { useState } from 'react';
import '../styles.css';


export default function AccountSettings({ user, onUpdate }) {
  const [email, setEmail] = useState(user.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleEmailChange = (e) => setEmail(e.target.value);

  const handlePasswordChange = (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    if (!currentPassword || !newPassword) {
      setMessage('Please fill out all password fields');
      return;
    }

    // Simulate password update process here...
    setMessage('Password changed successfully (simulation)');
    
    // Clear password fields after "change"
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();

    // Simple email validation
    if (!email.includes('@')) {
      setMessage('Please enter a valid email');
      return;
    }

    // Simulate email update (e.g., update parent state)
    onUpdate({ ...user, email });
    setMessage('Email updated successfully');
  };

  return (
    <div style={{ maxWidth: 400, margin: 'auto' }}>
      <h2>Account Settings</h2>

      <form onSubmit={handleEmailSubmit} style={{ marginBottom: '20px' }}>
        <label>
          Change Email:
          <input 
            type="email" 
            value={email} 
            onChange={handleEmailChange} 
            placeholder="New email"
            required 
            style={{ width: '100%', marginTop: 5, marginBottom: 10 }}
          />
        </label>
        <button type="submit">Update Email</button>
      </form>

      <form onSubmit={handlePasswordChange}>
        <label>
          Current Password:
          <input
            type="password"
            value={currentPassword}
            onChange={e => setCurrentPassword(e.target.value)}
            placeholder="Current password"
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
            placeholder="New password"
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
            placeholder="Confirm new password"
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
    </div>
  );
}
