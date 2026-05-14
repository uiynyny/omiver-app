import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';
import { updateClient } from '../api/user';

const typicalityLevels = [
  { value: 1, label: 'Unusual' },
  { value: 2, label: 'Rarely' },
  { value: 3, label: 'Sometimes' },
  { value: 4, label: 'Often' },
  { value: 5, label: 'Always' },
];

const DietaryInfoScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [exerciseRecall, setExerciseRecall] = useState(state.registration.exercise_recall ?? '');
  const [typicality, setTypicality] = useState<number>(state.registration.dietary_typicality ?? 3);

  const [submitting, setSubmitting] = useState(false);

  const handleContinue = async () => {
    dispatch({
      type: 'UPDATE_REGISTRATION',
      payload: {
        exercise_recall: exerciseRecall,
        dietary_typicality: typicality,
      },
    });

    const clientId = state.auth.clientId;
    if (!clientId) {
      alert('Please sign in before submitting your recall information.');
      return;
    }

    setSubmitting(true);
    try {
      await updateClient(clientId, {
        exercise_recall: exerciseRecall,
        dietary_typicality: typicality,
      });
      navigate('/profile');
    } catch (error) {
      console.error('Failed to save recall information:', error);
      alert('Unable to save recall information right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
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
        <h2>Exercise Recall</h2>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '56%' }}></div>
      </div>

      <div className="registration-content">
        <h1 className="registration-title">
          Tell us about your <span className="highlight">exercise routine</span>
        </h1>

        <div className="form-fields">
          <div className="input-group">
            <textarea
              placeholder="24-hour exercise recall..."
              value={exerciseRecall}
              onChange={(e) => setExerciseRecall(e.target.value)}
              className="form-textarea"
              rows={5}
            />
          </div>

          <div className="input-group typicality-group">
            <label className="field-label">How typical is this for you?</label>
            <div className="form-select-group">
              <select
                className="form-input form-select"
                value={typicality}
                onChange={(e) => setTypicality(parseInt(e.target.value) || 3)}
              >
                {typicalityLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="button-group">
          <button onClick={handleContinue} className="primary-button" disabled={submitting}>
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

export default DietaryInfoScreen;
