import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import './Onboarding.css';
import { useAppContext } from '../context/AppContext';

const GoalsScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [weeklyRoutine, setWeeklyRoutine] = useState(state.registration.weekly_exercise_routine ?? '');
  const [exerciseDays, setExerciseDays] = useState(state.registration.exercise_days_per_week ?? '3');
  const [exerciseTypes, setExerciseTypes] = useState(state.registration.exercise_types ?? '');
  const [providerNotes, setProviderNotes] = useState(state.registration.provider_notes ?? '');
  const [errors, setErrors] = useState<{ weeklyRoutine?: string; exerciseTypes?: string }>({});

  const handleContinue = () => {
    const newErrors: { weeklyRoutine?: string; exerciseTypes?: string } = {};
    if (!weeklyRoutine.trim()) {
      newErrors.weeklyRoutine = 'Weekly exercise routine description is required';
    }
    if (!exerciseTypes.trim()) {
      newErrors.exerciseTypes = 'Please specify the types of exercises you perform';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    dispatch({
      type: 'UPDATE_REGISTRATION',
      payload: {
        weekly_exercise_routine: weeklyRoutine,
        exercise_days_per_week: exerciseDays,
        exercise_types: exerciseTypes,
        provider_notes: providerNotes,
      },
    });
    // After saving exercise-related goals, continue to the dietary questionnaire
    navigate('/register/dietary');
  };

  const typicalityLevels = [
    { value: 1, label: 'Unusual' },
    { value: 2, label: 'Rarely' },
    { value: 3, label: 'Sometimes' },
    { value: 4, label: 'Often' },
    { value: 5, label: 'Always' },
  ];

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
          <div className="progress__fill" style={{ width: '75%' }}></div>
        </div>
      </div>

      <main className="wizard__body" aria-live="polite">
        <div className="wizard__step-container">
          <div className="fade-in">
            <div className="wizard__step-header">
              <span className="section-label">Step 3 of 4</span>
              <h1 className="section-title">Your Goals</h1>
              <p className="text-secondary">Tell us about your exercise routine.</p>
            </div>
            
            <div className="wizard__step-content stack">
              <div className="field">
                <label className="field__label" htmlFor="weeklyRoutine">Weekly exercise routine</label>
                <textarea
                  id="weeklyRoutine"
                  placeholder="Describe your weekly exercise routine..."
                  value={weeklyRoutine}
                  onChange={(e) => {
                    setWeeklyRoutine(e.target.value);
                    if (errors.weeklyRoutine) setErrors(prev => ({ ...prev, weeklyRoutine: undefined }));
                  }}
                  className="textarea"
                  aria-invalid={!!errors.weeklyRoutine}
                />
                {errors.weeklyRoutine && <span className="field__error" role="alert">{errors.weeklyRoutine}</span>}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="exerciseDays">How many days per week do you usually exercise?</label>
                <select
                  id="exerciseDays"
                  className="select"
                  value={exerciseDays}
                  onChange={(e) => setExerciseDays(e.target.value)}
                >
                  {typicalityLevels.map((level) => (
                    <option key={level.value} value={String(level.value)}>
                      {level.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label className="field__label" htmlFor="exerciseTypes">Exercise types</label>
                <textarea
                  id="exerciseTypes"
                  placeholder="e.g. cardio, lifting, yoga, walking"
                  value={exerciseTypes}
                  onChange={(e) => {
                    setExerciseTypes(e.target.value);
                    if (errors.exerciseTypes) setErrors(prev => ({ ...prev, exerciseTypes: undefined }));
                  }}
                  className="textarea"
                  aria-invalid={!!errors.exerciseTypes}
                />
                {errors.exerciseTypes && <span className="field__error" role="alert">{errors.exerciseTypes}</span>}
              </div>

              <div className="field">
                <label className="field__label" htmlFor="providerNotes">Provider notes or special considerations</label>
                <textarea
                  id="providerNotes"
                  placeholder="Optional"
                  value={providerNotes}
                  onChange={(e) => setProviderNotes(e.target.value)}
                  className="textarea"
                />
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

export default GoalsScreen;
