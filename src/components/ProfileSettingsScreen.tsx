import React, { useMemo, useState, useEffect } from 'react';
import './ProfileSettingsScreen.css';
import BottomNav from './BottomNav';
import { useAppContext } from '../context/AppContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, User, CreditCard, Heart, Target, LogOut, ChevronRight, Apple } from 'lucide-react';
import { clearAuthToken, logoutApi, clearPersistentLogin, updateClient } from '../api/user';
import omiver from '../assets/omiver.svg';

const ProfileSettingsScreen: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const reg = state.registration;
  const clientId = state.auth.clientId || reg.user_id;

  // Active settings tab state
  const [settingsTab, setSettingsTab] = useState<'menu' | 'profile' | 'payment' | 'health' | 'dietary' | 'goals' | null>('menu');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Handle deep-linking from query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'profile') setSettingsTab('profile');
    else if (tab === 'payment') setSettingsTab('payment');
    else if (tab === 'health') setSettingsTab('health');
    else if (tab === 'dietary') setSettingsTab('dietary');
    else if (tab === 'goals') setSettingsTab('goals');
    else setSettingsTab('menu');
  }, [location.search]);

  // Editing state fields
  const [firstName, setFirstName] = useState(reg.first_name ?? '');
  const [lastName, setLastName] = useState(reg.last_name ?? '');
  const [dob, setDob] = useState(reg.date_of_birth ?? '');
  const [heightValue, setHeightValue] = useState<number>(reg.height ?? 68);
  const [weightValue, setWeightValue] = useState<number>(reg.weight ?? 150);

  // Billing & Payment info
  const [cardholderName, setCardholderName] = useState(reg.cardholder_name ?? '');
  const [cardBrand, setCardBrand] = useState(reg.card_brand ?? '');
  const [cardLastFour, setCardLastFour] = useState(reg.card_last_four ?? '');
  const [billingStreet, setBillingStreet] = useState(reg.billing_street ?? '');
  const [billingCity, setBillingCity] = useState(reg.billing_city ?? '');
  const [billingState, setBillingState] = useState(reg.billing_state ?? '');
  const [billingZip, setBillingZip] = useState(reg.billing_zip ?? '');

  // Card Entry states
  const [isEditingCard, setIsEditingCard] = useState(!reg.card_last_four);
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState<number>(reg.expiry_month || 12);
  const [expiryYear, setExpiryYear] = useState<number>(reg.expiry_year || 2030);
  const [inputCardBrand, setInputCardBrand] = useState(reg.card_brand || 'Visa');

  // Synchronize state when registration data changes (e.g. after login or update)
  useEffect(() => {
    if (reg) {
      if (reg.first_name !== undefined) setFirstName(reg.first_name ?? '');
      if (reg.last_name !== undefined) setLastName(reg.last_name ?? '');
      if (reg.date_of_birth !== undefined) setDob(reg.date_of_birth ?? '');
      if (reg.height !== undefined) setHeightValue(reg.height ?? 68);
      if (reg.weight !== undefined) setWeightValue(reg.weight ?? 150);

      if (reg.cardholder_name !== undefined) setCardholderName(reg.cardholder_name ?? '');
      if (reg.card_brand !== undefined) {
        setCardBrand(reg.card_brand ?? '');
        setInputCardBrand(reg.card_brand || 'Visa');
      }
      if (reg.card_last_four !== undefined) {
        setCardLastFour(reg.card_last_four ?? '');
        setIsEditingCard(!reg.card_last_four);
      }
      if (reg.expiry_month !== undefined) setExpiryMonth(reg.expiry_month || 12);
      if (reg.expiry_year !== undefined) setExpiryYear(reg.expiry_year || 2030);
      if (reg.billing_street !== undefined) setBillingStreet(reg.billing_street ?? '');
      if (reg.billing_city !== undefined) setBillingCity(reg.billing_city ?? '');
      if (reg.billing_state !== undefined) setBillingState(reg.billing_state ?? '');
      if (reg.billing_zip !== undefined) setBillingZip(reg.billing_zip ?? '');
    }
  }, [reg]);

  // Health Conditions
  const [healthConditions, setHealthConditions] = useState(reg.healthConditions ?? '');
  
  // Dietary Info & Allergies
  const [allergies, setAllergies] = useState(reg.allergies ?? '');
  const [dietaryPreferences, setDietaryPreferences] = useState(reg.dietary_preferences ?? 'Balanced');

  // Goals
  const [nutritionalGoal, setNutritionalGoal] = useState(reg.nutritional_goal ?? '');
  const [fitnessGoal, setFitnessGoal] = useState(reg.fitness_goal ?? '');

  // Shipping Address on profile state fields
  const [shippingStreet, setShippingStreet] = useState(reg.shipping_street ?? '');
  const [shippingCity, setShippingCity] = useState(reg.shipping_city ?? '');
  const [shippingState, setShippingState] = useState(reg.shipping_state ?? '');
  const [shippingZip, setShippingZip] = useState(reg.shipping_zip ?? '');
  const [shippingCountry, setShippingCountry] = useState(reg.shipping_country ?? 'United States');

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // ignore
    }
    clearAuthToken();
    clearPersistentLogin();
    dispatch({ type: 'CLEAR_AUTH' });
    navigate('/login');
  };

  const handleSaveSubForm = async (tab: 'profile' | 'payment' | 'health' | 'dietary' | 'goals') => {
    if (!clientId) {
      alert("Unable to identify client to update.");
      return;
    }

    setSaving(true);
    let payload: Record<string, any> = {};

    if (tab === 'profile') {
      payload = {
        first_name: firstName,
        last_name: lastName,
        date_of_birth: dob,
        height: heightValue,
        weight: weightValue,
        shipping_street: shippingStreet,
        shipping_city: shippingCity,
        shipping_state: shippingState,
        shipping_zip: shippingZip,
        shipping_country: shippingCountry,
      };
    } else if (tab === 'payment') {
      const lastFour = cardNumber ? cardNumber.slice(-4) : (cardLastFour || '9999');
      const finalBrand = isEditingCard ? inputCardBrand : cardBrand;
      payload = {
        provider_notes: `Billing: ${cardholderName} | ${finalBrand} •••• ${lastFour} | ${billingStreet}, ${billingCity}, ${billingState} ${billingZip}`,
        cardholder_name: cardholderName,
        card_brand: finalBrand,
        card_last_four: lastFour,
        expiry_month: expiryMonth,
        expiry_year: expiryYear,
        billing_street: billingStreet,
        billing_city: billingCity,
        billing_state: billingState,
        billing_zip: billingZip,
      };
    } else if (tab === 'health') {
      payload = {
        healthConditions: healthConditions,
      };
    } else if (tab === 'dietary') {
      payload = {
        allergies: allergies,
        dietary_preferences: dietaryPreferences,
      };
    } else if (tab === 'goals') {
      payload = {
        nutritional_goal: nutritionalGoal,
        fitness_goal: fitnessGoal,
      };
    }

    try {
      await updateClient(clientId, payload);
      dispatch({
        type: 'UPDATE_REGISTRATION',
        payload,
      });
      setSuccessMsg('Successfully updated!');
      setTimeout(() => {
        setSuccessMsg('');
        navigate('/profile/settings');
      }, 1500);
    } catch (error) {
      console.error("Error saving changes:", error);
      alert("Failed to update. Please try again.");
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

  // Render Page Content
  return (
    <div className="settings-root">
      <header className="settings-header">
        <button className="settings-back-btn-arrow" onClick={handleBackNavigation}>
          <ArrowLeft size={24} color="#6b9b8a" />
        </button>
        <img src={omiver} alt="Omiver Logo" className="settings-header-logo" width={120} />
        <div style={{ width: 24 }} /> {/* Balance */}
      </header>

      <main className="settings-main-container">
        {settingsTab === 'menu' && (
          <div className="settings-menu-index">
            <h1 className="settings-page-title">App Settings</h1>
            
            <div className="settings-group">
              <h2 className="settings-group-header">Personal Settings</h2>
              
              <button className="settings-list-item" onClick={() => navigate('/profile/settings?tab=profile')}>
                <div className="settings-item-info">
                  <span className="settings-item-emoji"><User size={20} color="#6b9b8a" /></span>
                  <div>
                    <div className="settings-item-lbl">Personal Profile</div>
                    <div className="settings-item-sub">Name, date of birth, height, weight</div>
                  </div>
                </div>
                <ChevronRight size={18} color="#ccc" />
              </button>

              <button className="settings-list-item" onClick={() => navigate('/profile/settings?tab=health')}>
                <div className="settings-item-info">
                  <span className="settings-item-emoji"><Heart size={20} color="#6b9b8a" /></span>
                  <div>
                    <div className="settings-item-lbl">Health Conditions</div>
                    <div className="settings-item-sub">Manage your chronic conditions</div>
                  </div>
                </div>
                <ChevronRight size={18} color="#ccc" />
              </button>

              <button className="settings-list-item" onClick={() => navigate('/profile/settings?tab=dietary')}>
                <div className="settings-item-info">
                  <span className="settings-item-emoji"><Apple size={20} color="#d98252" /></span>
                  <div>
                    <div className="settings-item-lbl">Dietary Preferences</div>
                    <div className="settings-item-sub">Allergies and preferred diet methods</div>
                  </div>
                </div>
                <ChevronRight size={18} color="#ccc" />
              </button>

              <button className="settings-list-item" onClick={() => navigate('/profile/settings?tab=goals')}>
                <div className="settings-item-info">
                  <span className="settings-item-emoji"><Target size={20} color="#6b9b8a" /></span>
                  <div>
                    <div className="settings-item-lbl">Targets & Goals</div>
                    <div className="settings-item-sub">Fitness goals and nutrition goals</div>
                  </div>
                </div>
                <ChevronRight size={18} color="#ccc" />
              </button>
            </div>

            <div className="settings-group" style={{ marginTop: 24 }}>
              <h2 className="settings-group-header">Financial Settings</h2>
              
              <button className="settings-list-item" onClick={() => navigate('/profile/settings?tab=payment')}>
                <div className="settings-item-info">
                  <span className="settings-item-emoji"><CreditCard size={20} color="#8a4b7d" /></span>
                  <div>
                    <div className="settings-item-lbl">Billing & Payment Info</div>
                    <div className="settings-item-sub">Billing address and saved credit cards</div>
                  </div>
                </div>
                <ChevronRight size={18} color="#ccc" />
              </button>
            </div>

            <div className="logout-wrapper" style={{ marginTop: 36, display: 'flex', justifyContent: 'center' }}>
              <button className="settings-logout-btn" onClick={handleLogout}>
                <LogOut size={16} style={{ marginRight: 8 }} /> Logout Account
              </button>
            </div>
          </div>
        )}

        {/* Profile Edit Subform */}
        {settingsTab === 'profile' && (
          <div className="settings-subform-view">
            <h2>Personal Profile</h2>
            <p className="settings-subform-desc">Update your fundamental metabolic parameters below.</p>
            {successMsg && <div className="settings-toast-msg">{successMsg}</div>}
            
            <div className="settings-card-form">
              <div className="settings-field-box">
                <label>First Name</label>
                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
              </div>
              <div className="settings-field-box">
                <label>Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
              </div>
              <div className="settings-field-box">
                <label>Date of Birth</label>
                <input type="date" value={dob} onChange={e => setDob(e.target.value)} />
              </div>
              <div className="settings-field-box">
                <label>Height (inches)</label>
                <input type="number" value={heightValue} onChange={e => setHeightValue(parseInt(e.target.value) || 0)} />
                <span className="settings-sub-hint">Hint: 5 ft 8 in = 68 inches</span>
              </div>
              <div className="settings-field-box">
                <label>Weight (lbs)</label>
                <input type="number" value={weightValue} onChange={e => setWeightValue(parseInt(e.target.value) || 0)} />
              </div>

              <h3 style={{ margin: '12px 0 2px 0', fontSize: '0.95rem', color: '#555', borderTop: '1px solid #eee', paddingTop: '16px' }}>Preferred Shipping Address</h3>
              <div className="settings-field-box">
                <label>Street Address</label>
                <input type="text" value={shippingStreet} onChange={e => setShippingStreet(e.target.value)} placeholder="E.g. 123 Main St" />
              </div>
              <div className="settings-field-box">
                <label>City</label>
                <input type="text" value={shippingCity} onChange={e => setShippingCity(e.target.value)} placeholder="E.g. San Francisco" />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="settings-field-box" style={{ flex: 1 }}>
                  <label>State</label>
                  <input type="text" value={shippingState} onChange={e => setShippingState(e.target.value)} placeholder="E.g. CA" />
                </div>
                <div className="settings-field-box" style={{ flex: 1 }}>
                  <label>Zip Code</label>
                  <input type="text" value={shippingZip} onChange={e => setShippingZip(e.target.value)} placeholder="E.g. 94107" />
                </div>
              </div>
              <div className="settings-field-box">
                <label>Country</label>
                <input type="text" value={shippingCountry} onChange={e => setShippingCountry(e.target.value)} />
              </div>

              <button className="settings-action-save" onClick={() => handleSaveSubForm('profile')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile Details'}
              </button>
            </div>
          </div>
        )}

        {/* Payment Edit Subform */}
        {settingsTab === 'payment' && (
          <div className="settings-subform-view">
            <h2>Billing & Payment</h2>
            <p className="settings-subform-desc">Manage credit card details and billing location defaults.</p>
            {successMsg && <div className="settings-toast-msg">{successMsg}</div>}

            <div className="settings-card-form">
              {reg.card_last_four && !isEditingCard ? (
                <>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#555' }}>Active Credit Card</h3>
                  <div className="saved-card-capsule" style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fcfcfc', border: '1px solid #eee', borderRadius: 12, padding: 14, marginBottom: 20 }}>
                    <span style={{ fontSize: 24 }}>💳</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#333' }}>{cardBrand} •••• {cardLastFour}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>Expiry: {expiryMonth}/{expiryYear} | Owner: {cardholderName}</div>
                    </div>
                    <button 
                      onClick={() => {
                        setCardNumber('');
                        setIsEditingCard(true);
                      }}
                      style={{
                        background: '#f3f4f6',
                        border: 'none',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        color: '#4b5563'
                      }}
                    >
                      Update Card
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '0.95rem', color: '#555' }}>Enter Credit Card Details</h3>
                  <div className="settings-field-box">
                    <label>Cardholder Name</label>
                    <input type="text" value={cardholderName} onChange={e => setCardholderName(e.target.value)} placeholder="e.g. John Doe" />
                  </div>
                  <div className="settings-field-box">
                    <label>Card Number</label>
                    <input 
                      type="text" 
                      value={cardNumber} 
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))} 
                      placeholder="1234 5678 1234 5678" 
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                    <div className="settings-field-box" style={{ flex: 2 }}>
                      <label>Card Brand</label>
                      <select value={inputCardBrand} onChange={e => setInputCardBrand(e.target.value)} className="settings-subform-select">
                        <option value="Visa">Visa</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="Amex">American Express</option>
                        <option value="Discover">Discover</option>
                      </select>
                    </div>
                    <div className="settings-field-box" style={{ flex: 1 }}>
                      <label>Expiry Month</label>
                      <select value={expiryMonth} onChange={e => setExpiryMonth(parseInt(e.target.value))} className="settings-subform-select">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                          <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                        ))}
                      </select>
                    </div>
                    <div className="settings-field-box" style={{ flex: 1 }}>
                      <label>Expiry Year</label>
                      <select value={expiryYear} onChange={e => setExpiryYear(parseInt(e.target.value))} className="settings-subform-select">
                        {Array.from({ length: 11 }, (_, i) => 2026 + i).map(y => (
                          <option key={y} value={y}>{y}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  {reg.card_last_four && (
                    <button 
                      onClick={() => setIsEditingCard(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#6b9b8a',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        marginBottom: 16,
                        display: 'block',
                        padding: 0
                      }}
                    >
                      Cancel Update
                    </button>
                  )}
                </>
              )}

              <h3 style={{ margin: '15px 0 10px 0', fontSize: '0.95rem', color: '#555', borderTop: '1px solid #eee', paddingTop: '15px' }}>Billing Address</h3>
              <div className="settings-field-box">
                <label>Street Address</label>
                <input type="text" value={billingStreet} onChange={e => setBillingStreet(e.target.value)} />
              </div>
              <div className="settings-field-box">
                <label>City</label>
                <input type="text" value={billingCity} onChange={e => setBillingCity(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div className="settings-field-box" style={{ flex: 1 }}>
                  <label>State</label>
                  <input type="text" value={billingState} onChange={e => setBillingState(e.target.value)} />
                </div>
                <div className="settings-field-box" style={{ flex: 1 }}>
                  <label>Zip Code</label>
                  <input type="text" value={billingZip} onChange={e => setBillingZip(e.target.value)} />
                </div>
              </div>

              <button className="settings-action-save" onClick={() => handleSaveSubForm('payment')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Billing Details'}
              </button>
            </div>
          </div>
        )}

        {/* Health Conditions Subform */}
        {settingsTab === 'health' && (
          <div className="settings-subform-view">
            <h2>Health Conditions</h2>
            <p className="settings-subform-desc">Manage your relevant chronic symptoms and metabolic histories.</p>
            {successMsg && <div className="settings-toast-msg">{successMsg}</div>}

            <div className="settings-card-form">
              <div className="settings-field-box">
                <label>Clinical Conditions & Symptoms</label>
                <textarea
                  value={healthConditions}
                  onChange={(e) => setHealthConditions(e.target.value)}
                  placeholder="E.g. joint discomfort, insulin resistance, none..."
                  style={{ height: 120 }}
                />
              </div>

              <button className="settings-action-save" onClick={() => handleSaveSubForm('health')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Health Conditions'}
              </button>
            </div>
          </div>
        )}

        {/* Dietary Preferences Subform */}
        {settingsTab === 'dietary' && (
          <div className="settings-subform-view">
            <h2>Dietary & Allergies</h2>
            <p className="settings-subform-desc">Define food limitations and dietary preferences for Omiver AI filters.</p>
            {successMsg && <div className="settings-toast-msg">{successMsg}</div>}

            <div className="settings-card-form">
              <div className="settings-field-box">
                <label>Dietary Intake Style</label>
                <select value={dietaryPreferences} onChange={e => setDietaryPreferences(e.target.value)} className="settings-subform-select">
                  <option value="Balanced">Balanced / General</option>
                  <option value="Keto">Ketogenic (Keto)</option>
                  <option value="Mediterranean">Mediterranean</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="Paleo">Paleo</option>
                  <option value="Low-Carb">Low-Carb / Low-Sugar</option>
                </select>
              </div>

              <div className="settings-field-box">
                <label>Allergies & Sensitivities</label>
                <textarea
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  placeholder="E.g. Gluten, shellfish, milk, none..."
                  style={{ height: 100 }}
                />
              </div>

              <button className="settings-action-save" onClick={() => handleSaveSubForm('dietary')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Dietary Information'}
              </button>
            </div>
          </div>
        )}

        {/* Targets & Goals Subform */}
        {settingsTab === 'goals' && (
          <div className="settings-subform-view">
            <h2>Targets & Goals</h2>
            <p className="settings-subform-desc">Define what physical and metabolic goals you want Omiver to prioritize.</p>
            {successMsg && <div className="settings-toast-msg">{successMsg}</div>}

            <div className="settings-card-form">
              <div className="settings-field-box">
                <label>Nutrition Goals</label>
                <textarea
                  value={nutritionalGoal}
                  onChange={(e) => setNutritionalGoal(e.target.value)}
                  placeholder="E.g., Increase lean protein absorption, control blood sugars..."
                  style={{ height: 100 }}
                />
              </div>

              <div className="settings-field-box">
                <label>Fitness & Exercise Goals</label>
                <textarea
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value)}
                  placeholder="E.g., Build leg hypertrophy, boost VO2 Max, lose visceral fat..."
                  style={{ height: 100 }}
                />
              </div>

              <button className="settings-action-save" onClick={() => handleSaveSubForm('goals')} disabled={saving}>
                {saving ? 'Saving...' : 'Save Targets & Goals'}
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav active="profile" />
    </div>
  );
};

export default ProfileSettingsScreen;
