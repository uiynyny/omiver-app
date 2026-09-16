import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, CreditCard, Heart, Target, LogOut, ChevronRight, Apple, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { updateClient, getCustomProfileKey, setCustomProfileKey } from '../api/user';
import { useLogout } from '../hooks/useLogout';
import BottomNav from './BottomNav';
import './ProfileSettingsScreen.css';

const ProfileSettingsScreen: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const handleLogout = useLogout();
  
  const reg = state.registration;
  const clientId = state.auth.clientId || reg.user_id;

  const [settingsTab, setSettingsTab] = useState<'menu' | 'profile' | 'payment' | 'health' | 'dietary' | 'goals'>('menu');
  const [saving, setSaving] = useState(false);
  
  // Inline banners
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (['profile', 'payment', 'health', 'dietary', 'goals'].includes(tab as string)) {
      setSettingsTab(tab as any);
    } else {
      setSettingsTab('menu');
    }
  }, [location.search]);

  // Editing state fields (initialize only once, avoiding overwrite on reg change)
  const [firstName, setFirstName] = useState(reg.first_name ?? '');
  const [lastName, setLastName] = useState(reg.last_name ?? '');
  const [dob, setDob] = useState(reg.date_of_birth ?? '');
  const [heightValue, setHeightValue] = useState<number>(reg.height ?? 68);
  const [weightValue, setWeightValue] = useState<number>(reg.weight ?? 150);
  const [securityQuestion, setSecurityQuestion] = useState(reg.security_question ?? '');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [useCustomKey, setUseCustomKey] = useState(!!getCustomProfileKey());
  const [customKey, setCustomKey] = useState(getCustomProfileKey() ?? '');

  // Billing
  const [billingStreet, setBillingStreet] = useState(reg.billing_street ?? '');
  const [billingCity, setBillingCity] = useState(reg.billing_city ?? '');
  const [billingState, setBillingState] = useState(reg.billing_state ?? '');
  const [billingZip, setBillingZip] = useState(reg.billing_zip ?? '');
  
  // Read-only card info
  const cardBrand = reg.card_brand ?? '';
  const cardLastFour = reg.card_last_four ?? '';
  const expiryMonth = reg.expiry_month;
  const expiryYear = reg.expiry_year;
  const cardholderName = reg.cardholder_name ?? '';

  // Other fields
  const [healthConditions, setHealthConditions] = useState(reg.healthConditions ?? (reg as any).health_conditions ?? '');
  const [allergies, setAllergies] = useState(reg.allergies ?? '');
  const [dietaryPreferences, setDietaryPreferences] = useState(reg.dietary_preferences ?? 'Balanced');
  const [nutritionalGoal, setNutritionalGoal] = useState(reg.nutritional_goal ?? '');
  const [fitnessGoal, setFitnessGoal] = useState(reg.fitness_goal ?? '');

  const [shippingStreet, setShippingStreet] = useState(reg.shipping_street ?? '');
  const [shippingCity, setShippingCity] = useState(reg.shipping_city ?? '');
  const [shippingState, setShippingState] = useState(reg.shipping_state ?? '');
  const [shippingZip, setShippingZip] = useState(reg.shipping_zip ?? '');
  const [shippingCountry, setShippingCountry] = useState(reg.shipping_country ?? 'United States');

  // Sync state ONLY if clientId changes to prevent overwriting in-progress edits when reg updates
  useEffect(() => {
    setFirstName(reg.first_name ?? '');
    setLastName(reg.last_name ?? '');
    setDob(reg.date_of_birth ?? '');
    setHeightValue(reg.height ?? 68);
    setWeightValue(reg.weight ?? 150);
    setSecurityQuestion(reg.security_question ?? '');
    setBillingStreet(reg.billing_street ?? '');
    setBillingCity(reg.billing_city ?? '');
    setBillingState(reg.billing_state ?? '');
    setBillingZip(reg.billing_zip ?? '');
    setHealthConditions(reg.healthConditions ?? (reg as any).health_conditions ?? '');
    setAllergies(reg.allergies ?? '');
    setDietaryPreferences(reg.dietary_preferences ?? 'Balanced');
    setNutritionalGoal(reg.nutritional_goal ?? '');
    setFitnessGoal(reg.fitness_goal ?? '');
    setShippingStreet(reg.shipping_street ?? '');
    setShippingCity(reg.shipping_city ?? '');
    setShippingState(reg.shipping_state ?? '');
    setShippingZip(reg.shipping_zip ?? '');
    setShippingCountry(reg.shipping_country ?? 'United States');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const showBanner = (msg: string, isError: boolean = false) => {
    if (isError) {
      setErrorMsg(msg);
      setSuccessMsg('');
    } else {
      setSuccessMsg(msg);
      setErrorMsg('');
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setSuccessMsg('');
      setErrorMsg('');
    }, 3000);
  };

  const handleSaveSubForm = async (tab: typeof settingsTab) => {
    if (!clientId) {
      showBanner("Unable to identify client to update.", true);
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    let payload: Record<string, any> = {};

    if (tab === 'profile') {
      if (useCustomKey && !customKey.trim()) {
        showBanner('Please enter a custom encryption key or disable key protection', true);
        setSaving(false);
        return;
      }

      if (useCustomKey) {
        setCustomProfileKey(customKey);
      } else {
        setCustomProfileKey(null);
      }

      payload = {
        first_name: firstName,
        last_name: lastName,
        use_custom_key: useCustomKey,
        date_of_birth: dob,
        height: heightValue,
        weight: weightValue,
        shipping_street: shippingStreet,
        shipping_city: shippingCity,
        shipping_state: shippingState,
        shipping_zip: shippingZip,
        shipping_country: shippingCountry,
      };
      if (securityQuestion) {
        payload.security_question = securityQuestion;
      }
      if (securityAnswer.trim()) {
        payload.security_answer = securityAnswer.trim();
      }
    } else if (tab === 'payment') {
      payload = {
        billing_street: billingStreet,
        billing_city: billingCity,
        billing_state: billingState,
        billing_zip: billingZip,
      };
    } else if (tab === 'health') {
      payload = { healthConditions };
    } else if (tab === 'dietary') {
      payload = { allergies, dietary_preferences: dietaryPreferences };
    } else if (tab === 'goals') {
      payload = { nutritional_goal: nutritionalGoal, fitness_goal: fitnessGoal };
    }

    try {
      await updateClient(clientId, payload);
      dispatch({ type: 'UPDATE_REGISTRATION', payload });
      showBanner('Successfully updated!');
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setSuccessMsg('');
        navigate('/profile/settings');
      }, 1500);
    } catch {
      // Not logged: the API error body echoes the submitted PHI.
      showBanner("Failed to update. Please try again.", true);
    } finally {
      setSaving(false);
    }
  };

  const handleBackNavigation = () => {
    if (settingsTab === 'menu') {
      navigate('/profile');
    } else {
      navigate('/profile/settings');
    }
  };

  const renderBanner = () => {
    if (errorMsg) {
      return (
        <div className="error-banner" role="alert" style={{ marginBottom: 'var(--sp-4)' }}>
          <AlertCircle size={18} aria-hidden="true" />
          {errorMsg}
        </div>
      );
    }
    if (successMsg) {
      return (
        <div className="error-banner" role="status" style={{ marginBottom: 'var(--sp-4)', background: 'var(--optimal-soft)', color: 'var(--optimal)' }}>
          <CheckCircle size={18} aria-hidden="true" />
          {successMsg}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="screen screen--nav">
      <header className="app-header">
        <button type="button" className="icon-btn icon-btn--plain" onClick={handleBackNavigation} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <h1 className="app-header__title">
          {settingsTab === 'menu' ? 'Settings' : 
           settingsTab === 'profile' ? 'Profile' :
           settingsTab === 'payment' ? 'Billing' :
           settingsTab === 'health' ? 'Health' :
           settingsTab === 'dietary' ? 'Dietary' : 'Goals'}
        </h1>
        <span />
      </header>

      <main className="container stack" style={{ paddingTop: 'var(--sp-4)' }}>
        {renderBanner()}

        {settingsTab === 'menu' && (
          <div className="stack-lg">
            <section>
              <h2 className="section-label" style={{ marginBottom: 'var(--sp-2)' }}>Personal Settings</h2>
              <div className="card card--flush">
                <ul className="list">
                  <li>
                    <button type="button" className="list__row" onClick={() => navigate('/profile/settings?tab=profile')}>
                      <span className="icon-btn icon-btn--plain" aria-hidden="true">
                         <User size={18} className="text-secondary" />
                      </span>
                      <span className="list__body">
                         <span className="list__title">Personal Profile</span>
                         <span className="list__meta">Name, DOB, height, weight</span>
                      </span>
                      <ChevronRight size={18} className="list__chevron" aria-hidden="true" />
                    </button>
                  </li>
                  <li>
                    <button type="button" className="list__row" onClick={() => navigate('/profile/settings?tab=health')}>
                      <span className="icon-btn icon-btn--plain" aria-hidden="true">
                         <Heart size={18} className="text-secondary" />
                      </span>
                      <span className="list__body">
                         <span className="list__title">Health Conditions</span>
                         <span className="list__meta">Manage chronic conditions</span>
                      </span>
                      <ChevronRight size={18} className="list__chevron" aria-hidden="true" />
                    </button>
                  </li>
                  <li>
                    <button type="button" className="list__row" onClick={() => navigate('/profile/settings?tab=dietary')}>
                      <span className="icon-btn icon-btn--plain" aria-hidden="true">
                         <Apple size={18} className="text-secondary" />
                      </span>
                      <span className="list__body">
                         <span className="list__title">Dietary Preferences</span>
                         <span className="list__meta">Allergies and diet methods</span>
                      </span>
                      <ChevronRight size={18} className="list__chevron" aria-hidden="true" />
                    </button>
                  </li>
                  <li>
                    <button type="button" className="list__row" onClick={() => navigate('/profile/settings?tab=goals')}>
                      <span className="icon-btn icon-btn--plain" aria-hidden="true">
                         <Target size={18} className="text-secondary" />
                      </span>
                      <span className="list__body">
                         <span className="list__title">Targets & Goals</span>
                         <span className="list__meta">Dietary: {dietaryPreferences} | Fitness: {fitnessGoal}</span>
                      </span>
                      <ChevronRight size={18} className="list__chevron" aria-hidden="true" />
                    </button>
                  </li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="section-label" style={{ marginBottom: 'var(--sp-2)' }}>Financial Settings</h2>
              <div className="card card--flush">
                 <ul className="list">
                  <li>
                    <button type="button" className="list__row" onClick={() => navigate('/profile/settings?tab=payment')}>
                      <span className="icon-btn icon-btn--plain" aria-hidden="true">
                         <CreditCard size={18} className="text-secondary" />
                      </span>
                      <span className="list__body">
                         <span className="list__title">Billing & Payment Info</span>
                         <span className="list__meta">Billing address and saved cards</span>
                      </span>
                      <ChevronRight size={18} className="list__chevron" aria-hidden="true" />
                    </button>
                  </li>
                 </ul>
              </div>
            </section>

            <button type="button" className="btn btn--danger btn--block" onClick={handleLogout}>
              <LogOut size={18} aria-hidden="true" /> Logout Account
            </button>
          </div>
        )}

        {settingsTab === 'profile' && (
          <div className="stack fade-in">
            <p className="text-secondary">Update your fundamental metabolic parameters below.</p>
            
            <section className="card stack">
              <div className="field">
                <label htmlFor="firstName" className="field__label">First Name</label>
                <input id="firstName" type="text" className="input" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="lastName" className="field__label">Last Name</label>
                <input id="lastName" type="text" className="input" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>

              <div className="field" style={{ borderTop: '1px solid var(--divider)', paddingTop: 'var(--sp-4)' }}>
                <label className="row" style={{ cursor: 'pointer' }}>
                  <input type="checkbox" checked={useCustomKey} onChange={(e) => setUseCustomKey(e.target.checked)} style={{ width: 18, height: 18 }} />
                  <span className="field__label" style={{ margin: 0 }}>Protect name with a custom key</span>
                </label>
                {useCustomKey && (
                  <div className="field" style={{ marginTop: 'var(--sp-2)' }}>
                    <label htmlFor="customKey" className="field__label">Profile Encryption Key (Passphrase)</label>
                    <input id="customKey" type="password" placeholder="Enter Key..." className="input" value={customKey} onChange={(e) => setCustomKey(e.target.value)} />
                    <span className="field__hint">Keep this key safe. Your name cannot be recovered if you lose it.</span>
                  </div>
                )}
              </div>

              <div className="field">
                <label htmlFor="dob" className="field__label">Date of Birth</label>
                <input id="dob" type="date" className="input" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="height" className="field__label">Height (inches)</label>
                <input id="height" type="number" className="input" value={heightValue} onChange={e => setHeightValue(parseInt(e.target.value) || 0)} />
                <span className="field__hint">Hint: 5 ft 8 in = 68 inches</span>
              </div>
              <div className="field">
                <label htmlFor="weight" className="field__label">Weight (lbs)</label>
                <input id="weight" type="number" className="input" value={weightValue} onChange={e => setWeightValue(parseInt(e.target.value) || 0)} />
              </div>
            </section>

            <section className="card stack">
              <h2 className="card__title">Security Recovery</h2>
              <div className="field">
                <label htmlFor="secQ" className="field__label">Security Question</label>
                <select id="secQ" className="select" value={securityQuestion} onChange={e => setSecurityQuestion(e.target.value)}>
                  <option value="">Select Security Question...</option>
                  <option value="PET">What was the name of your first pet?</option>
                  <option value="MOTHER">What is your mother's maiden name?</option>
                  <option value="CITY">In what city were you born?</option>
                  <option value="SCHOOL">What was the name of your first school?</option>
                  <option value="CAR">What was the make of your first car?</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="secA" className="field__label">Security Answer</label>
                <input id="secA" type="text" className="input" placeholder="Enter new answer to update" value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} />
              </div>
            </section>

            <section className="card stack">
              <h2 className="card__title">Shipping Address</h2>
              <div className="field">
                <label htmlFor="shipStreet" className="field__label">Street Address</label>
                <input id="shipStreet" type="text" className="input" value={shippingStreet} onChange={e => setShippingStreet(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="shipCity" className="field__label">City</label>
                <input id="shipCity" type="text" className="input" value={shippingCity} onChange={e => setShippingCity(e.target.value)} />
              </div>
              <div className="row">
                <div className="field spacer">
                  <label htmlFor="shipState" className="field__label">State</label>
                  <input id="shipState" type="text" className="input" value={shippingState} onChange={e => setShippingState(e.target.value)} />
                </div>
                <div className="field spacer">
                  <label htmlFor="shipZip" className="field__label">Zip Code</label>
                  <input id="shipZip" type="text" className="input" value={shippingZip} onChange={e => setShippingZip(e.target.value)} />
                </div>
              </div>
              <div className="field">
                <label htmlFor="shipCountry" className="field__label">Country</label>
                <input id="shipCountry" type="text" className="input" value={shippingCountry} onChange={e => setShippingCountry(e.target.value)} />
              </div>
            </section>

            <button type="button" className="btn btn--primary btn--block" onClick={() => handleSaveSubForm('profile')} disabled={saving} aria-busy={saving}>
              {saving ? 'Saving...' : 'Save Profile Details'}
            </button>
          </div>
        )}

        {settingsTab === 'payment' && (
          <div className="stack fade-in">
            <p className="text-secondary">Manage credit card details and billing location defaults.</p>
            
            <section className="card stack">
              <h2 className="card__title">Payment method</h2>
              {cardLastFour ? (
                <div className="card card--inset row">
                  <div className="icon-btn icon-btn--plain" aria-hidden="true">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <p className="text-body" style={{ fontWeight: 600 }}>{cardBrand || 'Card'} •••• {cardLastFour}</p>
                    <p className="text-label text-tertiary">
                      {expiryMonth && expiryYear ? `Expires ${String(expiryMonth).padStart(2, '0')}/${expiryYear}` : 'Saved payment method'}
                      {cardholderName ? ` · ${cardholderName}` : ''}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-secondary text-label">
                  No saved payment method. Your card is securely stored by our payment processor the next time you check out.
                </p>
              )}
            </section>

            <section className="card stack">
              <h2 className="card__title">Billing Address</h2>
              <div className="field">
                <label htmlFor="billStreet" className="field__label">Street Address</label>
                <input id="billStreet" type="text" className="input" value={billingStreet} onChange={e => setBillingStreet(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="billCity" className="field__label">City</label>
                <input id="billCity" type="text" className="input" value={billingCity} onChange={e => setBillingCity(e.target.value)} />
              </div>
              <div className="row">
                <div className="field spacer">
                  <label htmlFor="billState" className="field__label">State</label>
                  <input id="billState" type="text" className="input" value={billingState} onChange={e => setBillingState(e.target.value)} />
                </div>
                <div className="field spacer">
                  <label htmlFor="billZip" className="field__label">Zip Code</label>
                  <input id="billZip" type="text" className="input" value={billingZip} onChange={e => setBillingZip(e.target.value)} />
                </div>
              </div>
            </section>

            <button type="button" className="btn btn--primary btn--block" onClick={() => handleSaveSubForm('payment')} disabled={saving} aria-busy={saving}>
              {saving ? 'Saving...' : 'Save Billing Details'}
            </button>
          </div>
        )}

        {settingsTab === 'health' && (
          <div className="stack fade-in">
            <p className="text-secondary">Manage your relevant chronic symptoms and metabolic histories.</p>
            <section className="card stack">
              <div className="field">
                <label htmlFor="healthCond" className="field__label">Clinical Conditions & Symptoms</label>
                <textarea id="healthCond" className="textarea" value={healthConditions} onChange={(e) => setHealthConditions(e.target.value)} placeholder="E.g. joint discomfort, insulin resistance, none..." />
              </div>
            </section>
            <button type="button" className="btn btn--primary btn--block" onClick={() => handleSaveSubForm('health')} disabled={saving} aria-busy={saving}>
              {saving ? 'Saving...' : 'Save Health Conditions'}
            </button>
          </div>
        )}

        {settingsTab === 'dietary' && (
          <div className="stack fade-in">
            <p className="text-secondary">Define food limitations and dietary preferences for Omiver AI filters.</p>
            <section className="card stack">
              <div className="field">
                <label htmlFor="dietPref" className="field__label">Dietary Intake Style</label>
                <select id="dietPref" className="select" value={dietaryPreferences} onChange={e => setDietaryPreferences(e.target.value)}>
                  <option value="Balanced">Balanced / General</option>
                  <option value="Keto">Ketogenic (Keto)</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Paleo">Paleo</option>
                  <option value="Low-Carb">Low-Carb / Low-Sugar</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="allergies" className="field__label">Allergies & Sensitivities</label>
                <textarea id="allergies" className="textarea" value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="E.g. Gluten, shellfish, milk, none..." />
              </div>
            </section>
            <button type="button" className="btn btn--primary btn--block" onClick={() => handleSaveSubForm('dietary')} disabled={saving} aria-busy={saving}>
              {saving ? 'Saving...' : 'Save Dietary Information'}
            </button>
          </div>
        )}

        {settingsTab === 'goals' && (
          <div className="stack fade-in">
            <p className="text-secondary">Define what physical and metabolic goals you want Omiver to prioritize.</p>
            <section className="card stack">
              <div className="field">
                <label htmlFor="nutGoal" className="field__label">Nutrition Goals</label>
                <textarea id="nutGoal" className="textarea" value={nutritionalGoal} onChange={(e) => setNutritionalGoal(e.target.value)} placeholder="E.g., Increase lean protein absorption, control blood sugars..." />
              </div>
              <div className="field">
                <label htmlFor="fitGoal" className="field__label">Fitness & Exercise Goals</label>
                <textarea id="fitGoal" className="textarea" value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)} placeholder="E.g., Build leg hypertrophy, boost VO2 Max, lose visceral fat..." />
              </div>
            </section>
            <button type="button" className="btn btn--primary btn--block" onClick={() => handleSaveSubForm('goals')} disabled={saving} aria-busy={saving}>
              {saving ? 'Saving...' : 'Save Targets & Goals'}
            </button>
          </div>
        )}

      </main>

      <BottomNav active="profile" />
    </div>
  );
};

export default ProfileSettingsScreen;
