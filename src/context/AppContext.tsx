/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';

const STORAGE_KEY = 'omiver_app_state';

type RegistrationData = {
  token?: string;
  access_token?: string;
  user_id?: number;
  username?: string;
  email?: string;
  password?: string;
  accountType?: 'individual' | 'healthcare' | null;
  type?: 'PROVIDER' | 'INDIVIDUAL' | null;
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  ethnicity?: string;
  height?: number;
  weight?: number;
  healthConditions?: string;
  allergies?: string;
  dietary_recall?: string;
  exercise_recall?: string;
  dietary_typicality?: number;
  dietary_preference_mode?: string;
  preferred_cuisines?: string;
  avoided_cuisines?: string;
  weekly_exercise_routine?: string;
  exercise_days_per_week?: string;
  exercise_types?: string;
  provider_notes?: string;
  dietary_preferences?: string;
  fitness_goal?: string;
  nutritional_goal?: string;
  acceptedTerms?: boolean;
  // Referral system
  referralCode?: string;      // provider's code (populated after registration)
  referredByCode?: string;    // code from URL ?ref= param (passed by patient)
};

type AuthState = {
  isAuthenticated: boolean;
  userId?: string | number | null;
  clientId?: string | number | null;
  userType?: 'PROVIDER' | 'INDIVIDUAL' | null;
};

type AppState = {
  auth: AuthState;
  registration: RegistrationData;
};

const initialState: AppState = {
  auth: { isAuthenticated: false, userId: null, clientId: null, userType: null },
  registration: {},
};

// Load state from localStorage
const loadStateFromStorage = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
  }
  return initialState;
};

// Save state to localStorage
const saveStateToStorage = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

type Action =
  | { type: 'SET_AUTH'; payload: Partial<AuthState> }
  | { type: 'UPDATE_REGISTRATION'; payload: Partial<RegistrationData> }
  | { type: 'RESET_REGISTRATION' }
  | { type: 'CLEAR_AUTH' };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_AUTH':
      return { ...state, auth: { ...state.auth, ...action.payload } };
    case 'CLEAR_AUTH':
      return { ...state, auth: { isAuthenticated: false, userId: null, clientId: null, userType: null } };
    case 'UPDATE_REGISTRATION':
      return {
        ...state,
        registration: { ...state.registration, ...action.payload },
      };
    case 'RESET_REGISTRATION':
      return { ...state, registration: {} };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
}>({ state: initialState, dispatch: () => null });

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState, loadStateFromStorage);
  
  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);
  
  const value = React.useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);

export default AppContext;
