import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPasswordScreen.css';
import { requestPasswordReset } from '../api/user';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!email) return setError('Please enter your email');
    setLoading(true);
    setError('');
    const ok = await requestPasswordReset(email.trim());
    setLoading(false);
    if (ok) {
      setSent(true);
    } else {
      setError('Failed to send reset email. Please check the address and try again.');
    }
  };

  return (
    <div className="forgot-root">
      <header className="forgot-header">
        <h1>Reset your password</h1>
      </header>

      <main className="forgot-main">
        {!sent ? (
          <div className="forgot-card">
            <p className="forgot-desc">Enter the email address for your account and we'll send you a link to reset your password.</p>
            <input className="forgot-input" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)} />
            {error && <div className="forgot-error">{error}</div>}
            <button className="forgot-btn" onClick={handleSubmit} disabled={loading}>{loading ? 'Sending...' : 'Send reset link'}</button>
            <button className="link-button" onClick={() => navigate('/login')}>Back to login</button>
          </div>
        ) : (
          <div className="forgot-card">
            <h2>Check your email</h2>
            <p className="forgot-desc">If an account with that email exists we'll send instructions to reset your password.</p>
            <button className="forgot-btn" onClick={() => navigate('/login')}>Return to login</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ForgotPasswordScreen;
