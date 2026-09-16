import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './Onboarding.css';
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
          <div className="progress__fill" style={{ width: '100%' }}></div>
        </div>
      </div>

      <main className="wizard__body" aria-live="polite">
        <div className="wizard__step-container">
          <div className="fade-in">
            <div className="wizard__step-header">
              <span className="section-label">Step 4 of 4</span>
              <h1 className="section-title">Dietary Preferences</h1>
              <p className="text-secondary">Tell us about your diet.</p>
            </div>
            
            <div className="wizard__step-content stack">
              <div className="field">
                <label className="field__label" htmlFor="preferredCuisines">Preferred cuisines</label>
                <textarea
                  id="preferredCuisines"
                  placeholder="e.g. Mediterranean, Korean, Mexican"
                  value={preferredCuisines}
                  onChange={(e) => {
                    setPreferredCuisines(e.target.value);
                    if (errors.preferredCuisines) setErrors(prev => ({ ...prev, preferredCuisines: undefined }));
                  }}
                  className="textarea"
                  aria-invalid={!!errors.preferredCuisines}
                />
                {errors.preferredCuisines && <span className="field__error" role="alert">{errors.preferredCuisines}</span>}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="avoidedCuisines">Cuisines you avoid or dislike</label>
                <textarea
                  id="avoidedCuisines"
                  placeholder="e.g. Fast food, highly processed"
                  value={avoidedCuisines}
                  onChange={(e) => {
                    setAvoidedCuisines(e.target.value);
                    if (errors.avoidedCuisines) setErrors(prev => ({ ...prev, avoidedCuisines: undefined }));
                  }}
                  className="textarea"
                  aria-invalid={!!errors.avoidedCuisines}
                />
                {errors.avoidedCuisines && <span className="field__error" role="alert">{errors.avoidedCuisines}</span>}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="preferenceMode">Do you want recommendations that are similar to your current diet or different?</label>
                <select
                  id="preferenceMode"
                  className="select"
                  value={preferenceMode}
                  onChange={(e) => setPreferenceMode(e.target.value)}
                >
                  <option value="similar">Similar to my current diet</option>
                  <option value="different">Different from my current diet</option>
                  <option value="balanced">A balance of both</option>
                </select>
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
            Complete
          </button>
        </div>
      </footer>
    </div>
  );
};

export default DietaryQuestionnaireScreen;
