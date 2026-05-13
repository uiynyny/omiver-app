import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';
import { checkReferralCode } from '../api/user';

const PersonalInfoScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [first_name, setFirstName] = useState(state.registration.first_name ?? '');
  const [last_name, setLastName] = useState(state.registration.last_name ?? '');
  const [date_of_birth, setDateOfBirth] = useState(state.registration.date_of_birth ?? '');
  const [gender, setGender] = useState(state.registration.gender ?? 'Male');
  const [ethnicity, setEthnicity] = useState(state.registration.ethnicity ?? '');
  const [height, setHeight] = useState<number>(state.registration.height ?? 0);
  const [weight, setWeight] = useState<number>(state.registration.weight ?? 0);
  const [referredByCode, setReferredByCode] = useState(state.registration.referredByCode ?? '');

  const handleContinue = () => {
    if (!first_name || !last_name || !date_of_birth || !ethnicity || !gender || !height || !weight || !referredByCode.trim()) {
      alert('Please fill in all required fields, including your referral code');
      return;
    }
    console.log('Validating referral code:', referredByCode);
    checkReferralCode(referredByCode).then((isValid) => {
      if (!isValid) {
        alert('Invalid referral code. Please check and try again.');
        return;
      }
    }).catch((error) => {
      console.error('Error validating referral code:', error);
      alert('An error occurred while validating the referral code. Please try again later.');
      return;
    });
    dispatch({
      type: 'UPDATE_REGISTRATION',
      payload: {
        first_name: first_name,
        last_name: last_name,
        date_of_birth,
        gender,
        ethnicity,
        height,
        weight,
        referredByCode: referredByCode.trim(),
      },
    });
    navigate('/register/health-conditions');
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
        <h2>Personal Information</h2>
      </header>

      <div className="progress-bar">
        <div className="progress-fill" style={{ width: '28%' }}></div>
      </div>

      <div className="registration-content">
        <h1 className="registration-title">
          Please complete <span className="highlight">your profile</span>
        </h1>

        <div className="form-fields">
          <div className="input-group">
            <input
              type="text"
              placeholder="Referral Code (Required):"
              value={referredByCode}
              onChange={(e) => setReferredByCode(e.target.value)}
              className="form-input"
              style={{ border: '1px solid #67997D' }}
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="First name:"
              value={first_name}
              onChange={(e) => setFirstName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="Last name:"
              value={last_name}
              onChange={(e) => setLastName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="input-group">
            <input
              type="date"
              placeholder="Birthday:"
              value={date_of_birth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="input-group">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="form-input form-select"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="input-group">
            <select
              value={ethnicity}
              onChange={(e) => setEthnicity(e.target.value)}
              className="form-input form-select"
            >
              <option value="" disabled>Select Ethnicity</option>
              <option value="White">White</option>
              <option value="Black or African American">Black or African American</option>
              <option value="Asian">Asian</option>
              <option value="Hispanic or Latino">Hispanic or Latino</option>
              <option value="American Indian or Alaska Native">American Indian or Alaska Native</option>
              <option value="Native Hawaiian or Other Pacific Islander">Native Hawaiian or Other Pacific Islander</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="input-group">
            <input
              type="number"
              placeholder="Height (inches):"
              value={height}
              onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              className="form-input"
            />
          </div>

          <div className="input-group">
            <input
              type="number"
              placeholder="Weight (lbs):"
              value={weight}
              onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="form-input"
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

export default PersonalInfoScreen;
