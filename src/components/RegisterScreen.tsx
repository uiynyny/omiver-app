import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './RegisterScreen.css';
import omiverIcon from '../assets/omiver-icon.svg';
import { useAppContext } from '../context/AppContext';
import { setCredentials } from '../context/credentialStore';
import { emailExist } from '../api/user';

/** The five security questions the backend accepts. */
const SECURITY_QUESTIONS = [
  { value: 'PET', label: 'What was the name of your first pet?' },
  { value: 'MOTHER', label: "What is your mother's maiden name?" },
  { value: 'CITY', label: 'In what city were you born?' },
  { value: 'SCHOOL', label: 'What was the name of your first school?' },
  { value: 'CAR', label: 'What was the make of your first car?' },
];

const RegisterScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [matchError, setMatchError] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Read referral code from URL (?ref=CODE) and persist in context
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      dispatch({ type: 'UPDATE_REGISTRATION', payload: { referredByCode: ref } });
    }
  }, [location.search, dispatch]);

  // Real-time password criteria validation
  useEffect(() => {
    if (!password) {
      setPasswordError('');
      return;
    }

    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
    } else if (/^\d+$/.test(password)) {
      setPasswordError('Password cannot be numeric-only.');
    } else if (email && password.toLowerCase() === email.toLowerCase().split('@')[0]) {
      setPasswordError('Password cannot be similar to your email name.');
    } else if (email && email.toLowerCase().includes(password.toLowerCase()) && password.length >= 4) {
      setPasswordError('Password cannot be part of your email.');
    } else {
      setPasswordError('');
    }
  }, [password, email]);

  // Real-time password match validation
  useEffect(() => {
    if (!confirmPassword) {
      setMatchError('');
      return;
    }

    if (password !== confirmPassword) {
      setMatchError('Passwords do not match.');
    } else {
      setMatchError('');
    }
  }, [password, confirmPassword]);

  const handleRegister = async () => {
    setFormError('');

    if (!email.trim() || !password || !confirmPassword || !securityQuestion || !securityAnswer.trim()) {
      setFormError('Please fill out all fields.');
      return;
    }
    if (passwordError || matchError) {
      setFormError('Please fix the password problems above before continuing.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await emailExist(email);
      if (res) {
        setFormError('An account with that email already exists. Try signing in instead.');
        return;
      }

      const params = new URLSearchParams(location.search);
      const refCode = params.get('ref');

      // Secrets are held in memory only, never in the persisted reducer.
      setCredentials({ password, securityAnswer });

      if (refCode) {
        // Skip account type selection and default to individual user with referral
        dispatch({
          type: 'UPDATE_REGISTRATION',
          payload: {
            email,
            username: email,
            accountType: 'individual',
            referredByCode: refCode,
            security_question: securityQuestion,
          }
        });
        navigate('/register/personal-info');
      } else {
        // Save email to registration context then ask for account type
        dispatch({
          type: 'UPDATE_REGISTRATION',
          payload: {
            email,
            username: email,
            security_question: securityQuestion,
          }
        });
        navigate('/register/account-type');
      }
    } catch {
      setFormError('We could not reach the server. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="auth">
      <div className="auth__inner fade-in">
        <img className="auth__mark" src={omiverIcon} alt="Omiver" width={52} height={52} />

        <header className="auth__head">
          <h1 className="auth__title">Create your account</h1>
          <p className="auth__subtitle">A few details and your first kit is on its way.</p>
        </header>

        <form
          className="auth__form"
          onSubmit={(e) => {
            e.preventDefault();
            handleRegister();
          }}
        >
          {formError && (
            <div className="error-banner" role="alert">
              {formError}
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="register-email">
              Email
            </label>
            <input
              id="register-email"
              className="input"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="register-password">
              Password
            </label>
            <input
              id="register-password"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!passwordError}
              aria-describedby="register-password-help"
              required
            />
            <p className="auth__requirements" id="register-password-help">
              At least 8 characters. Not numeric-only, and not similar to your email.
            </p>
            {passwordError && (
              <p className="field__error" role="alert">{passwordError}</p>
            )}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="register-confirm">
              Confirm password
            </label>
            <input
              id="register-confirm"
              className="input"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              aria-invalid={!!matchError}
              required
            />
            {matchError && (
              <p className="field__error" role="alert">{matchError}</p>
            )}
          </div>

          <div className="field">
            <label className="field__label" htmlFor="register-security-question">
              Security question
            </label>
            <select
              id="register-security-question"
              className="select"
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              required
            >
              <option value="">Choose a question…</option>
              {SECURITY_QUESTIONS.map((q) => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="register-security-answer">
              Your answer
            </label>
            <input
              id="register-security-answer"
              className="input"
              type="text"
              autoComplete="off"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Creating account
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <div className="auth__sep">
          <span>or</span>
        </div>

        <button type="button" className="btn btn--secondary btn--block" onClick={handleLoginRedirect}>
          I already have an account
        </button>

        <p className="auth__terms">
          By creating an account, you agree to our{' '}
          <a href="/terms?mode=readonly">Terms of Service and Privacy Policy</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterScreen;
