import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { updateClient } from '../api/user';
import './AccountTypeScreen.css'; // Reuse form styles

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

  const handleSave = async () => {
    if (!clientId) {
      alert("Unable to identify user to save profile.");
      return;
    }

    setSaving(true);

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
      dispatch({
        type: 'UPDATE_REGISTRATION',
        payload,
      });
      navigate('/profile');
    } catch (error) {
      console.error("Error updating profile:", error);
      alert("Failed to update profile. Please try again later.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="registration-screen" style={{ minHeight: '100vh', paddingBottom: '20px' }}>
      <header className="registration-header">
        <button onClick={() => navigate('/profile')} className="back-button">
          <ChevronLeft size={24} />
        </button>
        <h2>Edit Profile</h2>
      </header>

      <div className="registration-content" style={{ padding: '1rem', flex: 'none' }}>
        <p style={{ color: '#666', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          Update your profile information below. This helps us provide you with the most accurate recommendations.
        </p>
        <div className="form-fields">
          <h3 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#67997D' }}>Personal Information</h3>

          <div className="input-row" style={{ display: 'flex', gap: '5rem', width: '100%' }}>
            <div className="input-group" style={{ flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label style={{ fontSize: '0.9rem', color: '#555' }}>First Name</label>
              <input
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="form-input"
              />
            </div>

            <div className="input-group" style={{ flexDirection: 'column', gap: '8px', flex: 1 }}>
              <label style={{ fontSize: '0.9rem', color: '#555' }}>Last Name</label>
              <input
                type="text" 
                placeholder="Last name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="input-group" style={{ flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: '#555' }}>Date of Birth</label>
            <input
              type="date"
              placeholder="Birthday"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="input-row">
            <div className="input-group input-with-suffix">
              <div className="input-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="input-prefix" style={{ position: 'static', transform: 'none', marginRight: '4px' }}>Height:</span>
                <select
                  value={Math.floor(height / 12) || 5}
                  onChange={(e) => {
                    const ft = parseInt(e.target.value) || 5;
                    const inch = height % 12;
                    setHeight(ft * 12 + inch);
                  }}
                  className="form-input form-select"
                  style={{ paddingLeft: '0.75rem', paddingRight: '2rem', flex: 1 }}
                >
                  <option value={3}>3'</option>
                  <option value={4}>4'</option>
                  <option value={5}>5'</option>
                  <option value={6}>6'</option>
                  <option value={7}>7'</option>
                  <option value={8}>8'</option>
                </select>
                <select
                  value={height % 12}
                  onChange={(e) => {
                    const ft = Math.floor(height / 12) || 5;
                    const inch = parseInt(e.target.value) || 0;
                    setHeight(ft * 12 + inch);
                  }}
                  className="form-input form-select"
                  style={{ paddingLeft: '0.75rem', paddingRight: '2rem', flex: 1 }}
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}''
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group input-with-suffix">
              <div className="input-wrapper">
                <span className="input-prefix">Weight:</span>
                <input
                  type="number"
                  placeholder=""
                  value={weight || ''}
                  onChange={(e) => setWeight(parseFloat(e.target.value))}
                  className="form-input"
                />
                <span className="input-suffix">lbs</span>
              </div>
            </div>
          </div>

          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#67997D' }}>Health & Diet</h3>

          <div className="input-group" style={{ flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: '#555' }}>Health Conditions</label>
            <textarea
              placeholder="List any health conditions..."
              value={healthConditions}
              onChange={(e) => setHealthConditions(e.target.value)}
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="input-group" style={{ flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: '#555' }}>Food Allergies & Sensitivities</label>
            <textarea
              placeholder="List any allergies..."
              value={allergies}
              onChange={(e) => setAllergies(e.target.value)}
              className="form-textarea"
              rows={2}
            />
          </div>

          <div className="input-group" style={{ flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: '#555' }}>Dietary Preferences</label>
            <select
              value={dietaryPreferences}
              onChange={(e) => setDietaryPreferences(e.target.value)}
              className="form-input form-select"
            >
              <option value="">No specific preference</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Pescatarian">Pescatarian</option>
              <option value="Keto">Keto</option>
              <option value="Paleo">Paleo</option>
              <option value="Mediterranean">Mediterranean</option>
            </select>
          </div>

          <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem', color: '#67997D' }}>Your Goals</h3>

          <div className="input-group" style={{ flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: '#555' }}>Nutrition Goals</label>
            <select
              value={nutritionalGoal}
              onChange={(e) => setNutritionalGoal(e.target.value)}
              className="form-input form-select"
            >
              <option value="">Select a goal</option>
              <option value="Weight loss">Weight loss</option>
              <option value="Weight gain">Weight gain</option>
              <option value="Maintain weight">Maintain weight</option>
              <option value="Eat healthier">Eat healthier</option>
              <option value="Manage medical condition">Manage medical condition</option>
            </select>
          </div>

          <div className="input-group" style={{ flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.9rem', color: '#555' }}>Fitness Goals</label>
            <select
              value={fitnessGoal}
              onChange={(e) => setFitnessGoal(e.target.value)}
              className="form-input form-select"
            >
              <option value="">Select a goal</option>
              <option value="Build muscle">Build muscle</option>
              <option value="Improve endurance">Improve endurance</option>
              <option value="Increase flexibility">Increase flexibility</option>
              <option value="General fitness">General fitness</option>
              <option value="Train for event">Train for event</option>
            </select>
          </div>

        </div>

        <div className="button-group" style={{ marginTop: '1rem' }}>
          <button onClick={handleSave} disabled={saving} className="primary-button" style={{ background: '#67997D', color: '#fff', border: 'none', padding: '1rem', borderRadius: '12px', fontSize: '1.1rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileEditScreen;
