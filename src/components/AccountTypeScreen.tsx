import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';

import './AccountTypeScreen.css';
import individualUserIllustration from '../assets/individual-user.svg';
import healthcareProviderIllustration from '../assets/healthcare-provider.svg';
import { useAppContext } from '../context/AppContext';

const AccountTypeScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [selectedType, setSelectedType] = useState<'individual' | 'healthcare' | null>(
    state.registration.accountType ?? null
  );

  const handleContinue = () => {
    if (!selectedType) {
      alert('Please select an account type');
      return;
    }
    dispatch({ type: 'UPDATE_REGISTRATION', payload: { accountType: selectedType } });
    if (selectedType === 'healthcare') {
      navigate('/register/provider-info');
    } else {
      navigate('/register/personal-info');
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
        <h2>Account type</h2>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '14%' }}></div>
      </div>

      <div className="registration-content">
        <h1 className="registration-title">
          Please select an <span className="highlight">Account type</span>
        </h1>

        <div className="account-type-options">
          <button
            className={`account-type-card ${selectedType === 'individual' ? 'selected' : ''}`}
            onClick={() => setSelectedType('individual')}
          >
            <div className="radio-circle">
              {selectedType === 'individual' && <div className="radio-dot"></div>}
            </div>
            <div className="account-type-illustration">
              <img src={individualUserIllustration} alt="Individual User" />
            </div>
            <p className="account-type-label">I'm an Individual User</p>
          </button>

          <button
            className={`account-type-card ${selectedType === 'healthcare' ? 'selected' : ''}`}
            onClick={() => setSelectedType('healthcare')}
          >
            <div className="radio-circle">
              {selectedType === 'healthcare' && <div className="radio-dot"></div>}
            </div>
            <div className="account-type-illustration">
              <img src={healthcareProviderIllustration} alt="Healthcare Provider" />
            </div>
            <p className="account-type-label">I'm a Healthcare Provider</p>
          </button>
        </div>

        <button onClick={handleContinue} className="primary-button">
          Continue <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default AccountTypeScreen;
