
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { getAuthToken } from '../api/user';
import './SplashScreen.css';
import omiverLogo from '../assets/omiver.svg';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();

  useEffect(() => {
    // Check if user is already authenticated
    const token = getAuthToken();
    if (token && state.auth.isAuthenticated) {
      // Redirect to appropriate home screen based on user type
      if (state.auth.userType === 'PROVIDER') {
        navigate('/provider/dashboard');
      } else if (state.auth.userType === 'INDIVIDUAL') {
        navigate('/home');
      }
    }
  }, [navigate, state.auth.isAuthenticated, state.auth.userType]);

  const handleNext = () => {
    navigate('/login');
  };

  return (
    <div className={`welcome-screen splash`} onClick={handleNext} style={{ cursor: 'pointer' }}>
      <img src={omiverLogo} alt="Omiver Logo" className="omiver-logo" />
    </div> 
  );
};

export default SplashScreen;
