import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import AccountTypeScreen from './components/AccountTypeScreen';
import PersonalInfoScreen from './components/PersonalInfoScreen';
import ProviderInfoScreen from './components/ProviderInfoScreen';
import ProviderDashboardScreen from './components/ProviderDashboardScreen';
import HealthConditionsScreen from './components/HealthConditionsScreen';
import DietaryQuestionnaireScreen from './components/DietaryQuestionnaireScreen';
import GoalsScreen from './components/GoalsScreen';
import TermsScreen from './components/TermsScreen';
import HomeScreen from './components/HomeScreen';
import KitsScreen from './components/KitsScreen';
import OrderScreen from './components/OrderScreen';
import RecommendationsScreen from './components/RecommendationsScreen';
import ProfileScreen from './components/ProfileScreen';
import ScanKitScreen from './components/ScanKitScreen';
import CollectionStepsScreen from './components/CollectionStepsScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import PaymentScreen from './components/PaymentScreen';
import PatientDetailScreen from './components/PatientDetailScreen';
import './App.css';

const baseRoute = import.meta.env.VITE_WEB ? '/app' : '/';
function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={baseRoute}>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/register/account-type" element={<AccountTypeScreen />} />
          {/* Individual registration flow */}
          <Route path="/register/personal-info" element={<PersonalInfoScreen />} />
          <Route path="/register/health-conditions" element={<HealthConditionsScreen />} />
          <Route path="/register/goals" element={<GoalsScreen />} />
          <Route path="/register/dietary" element={<DietaryQuestionnaireScreen />} />
          {/* Provider registration flow */}
          <Route path="/register/provider-info" element={<ProviderInfoScreen />} />
          {/* Shared */}
          <Route path="/terms" element={<TermsScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/kits" element={<KitsScreen />} />
          <Route path="/collection/scan" element={<ScanKitScreen />} />
          <Route path="/collection/steps" element={<CollectionStepsScreen />} />
          <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
          <Route path="/payment" element={<PaymentScreen />} />
          <Route path="/orders" element={<OrderScreen />} />
          <Route path="/recommendations" element={<RecommendationsScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/provider/dashboard" element={<ProviderDashboardScreen />} />
          <Route path="/provider/patient/:id" element={<PatientDetailScreen />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
export default App;
