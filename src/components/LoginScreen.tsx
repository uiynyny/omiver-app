import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
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

  const handleLogin = () => {
    login(email, password).then((data) => {
      console.log('Login successful', data);
      const userType: 'PROVIDER' | 'INDIVIDUAL' = ((data.type as 'PROVIDER' | 'INDIVIDUAL') || (String(data.account_type || '').toUpperCase() === 'PROVIDER' ? 'PROVIDER' : 'INDIVIDUAL'));

      // Persist profile data so provider dashboard can show the name
      dispatch({
        type: 'UPDATE_REGISTRATION',
        payload: {...data},
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
    }).catch((error) => {
      console.error('Login error', error);
      alert('Login failed. Please check your credentials and try again.');
    });
  };

  const handleCreateAccount = () => {
    navigate('/register');
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="auth-screen">
      <div className="logo-container">
        <div className="logo-icon">
          <img src={omiverIcon} alt="Omiver Icon" width={60} height={60} />
        </div>
      </div>

      <h1 className="auth-title">Welcome Back</h1>

      <div className="form-container">
        <div className="input-group">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
        </div>

        <button onClick={handleLogin} className="primary-button">
          Login <ChevronRight size={20} />
        </button>

        <div className="login-options">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={stayLoggedIn}
              onChange={(e) => setStayLoggedIn(e.target.checked)}
            />
            <span>Stay logged in</span>
          </label>
          <button onClick={handleForgotPassword} className="link-button">
            Forgot Password?
          </button>
        </div>

        <div className="divider">
          <span>OR</span>
        </div>

        <button onClick={handleCreateAccount} className="secondary-button">
          Create account <ChevronRight size={20} />
        </button>
      </div>

      <p className="terms-text">
        By creating an account, you agree to our{' '}
        <a href="/terms?mode=readonly">Terms of Service and Privacy Policy</a>
      </p>
    </div>
  );
};

export default LoginScreen;
