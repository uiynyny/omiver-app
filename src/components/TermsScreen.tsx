import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';
import { login, register } from '../api/user';

const TermsScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const isProvider = state.registration.accountType === 'healthcare';

  const handleContinue = async () => {
    dispatch({ type: 'UPDATE_REGISTRATION', payload: { acceptedTerms: true } });

    // Build the payload mapping frontend field names to backend field names
    const reg = state.registration;
    const payload: Record<string, unknown> = {
      username: reg.username,
      password: reg.password,
      email: reg.email,
      first_name: reg.firstName,
      last_name: reg.lastName,
      type: reg.accountType === 'healthcare' ? 'PROVIDER' : 'INDIVIDUAL',
    };

    // Individual-only fields
    if (!isProvider) {
      payload.date_of_birth = reg.date_of_birth;
      payload.gender = reg.gender;
      payload.ethnicity = reg.ethnicity;
      payload.height = reg.height;
      payload.weight = reg.weight;
      payload.health_conditions = reg.healthConditions;
      payload.allergies = reg.allergies;
      payload.dietary_recall = reg.dietary_recall;
      payload.dietary_typicality = reg.dietary_typicality;
      payload.dietary_preference_mode = reg.dietary_preference_mode;
      payload.preferred_cuisines = reg.preferred_cuisines;
      payload.avoided_cuisines = reg.avoided_cuisines;
      payload.weekly_exercise_routine = reg.weekly_exercise_routine;
      payload.exercise_days_per_week = reg.exercise_days_per_week;
      payload.exercise_types = reg.exercise_types;
      payload.provider_notes = reg.provider_notes;
      payload.dietary_preferences = reg.dietary_preferences;
      payload.fitness_goal = reg.fitness_goal;
      payload.nutritional_goal = reg.nutritional_goal;
    }

    // Include referral code if patient came via provider link
    if (reg.referredByCode) {
      payload.referred_by_code = reg.referredByCode;
    }

    try{
      await register(payload);
    }catch(error) {
      console.error('Registration error', error);
      alert('Registration failed: ' + error);
      return;
    }
    if (!reg.email || !reg.password) {
      console.error('Missing email or password for login');
    } else {
      login(reg.email, reg.password).then((data) => {
        console.log('Login successful', data);
        const userType: 'PROVIDER' | 'INDIVIDUAL' = data.type || 'INDIVIDUAL';
        dispatch({
          type: 'UPDATE_REGISTRATION',
          payload: {
            firstName: data.first_name ?? '',
            lastName: data.last_name ?? '',
            referralCode: data.referral_code ?? undefined,
          }
        })
        dispatch({
          type: 'SET_AUTH',
          payload: { isAuthenticated: true, userId: reg.email || '', clientId: data.id || data.user_id, userType },
        });
        if (userType === 'PROVIDER') {
          navigate('/provider/dashboard');
        } else {
          navigate('/home');
        }
      }).catch((error) => {
        console.error('Login error', error);
        alert('Login failed. Please check your credentials and try again.');
      });
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="registration-screen">
      <header className="registration-header">
        <button onClick={handleBack} className="back-button">
          <ChevronLeft size={24} color='black' />
        </button>
        <h2>Terms of Service</h2>
      </header>

      <div className="registration-content terms-content">
        <div className="terms-notice">
          <h2>Important Notice</h2>
          <p>
            {isProvider
              ? 'By registering as a healthcare provider, you agree to our terms and privacy policy. You will be able to generate referral links for your patients.'
              : 'We will be collecting personal health information to provide you with accurate and personalized biomarker analysis.'}
          </p>
        </div>

        <div className="terms-section">
          <h3>{isProvider ? 'As a provider you can:' : 'The information you provide will be used to:'}</h3>
          <ul className="terms-list">
            {isProvider ? (
              <>
                <li><span className="bullet-icon">⦿</span> Generate a unique referral link for your patients</li>
                <li><span className="bullet-icon">⦿</span> Track and monitor your referred patients</li>
                <li><span className="bullet-icon">⦿</span> Access your provider dashboard</li>
              </>
            ) : (
              <>
                <li><span className="bullet-icon">⦿</span> Customize your biomarker testing recommendations</li>
                <li><span className="bullet-icon">⦿</span> Generate personalized health insights</li>
                <li><span className="bullet-icon">⦿</span> Create targeted nutrition and fitness plans</li>
                <li><span className="bullet-icon">⦿</span> Track your health progress over time</li>
              </>
            )}
          </ul>
        </div>

        <div className="terms-collected">
          <h3>Information We Will Collect:</h3>
          <div className="collected-items">
            <div className="collected-item">
              <CheckCircle className="check-icon" size={20} />
              <span>Personal Information</span>
            </div>
            {!isProvider && (
              <>
                <div className="collected-item">
                  <CheckCircle className="check-icon" size={20} />
                  <span>Health Conditions</span>
                </div>
                <div className="collected-item">
                  <CheckCircle className="check-icon" size={20} />
                  <span>Diet + Exercise Intake</span>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="button-group">
          <button onClick={handleContinue} className="primary-button">
            I Understand, Continue <ChevronRight size={20} />
          </button>
          <button onClick={handleBack} className="secondary-button">
            <ChevronLeft size={20} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsScreen;
