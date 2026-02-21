import React from 'react';
import { Link } from 'react-router-dom';

function AuthPage() {
  return (
    <div style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>Welcome to Travel Blog</h1>
      <div style={{ marginTop: '30px' }}>
        <Link to="/signup">
          <button style={{ margin: '10px', padding: '10px 20px' }}>Sign Up</button>
        </Link>
        <Link to="/signin">
          <button style={{ margin: '10px', padding: '10px 20px' }}>Sign In</button>
        </Link>
      </div>
    </div>
  );
}

export default AuthPage;