import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ForgotPasswordScreen.css';
import { fetchSecurityQuestion, verifySecurityAnswer, resetPasswordWithToken } from '../api/user';

const ForgotPasswordScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 1: Email, 2: Security Q&A, 3: New Password, 4: Success
  const [securityQuestionCode, setSecurityQuestionCode] = useState('');
  const [securityQuestionDisplay, setSecurityQuestionDisplay] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleVerifyEmail = async () => {
    if (!email.trim()) return setError('Please enter your email');
    setLoading(true);
    setError('');
    try {
      const res = await fetchSecurityQuestion(email.trim());
      setSecurityQuestionCode(res.security_question);
      setSecurityQuestionDisplay(res.security_question_display);
      setStep(2);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve security question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAnswer = async () => {
    if (!securityAnswer.trim()) return setError('Please enter your security answer');
    setLoading(true);
    setError('');
    try {
      const res = await verifySecurityAnswer(
        email.trim(),
        securityQuestionCode,
        securityAnswer.trim()
      );
      setResetToken(res.token);
      setStep(3);
    } catch (err: any) {
      setError(err?.message || 'Incorrect answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      return setError('Please fill out all fields.');
    }
    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match.');
    }

    setLoading(true);
    setError('');
    try {
      await resetPasswordWithToken(resetToken, newPassword);
      setStep(4);
    } catch (err: any) {
      if (err?.password) {
        setError(err.password.join(' '));
      } else {
        setError(err?.message || 'Failed to reset password. The link may have expired.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-root">
      <header className="forgot-header">
        <h1>Reset your password</h1>
      </header>

      <main className="forgot-main">
        {step === 1 && (
          <div className="forgot-card">
            <p className="forgot-desc">Enter your email address to retrieve your security question.</p>
            <input 
              className="forgot-input" 
              placeholder="your@email.com" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              type="email"
            />
            {error && <div className="forgot-error">{error}</div>}
            <button className="forgot-btn" onClick={handleVerifyEmail} disabled={loading}>
              {loading ? 'Verifying...' : 'Next'}
            </button>
            <button className="link-button" onClick={() => navigate('/login')}>Back to login</button>
          </div>
        )}

        {step === 2 && (
          <div className="forgot-card">
            <p className="forgot-question-label">Security Question:</p>
            <p className="forgot-question-text">{securityQuestionDisplay}</p>
            
            <input 
              className="forgot-input" 
              placeholder="Security Answer" 
              value={securityAnswer} 
              onChange={e => setSecurityAnswer(e.target.value)} 
              type="text"
              autoComplete="off"
            />

            {error && <div className="forgot-error">{error}</div>}
            
            <button className="forgot-btn" onClick={handleVerifyAnswer} disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Answer'}
            </button>
            <button className="link-button" onClick={() => setStep(1)}>Back</button>
          </div>
        )}

        {step === 3 && (
          <div className="forgot-card">
            <p className="forgot-desc">Your answer is verified. Enter your new password below.</p>

            <input 
              className="forgot-input" 
              placeholder="New Password" 
              value={newPassword} 
              onChange={e => setNewPassword(e.target.value)} 
              type="password"
            />

            <input 
              className="forgot-input" 
              placeholder="Confirm New Password" 
              value={confirmPassword} 
              onChange={e => setConfirmPassword(e.target.value)} 
              type="password"
            />

            {error && <div className="forgot-error">{error}</div>}
            
            <button className="forgot-btn" onClick={handleResetPassword} disabled={loading}>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
            <button className="link-button" onClick={() => setStep(2)}>Back</button>
          </div>
        )}

        {step === 4 && (
          <div className="forgot-card">
            <h2>Success!</h2>
            <p className="forgot-desc">Your password has been successfully reset.</p>
            <button className="forgot-btn" onClick={() => navigate('/login')}>Return to login</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default ForgotPasswordScreen;
