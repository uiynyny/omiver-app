import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import './RegisterScreen.css';
import './ForgotPasswordScreen.css';
import { fetchSecurityQuestion, verifySecurityAnswer, resetPasswordWithToken } from '../api/user';

/** Narrows an unknown rejection to the loose error shape the API layer throws. */
const errMessage = (err: unknown, fallback: string): string => {
  const e = err as { message?: string; password?: string[] } | null;
  if (e?.password?.length) return e.password.join(' ');
  return e?.message || fallback;
};

const STEP_COUNT = 3;

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
    } catch (err: unknown) {
      setError(errMessage(err, 'Failed to retrieve security question. Please try again.'));
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
    } catch (err: unknown) {
      setError(errMessage(err, 'Incorrect answer. Please try again.'));
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
    } catch (err: unknown) {
      setError(errMessage(err, 'Failed to reset password. The link may have expired.'));
    } finally {
      setLoading(false);
    }
  };

  const errorBanner = error && (
    <div className="error-banner" role="alert">
      {error}
    </div>
  );

  return (
    <div className="auth">
      <div className="auth__inner fade-in">
        <header className="auth__head">
          <h1 className="auth__title">
            {step === 4 ? 'Password updated' : 'Reset your password'}
          </h1>
          {step < 4 && (
            <p className="auth__subtitle" aria-live="polite">
              Step {step} of {STEP_COUNT}
            </p>
          )}
        </header>

        {step < 4 && (
          <div className="progress forgot__progress">
            <div className="progress__fill" style={{ width: `${(step / STEP_COUNT) * 100}%` }} />
          </div>
        )}

        {step === 1 && (
          <form
            className="auth__form"
            onSubmit={(e) => { e.preventDefault(); handleVerifyEmail(); }}
          >
            <p className="auth__subtitle">
              Enter your email address to retrieve your security question.
            </p>
            {errorBanner}
            <div className="field">
              <label className="field__label" htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                className="input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                required
              />
            </div>
            <button type="submit" className="btn btn--primary btn--block" disabled={loading} aria-busy={loading}>
              {loading ? 'Verifying…' : 'Continue'}
            </button>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => navigate('/login')}>
              Back to sign in
            </button>
          </form>
        )}

        {step === 2 && (
          <form
            className="auth__form"
            onSubmit={(e) => { e.preventDefault(); handleVerifyAnswer(); }}
          >
            <div className="forgot__question">
              <span className="forgot__question-label">Security question</span>
              <p className="forgot__question-text">{securityQuestionDisplay}</p>
            </div>
            {errorBanner}
            <div className="field">
              <label className="field__label" htmlFor="forgot-answer">Your answer</label>
              <input
                id="forgot-answer"
                className="input"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                type="text"
                autoComplete="off"
                required
              />
            </div>
            <button type="submit" className="btn btn--primary btn--block" disabled={loading} aria-busy={loading}>
              {loading ? 'Verifying…' : 'Verify answer'}
            </button>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => { setError(''); setStep(1); }}>
              Back
            </button>
          </form>
        )}

        {step === 3 && (
          <form
            className="auth__form"
            onSubmit={(e) => { e.preventDefault(); handleResetPassword(); }}
          >
            <p className="auth__subtitle">Your answer is verified. Choose a new password.</p>
            {errorBanner}
            <div className="field">
              <label className="field__label" htmlFor="forgot-new-password">New password</label>
              <input
                id="forgot-new-password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                aria-describedby="forgot-password-help"
                required
              />
              <p className="auth__requirements" id="forgot-password-help">
                At least 8 characters.
              </p>
            </div>
            <div className="field">
              <label className="field__label" htmlFor="forgot-confirm-password">Confirm new password</label>
              <input
                id="forgot-confirm-password"
                className="input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                required
              />
            </div>
            <button type="submit" className="btn btn--primary btn--block" disabled={loading} aria-busy={loading}>
              {loading ? 'Resetting…' : 'Reset password'}
            </button>
            <button type="button" className="btn btn--ghost btn--block" onClick={() => { setError(''); setStep(2); }}>
              Back
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="auth__form forgot__success">
            <span className="forgot__success-icon" aria-hidden="true">
              <CheckCircle2 size={28} />
            </span>
            <p className="auth__subtitle">
              Your password has been reset. You can sign in with it now.
            </p>
            <button type="button" className="btn btn--primary btn--block" onClick={() => navigate('/login')}>
              Return to sign in
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordScreen;
