import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';

const HealthConditionsScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [healthConditions, setHealthConditions] = useState(state.registration.healthConditions ?? '');

  const handleContinue = () => {
    dispatch({ type: 'UPDATE_REGISTRATION', payload: { healthConditions } });
    navigate('/register/dietary-info');
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
        <h2>Health Conditions</h2>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '42%' }}></div>
      </div>

      <div className="registration-content">
        <h1 className="registration-title">
          Help us understand your <span className="highlight">health history</span>
        </h1>

        <div className="form-fields">
          <div className="input-group">
            <textarea
              placeholder="List any chronic conditions, diseases, or health concerns...&#10;&#10;&#10;Leave blank if none apply"
              value={healthConditions}
              onChange={(e) => setHealthConditions(e.target.value)}
              className="form-textarea"
              rows={10}
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

export default HealthConditionsScreen;
