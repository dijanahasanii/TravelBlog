import React, { useState } from 'react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = e => {
    e.preventDefault();
    // Fake reset email sent
    alert(`Password reset link sent to ${email}`);
    setSent(true);
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 400, margin: 'auto', padding: 20 }}>
      <h2>Forgot Password</h2>
      {sent ? (
        <p>Check your email for a reset link.</p>
      ) : (
        <>
          <input
            type="email"
            placeholder="Your Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', marginBottom: 10, padding: 8 }}
          />
          <button type="submit" style={{ width: '100%', padding: 10 }}>Send Reset Link</button>
        </>
      )}
    </form>
  );
}
