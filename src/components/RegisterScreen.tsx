import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import './RegisterScreen.css';
import omiverIcon from '../assets/omiver-icon.svg';
import { useAppContext } from '../context/AppContext';

const RegisterScreen = () => {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = () => {
    // Validate passwords match
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    // Save email/password to registration context then continue
    dispatch({ type: 'UPDATE_REGISTRATION', payload: { email, password } });
    navigate('/register/account-type');
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

