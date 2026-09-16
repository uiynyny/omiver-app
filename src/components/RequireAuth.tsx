import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { verifyToken, getAuthToken, logout } from '../api/user';

type Props = {
  children: React.ReactNode;
  /** Restrict the route to one account type. Omit to allow any signed-in user. */
  role?: 'PROVIDER' | 'INDIVIDUAL';
};

type Status = 'checking' | 'allowed' | 'denied';

/**
 * Gate for authenticated routes.
 *
 * This replaces the previous `AuthValidator`, which rendered `null`, only ran
 * when the client already claimed to be authenticated, and swallowed
 * verification errors — so a network blip kept a session alive and protected
 * screens mounted (and fetched PHI) before any check resolved.
 *
 * Here the check is fail-closed and blocking: nothing renders until the server
 * confirms the session.
 *
 * Note that the role check is a UX affordance only. `state.auth.userType` comes
 * from localStorage and is trivially editable, so the server must enforce
 * authorisation on every request regardless of what this component decides.
 */
const RequireAuth: React.FC<Props> = ({ children, role }) => {
  const { state, dispatch } = useAppContext();
  const location = useLocation();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      if (!getAuthToken()) {
        if (!cancelled) setStatus('denied');
        return;
      }

      try {
        const valid = await verifyToken();
        if (cancelled) return;

        if (valid) {
          setStatus('allowed');
        } else {
          await logout();
          if (cancelled) return;
          dispatch({ type: 'CLEAR_AUTH' });
          setStatus('denied');
        }
      } catch {
        // Fail closed: an unverifiable session is treated as no session.
        if (!cancelled) setStatus('denied');
      }
    };

    void check();
    return () => {
      cancelled = true;
    };
  }, [dispatch, location.pathname]);

  if (status === 'checking') {
    return (
      <div className="screen" aria-busy="true">
        <div className="container route-guard">
          <span className="spinner" aria-hidden="true" />
          <span className="sr-only">Checking your session</span>
        </div>
      </div>
    );
  }

  if (status === 'denied') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (role && state.auth.userType && state.auth.userType !== role) {
    return <Navigate to={state.auth.userType === 'PROVIDER' ? '/provider/dashboard' : '/home'} replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
