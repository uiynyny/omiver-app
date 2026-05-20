import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';

const DietaryQuestionnaireScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [preferenceMode, setPreferenceMode] = useState(state.registration.dietary_preference_mode ?? 'similar');
  const [preferredCuisines, setPreferredCuisines] = useState(state.registration.preferred_cuisines ?? '');
  const [avoidedCuisines, setAvoidedCuisines] = useState(state.registration.avoided_cuisines ?? '');
  const [errors, setErrors] = useState<{ preferredCuisines?: string; avoidedCuisines?: string }>({});

  const handleContinue = () => {
    const newErrors: { preferredCuisines?: string; avoidedCuisines?: string } = {};
    if (!preferredCuisines.trim()) {
      newErrors.preferredCuisines = 'Preferred cuisines description is required';
    }
    if (!avoidedCuisines.trim()) {
      newErrors.avoidedCuisines = 'Please specify the cuisines you avoid or state "None"';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    dispatch({
      type: 'UPDATE_REGISTRATION',
      payload: {
        dietary_preference_mode: preferenceMode,
        preferred_cuisines: preferredCuisines,
        avoided_cuisines: avoidedCuisines,
      },
    });

    // Proceed to terms (end of registration flow)
    navigate('/terms');
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
        <h2>Dietary Preferences</h2>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '80%' }}></div>
      </div>

      <div className="registration-content">
        <h1 className="registration-title">
          Tell us about your <span className="highlight">diet</span>
        </h1>

        <div className="form-fields">
            <div className="input-group" style={{ flexDirection: 'column' }}>
              <textarea
                placeholder="Preferred cuisines (e.g. Mediterranean, Korean, Mexican) *"
                value={preferredCuisines}
                onChange={(e) => {
                  setPreferredCuisines(e.target.value);
                  if (errors.preferredCuisines) setErrors(prev => ({ ...prev, preferredCuisines: undefined }));
                }}
                className={`form-textarea ${errors.preferredCuisines ? 'error' : ''}`}
                rows={3}
              />
              {errors.preferredCuisines && <span className="error-text">{errors.preferredCuisines}</span>}
            </div>

            <div className="input-group" style={{ flexDirection: 'column' }}>
              <textarea
                placeholder="Cuisines you avoid or dislike *"
                value={avoidedCuisines}
                onChange={(e) => {
                  setAvoidedCuisines(e.target.value);
                  if (errors.avoidedCuisines) setErrors(prev => ({ ...prev, avoidedCuisines: undefined }));
                }}
                className={`form-textarea ${errors.avoidedCuisines ? 'error' : ''}`}
                rows={3}
              />
              {errors.avoidedCuisines && <span className="error-text">{errors.avoidedCuisines}</span>}
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

export default DietaryQuestionnaireScreen;
