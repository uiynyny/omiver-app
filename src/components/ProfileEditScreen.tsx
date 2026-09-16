import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { updateClient } from '../api/user';

const ProfileEditScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const reg = state.registration;
  const clientId = state.auth.clientId || reg.user_id;

  const [firstName, setFirstName] = useState(reg.first_name ?? '');
  const [lastName, setLastName] = useState(reg.last_name ?? '');
  const [dob, setDob] = useState(reg.date_of_birth ?? '');
  const [height, setHeight] = useState<number>(reg.height ?? 68);
  const [weight, setWeight] = useState<number>(reg.weight ?? 0);

  const [healthConditions, setHealthConditions] = useState(reg.healthConditions ?? '');
  const [allergies, setAllergies] = useState(reg.allergies ?? '');
  const [dietaryPreferences, setDietaryPreferences] = useState(reg.dietary_preferences ?? '');
  const [nutritionalGoal, setNutritionalGoal] = useState(reg.nutritional_goal ?? '');
  const [fitnessGoal, setFitnessGoal] = useState(reg.fitness_goal ?? '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!clientId) {
      setError("Unable to identify user to save profile.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      first_name: firstName,
      last_name: lastName,
      date_of_birth: dob,
      height,
      weight,
      healthConditions,
      allergies,
      dietary_preferences: dietaryPreferences,
      nutritional_goal: nutritionalGoal,
      fitness_goal: fitnessGoal,
    };
    try {
      await updateClient(clientId, payload);
      dispatch({ type: 'UPDATE_REGISTRATION', payload });
      navigate('/profile');
    } catch {
      setError("Failed to update profile. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen">
      <header className="app-header">
        <button onClick={() => navigate('/profile')} className="icon-btn" aria-label="Back to profile">
          <ChevronLeft size={24} />
        </button>
        <h1 className="app-header__title">Edit Profile</h1>
        <div style={{ width: 44 }}></div>
      </header>
      
      <main className="container stack-lg" style={{ paddingBlock: 'var(--sp-6)' }}>
        {error && <div className="error-banner" role="alert">{error}</div>}
        
        <p className="text-secondary text-body">
          Update your profile information below. This helps us provide you with the most accurate recommendations.
        </p>

        <section className="card stack">
          <h2 className="section-title">Personal Information</h2>
          
          <div className="row">
            <div className="field spacer">
              <label htmlFor="firstName" className="field__label">First Name</label>
              <input id="firstName" type="text" className="input" placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="field spacer">
              <label htmlFor="lastName" className="field__label">Last Name</label>
              <input id="lastName" type="text" className="input" placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          
          <div className="field">
            <label htmlFor="dob" className="field__label">Date of Birth</label>
            <input id="dob" type="date" className="input" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>

          <div className="row">
            <div className="field spacer">
              <label htmlFor="heightFt" className="field__label">Height</label>
              <div className="row-between">
                <select id="heightFt" className="select" aria-label="Height feet" value={Math.floor(height / 12) || 5} onChange={(e) => {
                  const ft = parseInt(e.target.value) || 5;
                  const inch = height % 12;
                  setHeight(ft * 12 + inch);
                }}>
                  <option value={3}>3'</option>
                  <option value={4}>4'</option>
                  <option value={5}>5'</option>
                  <option value={6}>6'</option>
                  <option value={7}>7'</option>
                  <option value={8}>8'</option>
                </select>
                <select id="heightIn" className="select" aria-label="Height inches" value={height % 12} onChange={(e) => {
                  const ft = Math.floor(height / 12) || 5;
                  const inch = parseInt(e.target.value) || 0;
                  setHeight(ft * 12 + inch);
                }}>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>{i}''</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="field spacer">
              <label htmlFor="weight" className="field__label">Weight (lbs)</label>
              <input id="weight" type="number" className="input" value={weight || ''} onChange={(e) => setWeight(parseFloat(e.target.value))} />
            </div>
          </div>
        </section>
        
        <section className="card stack">
          <h2 className="section-title">Health & Diet</h2>
          
          <div className="field">
            <label htmlFor="healthConditions" className="field__label">Health Conditions</label>
            <textarea id="healthConditions" className="textarea" placeholder="List any health conditions..." value={healthConditions} onChange={(e) => setHealthConditions(e.target.value)} rows={3} />
          </div>
          
          <div className="field">
            <label htmlFor="allergies" className="field__label">Food Allergies & Sensitivities</label>
            <textarea id="allergies" className="textarea" placeholder="List any allergies..." value={allergies} onChange={(e) => setAllergies(e.target.value)} rows={2} />
          </div>
          
          <div className="field">
            <label htmlFor="dietaryPreferences" className="field__label">Dietary Preferences</label>
            <select id="dietaryPreferences" className="select" value={dietaryPreferences} onChange={(e) => setDietaryPreferences(e.target.value)}>
              <option value="">No specific preference</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Pescatarian">Pescatarian</option>
              <option value="Keto">Keto</option>
              <option value="Paleo">Paleo</option>
              <option value="Mediterranean">Mediterranean</option>
            </select>
          </div>
        </section>
        
        <section className="card stack">
          <h2 className="section-title">Your Goals</h2>
          
          <div className="field">
            <label htmlFor="nutritionalGoal" className="field__label">Nutrition Goals</label>
            <select id="nutritionalGoal" className="select" value={nutritionalGoal} onChange={(e) => setNutritionalGoal(e.target.value)}>
              <option value="">Select a goal</option>
              <option value="Weight loss">Weight loss</option>
              <option value="Weight gain">Weight gain</option>
              <option value="Maintain weight">Maintain weight</option>
              <option value="Eat healthier">Eat healthier</option>
              <option value="Manage medical condition">Manage medical condition</option>
            </select>
          </div>
          
          <div className="field">
            <label htmlFor="fitnessGoal" className="field__label">Fitness Goals</label>
            <select id="fitnessGoal" className="select" value={fitnessGoal} onChange={(e) => setFitnessGoal(e.target.value)}>
              <option value="">Select a goal</option>
              <option value="Build muscle">Build muscle</option>
              <option value="Improve endurance">Improve endurance</option>
              <option value="Increase flexibility">Increase flexibility</option>
              <option value="General fitness">General fitness</option>
              <option value="Train for event">Train for event</option>
            </select>
          </div>
        </section>
        
        <button className="btn btn--primary btn--block" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </main>
    </div>
  );
};

export default ProfileEditScreen;
