import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import './AccountTypeScreen.css';
import { useAppContext } from '../context/AppContext';

const PersonalInfoScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const personal = state.registration.personalInfo ?? {};
  const [firstName, setFirstName] = useState(personal.firstName ?? '');
  const [lastName, setLastName] = useState(personal.lastName ?? '');
  const [birthday, setBirthday] = useState(personal.birthday ?? '');
  const [biologicalSex, setBiologicalSex] = useState(personal.biologicalSex ?? 'Male');
  const [ethnicity, setEthnicity] = useState(personal.ethnicity ?? '');
  const [height, setHeight] = useState(personal.height ?? '');
  const [weight, setWeight] = useState(personal.weight ?? '');

  const handleContinue = () => {
    if (!firstName || !lastName || !birthday || !ethnicity || !biologicalSex || !height || !weight) {
      alert('Please fill in all required fields');
      return;
    }
    dispatch({
      type: 'UPDATE_REGISTRATION',
      payload: {
        personalInfo: { firstName, lastName, birthday, biologicalSex, height, weight, ethnicity },
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
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              className="form-input"
            />
          </div>

          <div className="input-group">
            <select
              value={biologicalSex}
              onChange={(e) => setBiologicalSex(e.target.value)}
              className="form-input form-select"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="ethnicity:"
              value={ethnicity}
              onChange={(e) => setEthnicity(e.target.value)}
              className="form-input"
            />
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
