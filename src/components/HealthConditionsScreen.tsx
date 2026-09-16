import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './Onboarding.css';
import { useAppContext } from '../context/AppContext';

const HealthConditionsScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [healthConditions, setHealthConditions] = useState(state.registration.healthConditions ?? '');

  const handleContinue = () => {
    dispatch({ type: 'UPDATE_REGISTRATION', payload: { healthConditions } });
    navigate('/register/goals');
  };

  return (
    <div className="wizard">
      <header className="wizard__header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ChevronLeft size={24} />
        </button>
        <div className="wizard__title">Registration</div>
        <div className="wizard__header-spacer" aria-hidden="true" />
      </header>

      <div className="wizard__progress">
        <div className="progress">
          <div className="progress__fill" style={{ width: '50%' }}></div>
        </div>
      </div>

      <main className="wizard__body" aria-live="polite">
        <div className="wizard__step-container">
          <div className="fade-in">
            <div className="wizard__step-header">
              <span className="section-label">Step 2 of 4</span>
              <h1 className="section-title">Health Conditions</h1>
              <p className="text-secondary">Help us understand your health history.</p>
            </div>
            
            <div className="wizard__step-content stack">
              <div className="field">
                <label className="field__label" htmlFor="conditions">Chronic conditions, diseases, or health concerns</label>
                <textarea
                  id="conditions"
                  placeholder="Leave blank if none apply..."
                  value={healthConditions}
                  onChange={(e) => setHealthConditions(e.target.value)}
                  className="textarea"
                />
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="wizard__footer">
        <div className="wizard__footer-content">
          <button onClick={() => navigate(-1)} className="btn btn--secondary">
            Back
          </button>
          <button onClick={handleContinue} className="btn btn--primary" style={{ flex: 1 }}>
            Continue
          </button>
        </div>
      </footer>
    </div>
  );
};

export default HealthConditionsScreen;
