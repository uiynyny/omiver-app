import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronDown, AlertTriangle } from 'lucide-react';
import './TermsScreen.css';
import { useAppContext } from '../context/AppContext';
import { getCredentials, clearCredentials } from '../context/credentialStore';
import { login, register } from '../api/user';

interface AccordionSection {
  title: string;
  content: React.ReactNode;
}

const TermsScreen = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { state, dispatch } = useAppContext();
  const isProvider = state.registration.accountType === 'healthcare';
  const isReadOnly = searchParams.get('mode') === 'readonly';
  const termsReadOnlyUrl = `${import.meta.env.BASE_URL}terms?mode=readonly&section=terms`;
  const privacyReadOnlyUrl = `${import.meta.env.BASE_URL}terms?mode=readonly&section=privacy`;

  // Stateful Accordion & Checkbox Consent
  const [expandedSection, setExpandedSection] = useState<number | null>(null);
  const [isAgreed, setIsAgreed] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const handleContinue = async () => {
    if (!isAgreed || submitting) return;

    setError('');
    setSubmitting(true);

    dispatch({ type: 'UPDATE_REGISTRATION', payload: { acceptedTerms: true } });

    // Build the payload mapping frontend field names to backend field names
    const reg = state.registration;
    const { password, securityAnswer } = getCredentials();
    const payload: Record<string, unknown> = {
      username: reg.username,
      password,
      email: reg.email,
      first_name: reg.first_name,
      last_name: reg.last_name,
      use_custom_key: reg.use_custom_key,
      type: reg.accountType === 'healthcare' ? 'PROVIDER' : 'INDIVIDUAL',
      security_question: reg.security_question,
      security_answer: securityAnswer,
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
      payload.exercise_recall = reg.exercise_recall;
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

    try {
      await register(payload);
    } catch {
      // The error body echoes the submitted payload, which contains the
      // password and PHI — so it is neither logged nor shown.
      setError('We could not create your account. Please review your details and try again.');
      setSubmitting(false);
      return;
    }

    if (!reg.email || !password) {
      clearCredentials();
      setSubmitting(false);
      setError('Your account was created, but we could not sign you in automatically. Please sign in.');
      navigate('/login');
      return;
    }

    try {
      const data = await login(reg.email, password);
      // Credentials are no longer needed once the session exists.
      clearCredentials();
      const userType: 'PROVIDER' | 'INDIVIDUAL' = data.type || 'INDIVIDUAL';
      dispatch({
        type: 'UPDATE_REGISTRATION',
        payload: {
          first_name: data.first_name ?? '',
          last_name: data.last_name ?? '',
          referralCode: data.referral_code ?? undefined,
        }
      });
      dispatch({
        type: 'SET_AUTH',
        payload: { isAuthenticated: true, userId: reg.email || '', clientId: data.id || data.user_id, userType },
      });
      if (userType === 'PROVIDER') {
        navigate('/provider/dashboard');
      } else {
        navigate('/home');
      }
    } catch {
      clearCredentials();
      setSubmitting(false);
      setError('Your account was created, but sign-in failed. Please sign in manually.');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Rich Accordion Section Content
  const accordionSections: AccordionSection[] = [
    {
      title: "1. Introduction & Acceptance",
      content: (
        <>
          <p>Welcome to Omiver! By accessing our hybrid mobile application and services, you agree to be bound by our Terms of Service and our Privacy Policy (see below).</p>
          <p>These Terms constitute a legally binding agreement between you and Omiver Nutrition, Inc. If you do not agree, you must discontinue registration.</p>
        </>
      )
    },
    {
      title: "2. Scope of Services",
      content: (
        <>
          <p>Omiver offers biological biomarker screening coupled with AI-assisted dietary, nutritional, and performance guidance.</p>
          {isProvider ? (
            <ul>
              <li>Access a dedicated provider analytics dashboard.</li>
              <li>Generate unique patient referral links.</li>
              <li>Monitor patient biomarker trends and wellness plans.</li>
            </ul>
          ) : (
            <ul>
              <li>Order at-home biometric collection kits.</li>
              <li>View deep molecular analysis of 100+ biomarkers.</li>
              <li>Get adaptive recipes and custom fitness plans matching your habits.</li>
            </ul>
          )}
        </>
      )
    },
    {
      title: "3. Medical Advice Disclaimer",
      content: (
        <>
          <div className="terms__callout">
            <h4 className="terms__callout-title">
              <AlertTriangle size={16} aria-hidden="true" />
              Important: not medical advice
            </h4>
            <p>Omiver is a wellness technology platform, not a medical provider. We do not offer clinical diagnostic services or medical treatment. All biological test analysis is performed by independent laboratory partners. Any metric, analysis, or recommendation provided is solely for general wellness purposes.</p>
          </div>
          <p>Always consult with your doctor or qualified clinical practitioner before beginning any new supplementation, diet, or intense physical training regimen.</p>
        </>
      )
    },
    {
      title: "4. Privacy & Biomarker Security",
      content: (
        <>
          <p>We value the sensitivity of your biological profile. Your biomarker data is pseudonymized using randomized ID keys and separated from your personal billing credentials.</p>
          <p>We secure database storage using standard AES-256 encryption. We will never sell, license, or share your health records with health insurance brokers or marketing firms.</p>
        </>
      )
    },
    {
      title: "5. Data Ownership & Deletion",
      content: (
        <>
          <p>Your biological data belongs exclusively to you. You retain the full right to download your raw biomarker dataset at any time.</p>
          <p>If you decide to delete your account, Omiver will permanently purge all biomarker histories and personal identification data from our systems within 30 days.</p>
        </>
      )
    }
  ];

  return (
    <div className="wizard">
      <header className="wizard__header">
        <button type="button" onClick={handleBack} className="icon-btn" aria-label="Go back">
          <ChevronLeft size={24} />
        </button>
        <div className="wizard__title">{isReadOnly ? 'Legal' : 'Review terms'}</div>
        <div className="wizard__header-spacer" aria-hidden="true" />
      </header>

      <main className="wizard__body">
        <div className="wizard__step-container">
          <div className="wizard__step-header">
            <h1 className="section-title">
              {isReadOnly ? 'Terms & Privacy' : 'Nearly there'}
            </h1>
            <p className="text-secondary">
              {isProvider
                ? 'As an Omiver healthcare provider, you can generate patient referral codes and track biological health indicators.'
                : 'Before we analyse your biomarkers and build your nutrition plan, please read and accept our Terms of Service.'}
            </p>
          </div>

          {error && (
            <div className="error-banner" role="alert">
              {error}
            </div>
          )}

          <div className="terms__accordion">
            {accordionSections.map((section, index) => {
              const isOpen = expandedSection === index;
              return (
                <div
                  key={section.title}
                  className={`terms__item${isOpen ? ' terms__item--open' : ''}`}
                >
                  <h2 className="terms__item-heading">
                    <button
                      type="button"
                      id={`terms-section-${index}`}
                      className="terms__trigger"
                      onClick={() => toggleSection(index)}
                      aria-expanded={isOpen}
                      aria-controls={`terms-panel-${index}`}
                    >
                      <span className="terms__trigger-title">{section.title}</span>
                      <ChevronDown size={18} className="terms__chevron" aria-hidden="true" />
                    </button>
                  </h2>
                  <div
                    id={`terms-panel-${index}`}
                    role="region"
                    aria-labelledby={`terms-section-${index}`}
                    className="terms__panel"
                    hidden={!isOpen}
                  >
                    <div className="terms__prose">{section.content}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {!isReadOnly && (
        <div className="wizard__footer">
          <label className="terms__consent" htmlFor="terms-agree">
            <input
              id="terms-agree"
              type="checkbox"
              className="checkbox-input"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
            />
            <span className="terms__consent-label">
              I have read, understood, and agree to Omiver&rsquo;s{' '}
              <a
                href={termsReadOnlyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                href={privacyReadOnlyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <button
            type="button"
            onClick={handleContinue}
            className="btn btn--primary btn--block"
            disabled={!isAgreed || submitting}
            aria-busy={submitting}
          >
            {submitting ? (
              <>
                <span className="spinner" aria-hidden="true" />
                Creating your account
              </>
            ) : (
              'Agree & register'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default TermsScreen;
