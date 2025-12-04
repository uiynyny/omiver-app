import React, { createContext, useContext, useReducer, type ReactNode } from 'react';

type PersonalInfo = {
  firstName?: string;
  lastName?: string;
  birthday?: string;
  biologicalSex?: string;
  ethnicity?: string;
  height?: string;
  weight?: string;
};

type RegistrationData = {
  email?: string;
  password?: string;
  accountType?: 'individual' | 'healthcare' | null;
  personalInfo?: PersonalInfo;
  healthConditions?: string;
  dietary?: { allergies?: string; preferences?: string };
  goals?: { nutritionGoals?: string; fitnessGoals?: string };
  acceptedTerms?: boolean;
};

type AuthState = {
  isAuthenticated: boolean;
  userId?: string | null;
};

type AppState = {
  auth: AuthState;
  registration: RegistrationData;
};

const initialState: AppState = {
  auth: { isAuthenticated: false, userId: null },
  registration: {},
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
      return { ...state, auth: { isAuthenticated: false, userId: null } };
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
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = React.useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);

export default AppContext;
