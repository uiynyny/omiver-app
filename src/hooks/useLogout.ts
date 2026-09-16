import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { clearCredentials } from '../context/credentialStore';
import { logout } from '../api/user';

/**
 * The single way to sign out.
 *
 * Previously three screens each implemented their own version, and they
 * disagreed: one forgot to call the API, another left the auth token behind,
 * and none of them cleared the profile encryption passphrase.
 */
export const useLogout = () => {
  const navigate = useNavigate();
  const { dispatch } = useAppContext();

  return useCallback(async () => {
    await logout();
    clearCredentials();
    dispatch({ type: 'CLEAR_AUTH' });
    navigate('/login', { replace: true });
  }, [dispatch, navigate]);
};
