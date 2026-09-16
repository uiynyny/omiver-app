import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './RegisterScreen.css';

import omiverIcon from '../assets/omiver-icon.svg';
import { useAppContext } from '../context/AppContext';
import { login, setPersistentLogin } from '../api/user';

const LoginScreen = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const { dispatch } = useAppContext();

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = () => {
    setError('');
    setSubmitting(true);
    login(email, password).then((data) => {
      const userType: 'PROVIDER' | 'INDIVIDUAL' = ((data.type as 'PROVIDER' | 'INDIVIDUAL') || (String(data.account_type || '').toUpperCase() === 'PROVIDER' ? 'PROVIDER' : 'INDIVIDUAL'));

      // The token is handled by the API layer; keep it out of app state so it
      // is never serialized alongside the profile.
      const { token: _token, access_token: _accessToken, ...profile } = data;

      dispatch({
        type: 'UPDATE_REGISTRATION',
        payload: {
          ...profile,
          healthConditions: data.health_conditions || '',
        },
      });
      dispatch({
        type: 'SET_AUTH',
        payload: { isAuthenticated: true, userId: email, clientId: data.id || data.user_id, userType },
      });

      // Store login info if user checked "stay logged in"
      if (stayLoggedIn) {
        setPersistentLogin({
          userId: email,
          userType,
          clientId: data.id || data.user_id,
          email,
        });
      } else {
        setPersistentLogin(null);
      }

      if (userType === 'PROVIDER') {
        navigate('/provider/dashboard');
      } else {
        navigate('/home');
      }
    }).catch(() => {
      setSubmitting(false);
      setError('We could not sign you in. Check your email and password and try again.');
    });
  };

  const handleCreateAccount = () => {
    navigate('/register');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="auth">
      <div className="auth__inner fade-in">
        <img className="auth__mark" src={omiverIcon} alt="Omiver" width={52} height={52} />

        <header className="auth__head">
          <h1 className="auth__title">Welcome back</h1>
          <p className="auth__subtitle">Sign in to view your biomarker results.</p>
        </header>

        <form
          className="auth__form"
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
        >
          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <div className="field">
            <label className="field__label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
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
            <label className="field__label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              className="input"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="auth__options">
            <label className="auth__check">
              <input
                type="checkbox"
                checked={stayLoggedIn}
                onChange={(e) => setStayLoggedIn(e.target.checked)}
              />
              <span>Stay signed in</span>
            </label>
            <button type="button" className="auth__link" onClick={handleForgotPassword}>
              Forgot password?
            </button>
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={submitting} aria-busy={submitting}>
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Signing in
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="auth__sep">
          <span>or</span>
        </div>

        <button type="button" className="btn btn--secondary btn--block" onClick={handleCreateAccount}>
          Create an account
        </button>

        <p className="auth__terms">
          By continuing you agree to our <a href="/terms?mode=readonly">Terms and Privacy Policy</a>.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
