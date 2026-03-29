import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';

import SplashScreen from './components/SplashScreen';
import WelcomeScreen from './components/WelcomeScreen';
import WelcomeLayout from './components/WelcomeLayout';
import WelcomeScreen2 from './components/WelcomeScreen2';
import LoginScreen from './components/LoginScreen';
import RegisterScreen from './components/RegisterScreen';
import AccountTypeScreen from './components/AccountTypeScreen';
import PersonalInfoScreen from './components/PersonalInfoScreen';
import ProviderInfoScreen from './components/ProviderInfoScreen';
import ProviderDashboardScreen from './components/ProviderDashboardScreen';
import HealthConditionsScreen from './components/HealthConditionsScreen';
import DietaryInfoScreen from './components/DietaryInfoScreen';
import GoalsScreen from './components/GoalsScreen';
import TermsScreen from './components/TermsScreen';
import HomeScreen from './components/HomeScreen';
import KitsScreen from './components/KitsScreen';
import OrderScreen from './components/OrderScreen';
import ProfileScreen from './components/ProfileScreen';
import CollectionScreen from './components/CollectionScreen';
import ScanKitScreen from './components/ScanKitScreen';
import CollectionStepsScreen from './components/CollectionStepsScreen';
import PaymentScreen from './components/PaymentScreen';
import './App.css';

const baseRoute = import.meta.env.VITE_WEB ? '/app' : '/';
function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={baseRoute}>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route element={<WelcomeLayout />}>
            <Route path="/welcome" element={<WelcomeScreen />} />
            <Route path="/welcome-2" element={<WelcomeScreen2 />} />
          </Route>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterScreen />} />
          <Route path="/register/account-type" element={<AccountTypeScreen />} />
          {/* Individual registration flow */}
          <Route path="/register/personal-info" element={<PersonalInfoScreen />} />
          <Route path="/register/health-conditions" element={<HealthConditionsScreen />} />
          <Route path="/register/dietary-info" element={<DietaryInfoScreen />} />
          <Route path="/register/goals" element={<GoalsScreen />} />
          {/* Provider registration flow */}
          <Route path="/register/provider-info" element={<ProviderInfoScreen />} />
          {/* Shared */}
          <Route path="/terms" element={<TermsScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/kits" element={<KitsScreen />} />
          <Route path="/collection" element={<CollectionScreen />} />
          <Route path="/collection/scan" element={<ScanKitScreen />} />
          <Route path="/collection/steps" element={<CollectionStepsScreen />} />
          <Route path="/payment" element={<PaymentScreen />} />
          <Route path="/orders" element={<OrderScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          {/* Provider dashboard */}
          <Route path="/provider/dashboard" element={<ProviderDashboardScreen />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
export default App;
