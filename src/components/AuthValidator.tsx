import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { verifyToken, clearAuthToken, clearPersistentLogin } from '../api/user';

const AuthValidator: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const isChecking = useRef(false);

  useEffect(() => {
    const isPublicPage = ['/login', '/register', '/register/account-type', '/terms', '/forgot-password'].includes(location.pathname) || location.pathname === '/';

    const checkAuthStatus = async () => {
      // Only check if user is marked as authenticated in the context
      if (!state.auth.isAuthenticated) return;
      if (isChecking.current) return;

      isChecking.current = true;
      try {
        const isValid = await verifyToken();
        if (!isValid) {
          console.warn('Session expired or unauthorized. Logging out.');
          clearAuthToken();
          clearPersistentLogin();
          dispatch({ type: 'CLEAR_AUTH' });
          navigate('/login');
        }
      } catch (err) {
        console.error('Error verifying token:', err);
      } finally {
        isChecking.current = false;
      }
    };

    // Run on initial mount
    if (!isPublicPage) {
      checkAuthStatus();
    }

    // Run on window focus or visibility change
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && !isPublicPage) {
        checkAuthStatus();
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [state.auth.isAuthenticated, location.pathname, dispatch, navigate]);

  return null;
};

export default AuthValidator;
