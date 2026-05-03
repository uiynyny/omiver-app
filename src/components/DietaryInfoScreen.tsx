import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';

const DietaryInfoScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [dietaryRecall, setDietaryRecall] = useState(state.registration.dietary_recall ?? '');
  const [typicality, setTypicality] = useState(state.registration.dietary_typicality ?? '5');
  const [preferenceMode, setPreferenceMode] = useState(state.registration.dietary_preference_mode ?? 'similar');
  const [preferredCuisines, setPreferredCuisines] = useState(state.registration.preferred_cuisines ?? '');
  const [avoidedCuisines, setAvoidedCuisines] = useState(state.registration.avoided_cuisines ?? '');

  const handleContinue = () => {
    dispatch({
      type: 'UPDATE_REGISTRATION',
      payload: {
        dietary_recall: dietaryRecall,
        dietary_typicality: typicality,
        dietary_preference_mode: preferenceMode,
        preferred_cuisines: preferredCuisines,
        avoided_cuisines: avoidedCuisines,
      },
    });
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
          Tell us about your <span className="highlight">dietary routine</span>
        </h1>

        <div className="form-fields">
          <div className="input-group">
            <textarea
              placeholder="24-hour dietary recall..."
              value={dietaryRecall}
              onChange={(e) => setDietaryRecall(e.target.value)}
              className="form-textarea"
              rows={5}
            />
          </div>

          <div className="input-group">
            <label className="field-label">How typical is this for you? (1-10)</label>
            <input
              type="range"
              min="1"
              max="10"
              value={typicality}
              onChange={(e) => setTypicality(e.target.value)}
              className="form-range"
            />
            <div className="range-value">{typicality}/10</div>
          </div>

          <div className="input-group">
            <label className="field-label">Do you want recommendations that are similar to your current diet or different?</label>
            <select
              className="form-input form-select"
              value={preferenceMode}
              onChange={(e) => setPreferenceMode(e.target.value)}
            >
              <option value="similar">Similar to my current diet</option>
              <option value="different">Different from my current diet</option>
              <option value="balanced">A balance of both</option>
            </select>
          </div>

          <div className="input-group">
            <textarea
              placeholder="Preferred cuisines (e.g. Mediterranean, Korean, Mexican)"
              value={preferredCuisines}
              onChange={(e) => setPreferredCuisines(e.target.value)}
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="input-group">
            <textarea
              placeholder="Cuisines you avoid or dislike"
              value={avoidedCuisines}
              onChange={(e) => setAvoidedCuisines(e.target.value)}
              className="form-textarea"
              rows={3}
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
