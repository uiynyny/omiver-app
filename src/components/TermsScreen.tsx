import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, CheckCircle } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';
import { register } from '../api/user';

const TermsScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();

  const handleContinue = async () => {
    // Persist acceptance and mark user authenticated for this demo
    dispatch({ type: 'UPDATE_REGISTRATION', payload: { acceptedTerms: true } });
    const response = await register(state.registration)
    console.log(response)
    if (!response) {
      alert('Registration failed: ' + response);
      return;
    }
    dispatch({ type: 'SET_AUTH', payload: { isAuthenticated: true, userId: 'local-user' } });
    navigate('/home');
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
            We will be collecting personal health information to provide you with accurate and
            personalized biomarker analysis.
          </p>
        </div>

        <div className="terms-section">
          <h3>The information you provide will be used to:</h3>
          <ul className="terms-list">
            <li>
              <span className="bullet-icon">⦿</span> Customize your biomarker testing recommendations
            </li>
            <li>
              <span className="bullet-icon">⦿</span> Generate personalized health insights
            </li>
            <li>
              <span className="bullet-icon">⦿</span> Create targeted nutrition and fitness plans
            </li>
            <li>
              <span className="bullet-icon">⦿</span> Track your health progress over time
            </li>
          </ul>
        </div>

        <div className="terms-collected">
          <h3>Information We Will Collect:</h3>
          <div className="collected-items">
            <div className="collected-item">
              <CheckCircle className="check-icon" size={20} />
              <span>Personal Information</span>
            </div>
            <div className="collected-item">
              <CheckCircle className="check-icon" size={20} />
              <span>Health Conditions</span>
            </div>
            <div className="collected-item">
              <CheckCircle className="check-icon" size={20} />
              <span>Dietary Information</span>
            </div>
            <div className="collected-item">
              <CheckCircle className="check-icon" size={20} />
              <span>Fitness Goals</span>
            </div>
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
