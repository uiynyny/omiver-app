
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getAuthToken, getPersistentLogin, verifyToken, clearAuthToken, clearPersistentLogin } from '../api/user';
import './SplashScreen.css';
import omiverLogo from '../assets/omiver.svg';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAndRestoreSession = async () => {
      try {
        // First check if user is already authenticated in current session
        const token = getAuthToken();
        if (token && state.auth.isAuthenticated) {
          // User is already authenticated in this session
          if (state.auth.userType === 'PROVIDER') {
            navigate('/provider/dashboard');
          } else if (state.auth.userType === 'INDIVIDUAL') {
            navigate('/home');
          }
          return;
        }

        // Check for persistent login (user checked "stay logged in" previously)
        const persistentLogin = getPersistentLogin();
        if (persistentLogin && token) {
          // Verify the token is still valid with the API
          const isTokenValid = await verifyToken();
          
          if (isTokenValid) {
            // Token is valid, restore the session
            dispatch({
              type: 'SET_AUTH',
              payload: {
                isAuthenticated: true,
                userId: persistentLogin.userId,
                clientId: persistentLogin.clientId,
                userType: persistentLogin.userType,
              },
            });
            
            // Redirect to appropriate screen
            if (persistentLogin.userType === 'PROVIDER') {
              navigate('/provider/dashboard');
            } else {
              navigate('/home');
            }
            return;
          } else {
            // Token is invalid, clear persistent login
            clearAuthToken();
            clearPersistentLogin();
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAndRestoreSession();
  }, [navigate, state.auth.isAuthenticated, state.auth.userType, dispatch]);

  const handleNext = () => {
    if (!isChecking) {
      navigate('/login');
    }
  };

  return (
    <div className={`welcome-screen splash`} onClick={handleNext} style={{ cursor: isChecking ? 'default' : 'pointer' }}>
      <img src={omiverLogo} alt="Omiver Logo" className="omiver-logo" />
      {isChecking && <p style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>Loading...</p>}
    </div> 
  );
};

export default SplashScreen;
