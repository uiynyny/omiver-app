import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, AlertCircle } from 'lucide-react';
import './Onboarding.css';
import { useAppContext } from '../context/AppContext';
import { checkReferralCode, setCustomProfileKey, getCustomProfileKey } from '../api/user';
import { encryptName, decryptName } from '../utils/crypto';

const PersonalInfoScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [first_name, setFirstName] = useState('');
  const [last_name, setLastName] = useState('');
  const [useCustomKey, setUseCustomKey] = useState(false);
  const [customKey, setCustomKey] = useState('');
  const [date_of_birth, setDateOfBirth] = useState(state.registration.date_of_birth ?? '');
  const [gender, setGender] = useState(state.registration.gender ?? 'Male');
  const [ethnicity, setEthnicity] = useState(state.registration.ethnicity ?? '');
  const [height, setHeight] = useState<number>(state.registration.height || 68); // Default to 5'8" (68 inches)
  const [weight, setWeight] = useState<number>(state.registration.weight ?? 0);
  const [referredByCode, setReferredByCode] = useState(state.registration.referredByCode ?? '');
  
  const [errorMsg, setErrorMsg] = useState('');
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setErrorMsg(''), 5000);
  };

  useEffect(() => {
    const initNames = async () => {
      let fname = state.registration.first_name ?? '';
      let lname = state.registration.last_name ?? '';
      const savedKey = getCustomProfileKey();
      
      if (fname.startsWith('client_enc:') && savedKey) {
        fname = await decryptName(fname, savedKey);
        setUseCustomKey(true);
        setCustomKey(savedKey);
      }
      if (lname.startsWith('client_enc:') && savedKey) {
        lname = await decryptName(lname, savedKey);
      }
      
      setFirstName(fname);
      setLastName(lname);
    };
    initNames();
  }, [state.registration]);

  const handleContinue = async () => {
    if (!first_name || !last_name || !date_of_birth || !ethnicity || !gender || !height || !weight || !referredByCode.trim()) {
      showError('Please fill in all required fields, including your referral code');
      return;
    }
    if (useCustomKey && !customKey.trim()) {
      showError('Please enter a custom encryption key or disable key protection');
      return;
    }
    
    try {
      const isValid = await checkReferralCode(referredByCode);
      if (!isValid) {
        showError('Invalid referral code. Please check and try again.');
        return;
      }
    } catch {
      // Not logged: the API error body echoes the submitted profile data.
      showError('An error occurred while validating the referral code. Please try again later.');
      return;
    }

    let finalFirstName = first_name;
    let finalLastName = last_name;

    if (useCustomKey) {
      setCustomProfileKey(customKey);
      finalFirstName = await encryptName(first_name, customKey);
      finalLastName = await encryptName(last_name, customKey);
    } else {
      setCustomProfileKey(null);
    }

    dispatch({
      type: 'UPDATE_REGISTRATION',
      payload: {
        first_name: finalFirstName,
        last_name: finalLastName,
        use_custom_key: useCustomKey,
        date_of_birth,
        gender,
        ethnicity,
        height,
        weight,
        referredByCode: referredByCode.trim(),
      },
    });
    navigate('/register/health-conditions');
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
          <div className="progress__fill" style={{ width: '25%' }}></div>
        </div>
      </div>

      <main className="wizard__body" aria-live="polite">
        {errorMsg && (
          <div className="error-banner" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            {errorMsg}
          </div>
        )}

        <div className="wizard__step-container">
          <div className="fade-in">
            <div className="wizard__step-header">
              <span className="section-label">Step 1 of 4</span>
              <h1 className="section-title">Personal Information</h1>
              <p className="text-secondary">Please complete your profile.</p>
            </div>
            
            <div className="wizard__step-content stack">
              <div className="field">
                <label className="field__label" htmlFor="referral">Referral Code (Required)</label>
                <input
                  id="referral"
                  type="text"
                  placeholder="e.g. REF123"
                  value={referredByCode}
                  onChange={(e) => setReferredByCode(e.target.value)}
                  className="input"
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="first_name">First name</label>
                <input
                  id="first_name"
                  type="text"
                  placeholder="e.g. Jane"
                  value={first_name}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="last_name">Last name</label>
                <input
                  id="last_name"
                  type="text"
                  placeholder="e.g. Doe"
                  value={last_name}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="field">
                <label className="checkbox-label" htmlFor="use_custom_key">
                  <input
                    id="use_custom_key"
                    type="checkbox"
                    checked={useCustomKey}
                    onChange={(e) => setUseCustomKey(e.target.checked)}
                    className="checkbox-input"
                  />
                  Protect my name with a custom key (offline encryption)
                </label>
                {useCustomKey && (
                  <div className="field" style={{ marginTop: 'var(--sp-2)' }}>
                    <label className="sr-only" htmlFor="custom_key">Encryption Key</label>
                    <input
                      id="custom_key"
                      type="password"
                      placeholder="Enter Profile Encryption Key (Passphrase)"
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      className="input"
                    />
                  </div>
                )}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="dob">Birthday</label>
                <input
                  id="dob"
                  type="date"
                  value={date_of_birth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="input"
                />
              </div>

              <div className="field">
                <label className="field__label" htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="select"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="ethnicity">Ethnicity</label>
                <select
                  id="ethnicity"
                  value={ethnicity}
                  onChange={(e) => setEthnicity(e.target.value)}
                  className="select"
                >
                  <option value="" disabled>Select Ethnicity</option>
                  <option value="White">White</option>
                  <option value="Black or African American">Black or African American</option>
                  <option value="Asian">Asian</option>
                  <option value="Hispanic or Latino">Hispanic or Latino</option>
                  <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
                  <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="height_ft">Height</label>
                <div className="height-row">
                  <select
                    id="height_ft"
                    title="Feet"
                    value={Math.floor(height / 12) || 6}
                    onChange={(e) => {
                      const ft = parseInt(e.target.value) || 5;
                      const inch = height % 12;
                      setHeight(ft * 12 + inch);
                    }}
                    className="select"
                  >
                    {[3, 4, 5, 6, 7, 8].map(ft => (
                      <option key={ft} value={ft}>{ft}'</option>
                    ))}
                  </select>
                  <select
                    title="Inches"
                    aria-label="Height in inches"
                    value={height % 12}
                    onChange={(e) => {
                      const ft = Math.floor(height / 12) || 5;
                      const inch = parseInt(e.target.value) || 0;
                      setHeight(ft * 12 + inch);
                    }}
                    className="select"
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>{i}''</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="weight">Weight (lbs)</label>
                <div className="weight-row">
                  <input
                    id="weight"
                    type="number"
                    placeholder="e.g. 180"
                    value={weight || ''}
                    onChange={(e) => setWeight(parseFloat(e.target.value))}
                    className="input"
                  />
                </div>
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

export default PersonalInfoScreen;
