import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Stethoscope } from 'lucide-react';
import './Onboarding.css';
import './ProviderInfoScreen.css';
import { useAppContext } from '../context/AppContext';

const ProviderInfoScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [first_name, setFirstName] = useState(state.registration.first_name ?? '');
  const [last_name, setLastName] = useState(state.registration.last_name ?? '');
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!first_name.trim() || !last_name.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    setError('');
    dispatch({
      type: 'UPDATE_REGISTRATION',
      payload: { first_name: first_name.trim(), last_name: last_name.trim() },
    });
    navigate('/terms');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="wizard">
      <header className="wizard__header">
        <button type="button" className="icon-btn" onClick={handleBack} aria-label="Go back">
          <ChevronLeft size={24} />
        </button>
        <div className="wizard__title">Provider profile</div>
        <div className="wizard__header-spacer" aria-hidden="true" />
      </header>

      <div className="wizard__progress">
        <div className="progress">
          <div className="progress__fill provider-info__progress-fill" />
        </div>
      </div>

      <main className="wizard__body">
        <div className="wizard__step-container">
          <form
            className="fade-in"
            onSubmit={(e) => { e.preventDefault(); handleContinue(); }}
          >
            <div className="wizard__step-header">
              <span className="provider-info__badge" aria-hidden="true">
                <Stethoscope size={28} strokeWidth={1.5} />
              </span>
              <span className="section-label">Step 2</span>
              <h1 className="section-title">What&rsquo;s your name?</h1>
              <p className="text-secondary">
                That&rsquo;s all we need to set up your provider account. We&rsquo;ll generate your
                unique patient referral link right after.
              </p>
            </div>

            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}

            <div className="wizard__step-content">
              <div className="field">
                <label className="field__label" htmlFor="provider-first-name">First name</label>
                <input
                  id="provider-first-name"
                  className="input"
                  type="text"
                  autoComplete="given-name"
                  value={first_name}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="provider-last-name">Last name</label>
                <input
                  id="provider-last-name"
                  className="input"
                  type="text"
                  autoComplete="family-name"
                  value={last_name}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit lives in the sticky footer, so it is associated by id. */}
            <button type="submit" className="sr-only" tabIndex={-1} aria-hidden="true">
              Continue
            </button>
          </form>
        </div>
      </main>

      <div className="wizard__footer">
        <div className="wizard__footer-content">
          <button type="button" className="btn btn--secondary" onClick={handleBack}>
            Back
          </button>
          <button
            id="provider-continue-btn"
            type="button"
            className="btn btn--primary btn--block"
            onClick={handleContinue}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderInfoScreen;
