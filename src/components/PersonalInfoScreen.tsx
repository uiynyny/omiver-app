import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';

const PersonalInfoScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const [firstName, setFirstName] = useState(state.registration.firstName ?? '');
  const [lastName, setLastName] = useState(state.registration.lastName ?? '');
  const [date_of_birth, setDateOfBirth] = useState(state.registration.date_of_birth ?? '');
  const [gender, setGender] = useState(state.registration.gender ?? 'Male');
  const [ethnicity, setEthnicity] = useState(state.registration.ethnicity ?? '');
  const [height, setHeight] = useState(state.registration.height ?? '');
  const [weight, setWeight] = useState(state.registration.weight ?? '');
  const handleContinue = () => {
    if (!firstName || !lastName || !date_of_birth || !ethnicity || !gender || !height || !weight) {
      alert('Please fill in all required fields');
      return;
    }
    dispatch({
      type: 'UPDATE_REGISTRATION',
      payload: {
        firstName, lastName, date_of_birth, gender, ethnicity, height, weight,
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
              placeholder="First name:"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="Last name:"
              value={lastName}
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
              onChange={(e) => setHeight(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="input-group">
            <input
              type="number"
              placeholder="Weight (lbs):"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
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
