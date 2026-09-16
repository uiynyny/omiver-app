/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';

const STORAGE_KEY = 'omiver_app_state';

export type RegistrationData = {
  user_id?: number;
  username?: string;
  email?: string;
  accountType?: 'individual' | 'healthcare' | null;
  type?: 'PROVIDER' | 'INDIVIDUAL' | null;
  first_name?: string;
  last_name?: string;
  use_custom_key?: boolean;
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
  // Card metadata returned by the server for display only. The raw PAN is
  // never collected or stored by this app — see PaymentScreen (Stripe Elements).
  cardholder_name?: string;
  card_brand?: string;
  card_last_four?: string;
  expiry_month?: number;
  expiry_year?: number;
  billing_street?: string;
  billing_city?: string;
  billing_state?: string;
  billing_zip?: string;
  billing_country?: string;
  // Shipping Address on profile fields
  shipping_street?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  // Referral system
  referralCode?: string;      // provider's code (populated after registration)
  referredByCode?: string;    // code from URL ?ref= param (passed by patient)
  security_question?: string;
};

/**
 * Credentials and answers that must never leave component-local state.
 *
 * These are deliberately absent from `RegistrationData` so that TypeScript
 * prevents them being dispatched into the reducer at all. Registration and
 * password-recovery screens hold them in `useState` and pass them straight
 * to the API.
 */

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

/**
 * Allow-list of registration fields that may be written to localStorage.
 *
 * Everything omitted here — names, date of birth, health conditions,
 * allergies, biometrics, addresses and card metadata — is PHI/PII and is
 * held in memory only, then re-hydrated from the API on load (see
 * `SessionHydrator`). This keeps the browser's persistent storage free of
 * protected health information, so an XSS or a shared device cannot yield
 * a patient record.
 */
const PERSISTED_REGISTRATION_FIELDS = [
  'accountType',
  'type',
  'acceptedTerms',
  'referralCode',
  'referredByCode',
] as const satisfies readonly (keyof RegistrationData)[];

const pickPersistable = (registration: RegistrationData): Partial<RegistrationData> => {
  const out: Partial<RegistrationData> = {};
  for (const key of PERSISTED_REGISTRATION_FIELDS) {
    const value = registration[key];
    if (value !== undefined) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
};

/**
 * Shape-check whatever we read back out of localStorage.
 *
 * The stored blob is attacker-writable, so it is treated as untrusted input:
 * anything unexpected is discarded rather than spread into app state. Note
 * that `clientId` and `userType` are still only hints for rendering — the
 * server re-derives identity and role on every request.
 */
const parseStoredState = (raw: string): AppState => {
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) return initialState;

  const candidate = parsed as Partial<AppState>;
  const auth = candidate.auth;
  if (typeof auth !== 'object' || auth === null) return initialState;

  const userType = auth.userType === 'PROVIDER' || auth.userType === 'INDIVIDUAL' ? auth.userType : null;

  return {
    auth: {
      isAuthenticated: auth.isAuthenticated === true,
      userId: typeof auth.userId === 'string' || typeof auth.userId === 'number' ? auth.userId : null,
      clientId: typeof auth.clientId === 'string' || typeof auth.clientId === 'number' ? auth.clientId : null,
      userType,
    },
    registration: pickPersistable((candidate.registration ?? {}) as RegistrationData),
  };
};

const loadStateFromStorage = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return parseStoredState(stored);
  } catch {
    // Corrupt or tampered payload — fall back to a clean session.
    localStorage.removeItem(STORAGE_KEY);
  }
  return initialState;
};

const saveStateToStorage = (state: AppState) => {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        auth: state.auth,
        registration: pickPersistable(state.registration),
      }),
    );
  } catch {
    // Storage full or blocked (private mode) — the app still works in memory.
  }
};

export const clearPersistedState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* no-op */
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
      return initialState;
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

  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  const value = React.useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);

export default AppContext;
