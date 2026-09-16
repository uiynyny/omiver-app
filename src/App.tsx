import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

// Eager: these are on the cold-start path, so code-splitting them would only
// add a round trip before the very first paint.
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import RequireAuth from './components/RequireAuth';

// Lazy: everything else is reached by navigation, so it can stream in on
// demand. This is what keeps the initial bundle from being one ~460 KB chunk.
const RegisterScreen = lazy(() => import('./components/RegisterScreen'));
const AccountTypeScreen = lazy(() => import('./components/AccountTypeScreen'));
const ForgotPasswordScreen = lazy(() => import('./components/ForgotPasswordScreen'));
const TermsScreen = lazy(() => import('./components/TermsScreen'));

const PersonalInfoScreen = lazy(() => import('./components/PersonalInfoScreen'));
const HealthConditionsScreen = lazy(() => import('./components/HealthConditionsScreen'));
const GoalsScreen = lazy(() => import('./components/GoalsScreen'));
const DietaryQuestionnaireScreen = lazy(() => import('./components/DietaryQuestionnaireScreen'));
const ProviderInfoScreen = lazy(() => import('./components/ProviderInfoScreen'));

const HomeScreen = lazy(() => import('./components/HomeScreen'));
const KitsScreen = lazy(() => import('./components/KitsScreen'));
const ScanKitScreen = lazy(() => import('./components/ScanKitScreen'));
const CollectionStepsScreen = lazy(() => import('./components/CollectionStepsScreen'));
const PaymentScreen = lazy(() => import('./components/PaymentScreen'));
const OrderScreen = lazy(() => import('./components/OrderScreen'));
const RecommendationsScreen = lazy(() => import('./components/RecommendationsScreen'));
const ProfileScreen = lazy(() => import('./components/ProfileScreen'));
const ProfileSettingsScreen = lazy(() => import('./components/ProfileSettingsScreen'));
const ProfileEditScreen = lazy(() => import('./components/ProfileEditScreen'));

const ProviderDashboardScreen = lazy(() => import('./components/ProviderDashboardScreen'));
const PatientDetailScreen = lazy(() => import('./components/PatientDetailScreen'));

import './App.css';

const baseRoute = import.meta.env.VITE_WEB ? '/app' : '/';

/** Shown while a lazily-loaded route chunk is in flight. */
function RouteFallback() {
  return (
    <div className="route-guard" role="status" aria-live="polite" aria-busy="true">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">Loading</span>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={baseRoute}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            {/* ---- Public ---- */}
            <Route path="/" element={<SplashScreen />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/register/account-type" element={<AccountTypeScreen />} />
            <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
            <Route path="/terms" element={<TermsScreen />} />

            {/* ---- Registration flow ----
                Intentionally public: the account does not exist yet, so there is
                no session to verify. No PHI is read from the server here. */}
            <Route path="/register/personal-info" element={<PersonalInfoScreen />} />
            <Route path="/register/health-conditions" element={<HealthConditionsScreen />} />
            <Route path="/register/goals" element={<GoalsScreen />} />
            <Route path="/register/dietary" element={<DietaryQuestionnaireScreen />} />
            <Route path="/register/provider-info" element={<ProviderInfoScreen />} />

            {/* ---- Authenticated ---- */}
            <Route path="/home" element={<RequireAuth><HomeScreen /></RequireAuth>} />
            <Route path="/kits" element={<RequireAuth><KitsScreen /></RequireAuth>} />
            <Route path="/collection/scan" element={<RequireAuth><ScanKitScreen /></RequireAuth>} />
            <Route path="/collection/steps" element={<RequireAuth><CollectionStepsScreen /></RequireAuth>} />
            <Route path="/payment" element={<RequireAuth><PaymentScreen /></RequireAuth>} />
            <Route path="/orders" element={<RequireAuth><OrderScreen /></RequireAuth>} />
            <Route path="/recommendations" element={<RequireAuth><RecommendationsScreen /></RequireAuth>} />
            <Route path="/profile" element={<RequireAuth><ProfileScreen /></RequireAuth>} />
            <Route path="/profile/settings" element={<RequireAuth><ProfileSettingsScreen /></RequireAuth>} />
            <Route path="/profile/edit" element={<RequireAuth><ProfileEditScreen /></RequireAuth>} />

            {/* ---- Provider only ---- */}
            <Route
              path="/provider/dashboard"
              element={<RequireAuth role="PROVIDER"><ProviderDashboardScreen /></RequireAuth>}
            />
            <Route
              path="/provider/patient/:id"
              element={<RequireAuth role="PROVIDER"><PatientDetailScreen /></RequireAuth>}
            />

            {/* Unknown paths fall back to the splash screen, which routes the
                user on according to their session state. */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AppProvider>
  );
}

export default App;
