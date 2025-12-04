import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';

const DietaryInfoScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const dietary = state.registration.dietary ?? {};
  const [allergies, setAllergies] = useState(dietary.allergies ?? '');
  const [preferences, setPreferences] = useState(dietary.preferences ?? '');

  const handleContinue = () => {
    dispatch({ type: 'UPDATE_REGISTRATION', payload: { dietary: { allergies, preferences } } });
    navigate('/register/goals');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="registration-screen">
      <header className="registration-header">
        <button onClick={handleBack} className="back-button">
          <ChevronLeft size={24} />
        </button>
        <h2>Dietary Information</h2>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '56%' }}></div>
      </div>

      <div className="registration-content">
        <h1 className="registration-title">
          Tell us about your <span className="highlight">dietary needs</span>
        </h1>

        <div className="form-fields">
          <div className="input-group">
            <textarea
              placeholder="List any allergies & Sensitivities...&#10;&#10;&#10;Leave blank if none apply"
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="form-textarea"
              rows={5}
            />
          </div>

          <div className="input-group">
            <textarea
              placeholder="Dietary Preferences...&#10;&#10;&#10;Leave blank if none apply"
              value={preferences}
              onChange={(e) => setPreferences(e.target.value)}
              className="form-textarea"
              rows={5}
            />
          </div>
        </div>

        <div className="button-group">
          <button onClick={handleContinue} className="primary-button">
            Continue <ChevronRight size={20} />
          </button>
          <button onClick={handleBack} className="secondary-button">
            <ChevronLeft size={20} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default DietaryInfoScreen;
