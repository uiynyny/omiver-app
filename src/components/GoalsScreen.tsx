import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';

const GoalsScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [weeklyRoutine, setWeeklyRoutine] = useState(state.registration.weekly_exercise_routine ?? '');
  const [exerciseDays, setExerciseDays] = useState(state.registration.exercise_days_per_week ?? '3');
  const [exerciseTypes, setExerciseTypes] = useState(state.registration.exercise_types ?? '');
  const [providerNotes, setProviderNotes] = useState(state.registration.provider_notes ?? '');
  const [preferenceMode, setPreferenceMode] = useState(state.registration.dietary_preference_mode ?? 'similar');
  const [preferredCuisines, setPreferredCuisines] = useState(state.registration.preferred_cuisines ?? '');
  const [avoidedCuisines, setAvoidedCuisines] = useState(state.registration.avoided_cuisines ?? '');

  const handleContinue = () => {
    dispatch({
      type: 'UPDATE_REGISTRATION',
      payload: {
        weekly_exercise_routine: weeklyRoutine,
        exercise_days_per_week: exerciseDays,
        exercise_types: exerciseTypes,
        provider_notes: providerNotes,
        dietary_preference_mode: preferenceMode,
        preferred_cuisines: preferredCuisines,
        avoided_cuisines: avoidedCuisines,
      },
    });
    navigate('/terms');
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="registration-screen">
      <header className="registration-header">
        <button onClick={handleBack} className="back-button">
          <ChevronLeft size={24} />
        </button>
        <h2>Your Goals</h2>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '70%' }}></div>
      </div>

      <div className="registration-content">
        <h1 className="registration-title">
          Tell us about your <span className="highlight">exercise routine</span>
        </h1>

        <div className="form-fields">
          <div className="input-group">
            <textarea
              placeholder="Describe your weekly exercise routine..."
              value={weeklyRoutine}
              onChange={(e) => setWeeklyRoutine(e.target.value)}
              className="form-textarea"
              rows={6}
            />
          </div>

          <div className="input-group">
            <label className="field-label">How many days per week do you usually exercise?</label>
            <input
              type="number"
              min="1"
              max="7"
              value={exerciseDays}
              onChange={(e) => setExerciseDays(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="input-group">
            <textarea
              placeholder="Exercise types (e.g. cardio, lifting, yoga, walking)"
              value={exerciseTypes}
              onChange={(e) => setExerciseTypes(e.target.value)}
              className="form-textarea"
              rows={4}
            />
          </div>

          <div className="input-group">
            <textarea
              placeholder="Provider notes or special considerations"
              value={providerNotes}
              onChange={(e) => setProviderNotes(e.target.value)}
              className="form-textarea"
              rows={4}
            />
          </div>

          <div className="input-group">
            <label className="field-label">Do you want recommendations that are similar to your current diet or different?</label>
            <select
              className="form-input form-select"
              value={preferenceMode}
              onChange={(e) => setPreferenceMode(e.target.value)}
            >
              <option value="similar">Similar to my current diet</option>
              <option value="different">Different from my current diet</option>
              <option value="balanced">A balance of both</option>
            </select>
          </div>

          <div className="input-group">
            <textarea
              placeholder="Preferred cuisines (e.g. Mediterranean, Korean, Mexican)"
              value={preferredCuisines}
              onChange={(e) => setPreferredCuisines(e.target.value)}
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="input-group">
            <textarea
              placeholder="Cuisines you avoid or dislike"
              value={avoidedCuisines}
              onChange={(e) => setAvoidedCuisines(e.target.value)}
              className="form-textarea"
              rows={3}
            />
          </div>
        </div>

        <div className="button-group">
          <button onClick={handleContinue} className="primary-button">
            Continue <ChevronRight size={20} />
          </button>
          <button onClick={handleBack} className="secondary-button">
            <ChevronLeft size={20} /> Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default GoalsScreen;
