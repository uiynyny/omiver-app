import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';

const GoalsScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [nutritionGoals, setNutritionGoals] = useState(state.registration.nutritional_goal ?? '');
  const [fitnessGoals, setFitnessGoals] = useState(state.registration.fitness_goal ?? '');

  const handleContinue = () => {
    dispatch({ type: 'UPDATE_REGISTRATION', payload: { nutritional_goal: nutritionGoals, fitness_goal: fitnessGoals } });
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
          What are you hoping <span className="highlight">to achieve?</span>
        </h1>

        <div className="form-fields">
          <div className="input-group">
            <textarea
              placeholder="Nutrition Goals..."
              value={nutritionGoals}
              onChange={(e) => setNutritionGoals(e.target.value)}
              className="form-textarea"
              rows={6}
            />
          </div>

          <div className="input-group">
            <textarea
              placeholder="Fitness Goals..."
              value={fitnessGoals}
              onChange={(e) => setFitnessGoals(e.target.value)}
              className="form-textarea"
              rows={6}
            />
          </div>
        </div>

        <div className="button-group">
          <button onClick={handleContinue} className="primary-button">
            Finish <ChevronRight size={20} />
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
