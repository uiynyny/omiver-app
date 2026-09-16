import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getAuthToken, getPersistentLogin, verifyToken, clearAuthToken, clearPersistentLogin } from '../api/user';
import './SplashScreen.css';

const SplashScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [isChecking, setIsChecking] = useState(true);
  // `verifyToken` is a network round trip; guards against setting state or
  // navigating after the user has already left the screen.
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;

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
          if (!aliveRef.current) return;

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
      } catch {
        // A failed session check is not fatal and must not be logged — the
        // response can carry identity data. Fall through to the signed-out
        // state and let the user sign in manually.
        if (aliveRef.current) {
          clearAuthToken();
          clearPersistentLogin();
        }
      } finally {
        if (aliveRef.current) setIsChecking(false);
      }
    };

    checkAndRestoreSession();

    return () => {
      aliveRef.current = false;
    };
  }, [navigate, state.auth.isAuthenticated, state.auth.userType, dispatch]);

  return (
    <div className="splash">
      <div className="splash__inner">
        <div className="brand-logo splash__logo" role="img" aria-label="Omiver" />

        <div className="splash__copy">
          <h1 className="splash__title">Know what your blood is telling you.</h1>
          <p className="splash__sub">
            At-home biomarker testing, read by clinicians, turned into a plan you can actually follow.
          </p>
        </div>
      </div>

      <div className="splash__actions">
        {isChecking ? (
          <div className="splash__checking" role="status" aria-live="polite" aria-busy="true">
            <span className="spinner" aria-hidden="true" />
            <span className="text-secondary">Restoring your session…</span>
          </div>
        ) : (
          <>
            <button
              type="button"
              id="splash-get-started"
              className="btn btn--primary btn--block"
              onClick={() => navigate('/register')}
            >
              Get started
              <ArrowRight size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              id="splash-sign-in"
              className="btn btn--ghost btn--block"
              onClick={() => navigate('/login')}
            >
              I already have an account
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
