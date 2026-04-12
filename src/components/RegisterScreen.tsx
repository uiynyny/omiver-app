import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './RegisterScreen.css';
import omiverIcon from '../assets/omiver-icon.svg';
import { useAppContext } from '../context/AppContext';
import { emailExist } from '../api/user';

const RegisterScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Read referral code from URL (?ref=CODE) and persist in context
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ref = params.get('ref');
    if (ref) {
      dispatch({ type: 'UPDATE_REGISTRATION', payload: { referredByCode: ref } });
    }
  }, [location.search, dispatch]);

  const handleRegister = async () => {
    // Validate passwords match
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    const res = await emailExist(email)
    if (res) {
      alert('Email already exists');
      return;
    }
    
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref') || state.registration.referredByCode;

    if (refCode) {
      // Skip account type selection and default to individual user with referral
      dispatch({ 
        type: 'UPDATE_REGISTRATION', 
        payload: { email, password, username: email, accountType: 'individual', referredByCode: refCode } 
      });
      navigate('/register/personal-info');
    } else {
      // Save email/password to registration context then ask for account type
      dispatch({ type: 'UPDATE_REGISTRATION', payload: { email, password, username: email } });
      navigate('/register/account-type');
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="auth-screen">
      <div className="logo-container">
        <div className="logo-icon">
          <img src={omiverIcon} alt="Omiver Icon" />
        </div>
      </div>

      <h1 className="auth-title">Create Account</h1>

      <div className="form-container">
        <div className="input-group">
          <input
            type="email"
            placeholder="Email:"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="auth-input"
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Password:"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="auth-input"
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Confirm Password:"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="auth-input"
          />
        </div>

        <button onClick={handleRegister} className="primary-button">
          Register <ChevronRight size={20} />
        </button>

        <div className="divider">
          <span>OR</span>
        </div>

        <button onClick={handleLoginRedirect} className="secondary-button">
          Login here <ChevronRight size={20} />
        </button>
      </div>

      <p className="terms-text">
        By creating an account, you agree to our{' '}
        <a href="/terms">Terms of Service and Privacy Policy</a>
      </p>
    </div>
  );
};

export default RegisterScreen;

