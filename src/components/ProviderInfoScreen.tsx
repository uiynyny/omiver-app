import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Stethoscope } from 'lucide-react';
import './AccountTypeScreen.css';
import './ProviderInfoScreen.css';
import { useAppContext } from '../context/AppContext';

const ProviderInfoScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [first_name, setFirstName] = useState(state.registration.first_name ?? '');
  const [last_name, setLastName] = useState(state.registration.last_name ?? '');

  const handleContinue = () => {
    if (!first_name.trim() || !last_name.trim()) {
      alert('Please enter your first and last name');
      return;
    }
    dispatch({
      type: 'UPDATE_REGISTRATION',
      payload: { first_name: first_name.trim(), last_name: last_name.trim() },
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
        <h2>Provider Profile</h2>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '50%' }}></div>
      </div>

      <div className="registration-content">
        <div className="provider-icon-wrapper">
          <div className="provider-icon-circle">
            <Stethoscope size={40} strokeWidth={1.5} />
          </div>
        </div>

        <h1 className="registration-title">
          What's your <span className="highlight">name?</span>
        </h1>
        <p className="registration-subtitle">
          That's all we need to get your provider account set up. We'll generate your unique patient referral link right after.
        </p>

        <div className="form-fields">
          <div className="input-group">
            <input
              id="provider-first-name"
              type="text"
              placeholder="First name"
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
              className="form-input"
              autoFocus
            />
          </div>

          <div className="input-group">
            <input
              id="provider-last-name"
              type="text"
              placeholder="Last name"
              value={last_name}
              onChange={(e) => setLastName(e.target.value)}
              className="form-input"
              onKeyDown={(e) => e.key === 'Enter' && handleContinue()}
            />
          </div>
        </div>

        <div className="button-group">
          <button id="provider-continue-btn" onClick={handleContinue} className="primary-button">
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

export default ProviderInfoScreen;
