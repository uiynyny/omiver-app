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
  const { dispatch } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [matchError, setMatchError] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');

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
    if (!email.trim() || !password || !confirmPassword || !securityQuestion || !securityAnswer.trim()) {
      alert('Please fill out all fields.');
      return;
    }
    if (passwordError || matchError) {
      alert('Please fix password errors before registering.');
      return;
    }

    const res = await emailExist(email)
    if (res) {
      alert('Email already exists');
      return;
    }
    
    const params = new URLSearchParams(location.search);
    const refCode = params.get('ref');

    if (refCode) {
      // Skip account type selection and default to individual user with referral
      dispatch({ 
        type: 'UPDATE_REGISTRATION', 
        payload: { 
          email, 
          password, 
          username: email, 
          accountType: 'individual', 
          referredByCode: refCode,
          security_question: securityQuestion,
          security_answer: securityAnswer
        } 
      });
      navigate('/register/personal-info');
    } else {
      // Save email/password to registration context then ask for account type
      dispatch({ 
        type: 'UPDATE_REGISTRATION', 
        payload: { 
          email, 
          password, 
          username: email,
          security_question: securityQuestion,
          security_answer: securityAnswer
        } 
      });
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
        {(passwordError || matchError) && (
          <div className="form-error-panel" style={{
            background: '#fff5f5',
            border: '1px solid #fed7d7',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            color: '#c53030',
            fontSize: '0.85rem',
            lineHeight: '1.4'
          }}>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              {passwordError && <li>{passwordError}</li>}
              {matchError && <li>{matchError}</li>}
            </ul>
          </div>
        )}

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

        <p className="terms-text" style={{ textAlign: 'left', marginTop: '0.2rem', marginBottom: '1.2rem' }}>
          Passwords must be at least 8 characters and should not be common, numeric-only, or similar to your email or username.
        </p>

        <h3 className="auth-section-title">Security Question</h3>

        <div className="input-group">
          <select
            value={securityQuestion}
            onChange={(e) => setSecurityQuestion(e.target.value)}
            className="auth-input auth-select-outline"
            style={{ 
              appearance: 'none', 
              cursor: 'pointer',
              color: securityQuestion ? '#000' : '#757575'
            }}
          >
            <option value="" style={{ color: '#757575' }}>Select Security Question...</option>
            <option value="PET" style={{ color: '#000' }}>What was the name of your first pet?</option>
            <option value="MOTHER" style={{ color: '#000' }}>What is your mother's maiden name?</option>
            <option value="CITY" style={{ color: '#000' }}>In what city were you born?</option>
            <option value="SCHOOL" style={{ color: '#000' }}>What was the name of your first school?</option>
            <option value="CAR" style={{ color: '#000' }}>What was the make of your first car?</option>
          </select>
        </div>

        <div className="input-group">
          <input
            type="text"
            placeholder="Security Answer:"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
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
        <a href="/terms?mode=readonly">Terms of Service and Privacy Policy</a>
      </p>
    </div>
  );
};

export default RegisterScreen;

