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

  const handleBack = () => {
    navigate(-1);
  };

  const typicalityLevels = [
    { value: 1, label: 'Unusual' },
    { value: 2, label: 'Rarely' },
    { value: 3, label: 'Sometimes' },
    { value: 4, label: 'Often' },
    { value: 5, label: 'Always' },
  ];

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
          <div className="input-group" style={{ flexDirection: 'column' }}>
            <textarea
              placeholder="Describe your weekly exercise routine... *"
              value={weeklyRoutine}
              onChange={(e) => {
                setWeeklyRoutine(e.target.value);
                if (errors.weeklyRoutine) setErrors(prev => ({ ...prev, weeklyRoutine: undefined }));
              }}
              className={`form-textarea ${errors.weeklyRoutine ? 'error' : ''}`}
              rows={6}
            />
            {errors.weeklyRoutine && <span className="error-text">{errors.weeklyRoutine}</span>}
          </div>

          <div className="input-group">
            <label className="field-label">How many days per week do you usually exercise?</label>
            <select
              className="form-input form-select"
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

          <div className="input-group" style={{ flexDirection: 'column' }}>
            <textarea
              placeholder="Exercise types (e.g. cardio, lifting, yoga, walking) *"
              value={exerciseTypes}
              onChange={(e) => {
                setExerciseTypes(e.target.value);
                if (errors.exerciseTypes) setErrors(prev => ({ ...prev, exerciseTypes: undefined }));
              }}
              className={`form-textarea ${errors.exerciseTypes ? 'error' : ''}`}
              rows={4}
            />
            {errors.exerciseTypes && <span className="error-text">{errors.exerciseTypes}</span>}
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
          {/* Dietary questions moved to a separate screen */}
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
