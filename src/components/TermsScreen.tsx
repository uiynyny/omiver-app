import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, ChevronLeft, ChevronDown, Check } from 'lucide-react';
import './TermsScreen.css';
import { useAppContext } from '../context/AppContext';
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

  const toggleSection = (index: number) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const handleContinue = async () => {
    if (!isAgreed) return;

    dispatch({ type: 'UPDATE_REGISTRATION', payload: { acceptedTerms: true } });

    // Build the payload mapping frontend field names to backend field names
    const reg = state.registration;
    const payload: Record<string, unknown> = {
      username: reg.username,
      password: reg.password,
      email: reg.email,
      first_name: reg.first_name,
      last_name: reg.last_name,
      use_custom_key: reg.use_custom_key,
      type: reg.accountType === 'healthcare' ? 'PROVIDER' : 'INDIVIDUAL',
      security_question: reg.security_question,
      security_answer: reg.security_answer,
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
    } catch (error) {
      console.error('Registration error', error);
      alert('Registration failed: ' + error);
      return;
    }

    if (!reg.email || !reg.password) {
      console.error('Missing email or password for login');
    } else {
      login(reg.email, reg.password).then((data) => {
        console.log('Login successful', data);
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
      }).catch((error) => {
        console.error('Login error', error);
        alert('Login failed. Please check your credentials and try again.');
      });
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
          <div className="terms-warning-callout">
            <h4>⚠️ IMPORTANT: NOT MEDICAL ADVICE</h4>
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
    <div className="terms-container">
      <header className="terms-header">
        <button onClick={handleBack} className="back-button" aria-label="Go Back">
          <ChevronLeft size={24} color="black" />
        </button>
        <h2>Review Terms</h2>
      </header>

      <div className="terms-content-scroll">
        
        {/* Welcome Banner */}
        <div className="terms-welcome-card">
          <h3>Nearly there!</h3>
          <p>
            {isProvider
              ? "As an Omiver Healthcare Provider, you can generate patient referral codes and track biological health indicators."
              : "Before analyzing your biomarkers and custom-crafting your adaptive nutrition plans, please read and accept our Terms of Service."}
          </p>
        </div>

        {/* Expandable Accordion Lists */}
        <div className="terms-accordion-list">
          {accordionSections.map((section, index) => {
            const isOpen = expandedSection === index;
            return (
              <div 
                key={index} 
                className={`terms-accordion-item ${isOpen ? 'active' : ''}`}
              >
                <button
                  className={`terms-accordion-header ${isOpen ? 'active' : ''}`}
                  onClick={() => toggleSection(index)}
                  aria-expanded={isOpen}
                >
                  <span className="terms-accordion-title">{section.title}</span>
                  <ChevronDown 
                    size={18} 
                    className="terms-accordion-icon" 
                  />
                </button>
                <div className={`terms-accordion-body ${isOpen ? 'open' : ''}`}>
                  <div className="terms-accordion-inner">
                    {section.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Interactive Custom Sticky Consent Box */}
      {isReadOnly ? (
        <></>
      ) : (
        <div className="terms-consent-panel">
          <div 
            className="terms-consent-row" 
            onClick={() => setIsAgreed(!isAgreed)}
            aria-checked={isAgreed}
            role="checkbox"
          >
            <div className={`terms-custom-checkbox ${isAgreed ? 'checked' : ''}`}>
              {isAgreed && <Check size={14} className="terms-checkmark" />}
            </div>
            <span className="terms-consent-label">
              I have read, understood, and agree to Omiver's{' '}
              <a
                className="bold-link"
                href={termsReadOnlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                Terms of Service
              </a>{' '}
              and{' '}
              <a
                className="bold-link"
                href={privacyReadOnlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                Privacy Policy
              </a>
              .
            </span>
          </div>

          <div className="terms-button-group">
            <button 
              onClick={handleContinue} 
              className="terms-primary-btn"
              disabled={!isAgreed}
            >
              Agree & Register <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TermsScreen;
