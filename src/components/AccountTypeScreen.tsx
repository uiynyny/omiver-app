import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

import './Onboarding.css';
import './AccountTypeScreen.css';
import individualUserIllustration from '../assets/individual-user.svg';
import healthcareProviderIllustration from '../assets/healthcare-provider.svg';
import { useAppContext } from '../context/AppContext';

type AccountType = 'individual' | 'healthcare';

const OPTIONS: Array<{
  value: AccountType;
  label: string;
  meta: string;
  art: string;
  alt: string;
}> = [
  {
    value: 'individual',
    label: "I'm an individual",
    meta: 'Order kits and track your own biomarkers.',
    art: individualUserIllustration,
    alt: '',
  },
  {
    value: 'healthcare',
    label: "I'm a healthcare provider",
    meta: 'Invite patients and review their results.',
    art: healthcareProviderIllustration,
    alt: '',
  },
];

const AccountTypeScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [selectedType, setSelectedType] = useState<AccountType | null>(
    state.registration.accountType ?? null
  );
  const [error, setError] = useState('');

  const handleContinue = () => {
    if (!selectedType) {
      setError('Please choose an account type to continue.');
      return;
    }
    setError('');
    dispatch({ type: 'UPDATE_REGISTRATION', payload: { accountType: selectedType } });
    if (selectedType === 'healthcare') {
      navigate('/register/provider-info');
    } else {
      navigate('/register/personal-info');
    }
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
        <div className="wizard__title">Registration</div>
        <div className="wizard__header-spacer" aria-hidden="true" />
      </header>

      <div className="wizard__progress">
        <div className="progress">
          <div className="progress__fill account-type__progress-fill" />
        </div>
      </div>

      <main className="wizard__body">
        <div className="wizard__step-container">
          <div className="fade-in">
            <div className="wizard__step-header">
              <span className="section-label">Step 1</span>
              <h1 className="section-title">How will you use Omiver?</h1>
              <p className="text-secondary">
                This decides what we ask you next. You can change it later.
              </p>
            </div>

            {error && (
              <div className="error-banner" role="alert">
                {error}
              </div>
            )}

            {/* A radiogroup of large cards. The inputs are real radios so
                arrow-key navigation and screen-reader semantics come free. */}
            <fieldset className="account-type__fieldset">
              <legend className="sr-only">Account type</legend>
              <div className="choice-grid">
                {OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`choice${selectedType === opt.value ? ' choice--selected' : ''}`}
                    htmlFor={`account-type-${opt.value}`}
                  >
                    <input
                      id={`account-type-${opt.value}`}
                      className="choice__input"
                      type="radio"
                      name="account-type"
                      value={opt.value}
                      checked={selectedType === opt.value}
                      onChange={() => { setSelectedType(opt.value); setError(''); }}
                    />
                    <span className="choice__dot" aria-hidden="true" />
                    <span className="choice__art">
                      <img src={opt.art} alt={opt.alt} />
                    </span>
                    <span className="choice__body">
                      <span className="choice__label">{opt.label}</span>
                      <span className="choice__meta">{opt.meta}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          </div>
        </div>
      </main>

      <div className="wizard__footer">
        <div className="wizard__footer-content">
          <button
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

export default AccountTypeScreen;
