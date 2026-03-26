import { useNavigate } from 'react-router-dom';

import omiverLogo from '../assets/omiver.svg';
import './WelcomeScreen.css';

const WelcomeScreen = () => {
  const navigate = useNavigate();

  const handleContinue = () => {
    navigate('/welcome-2');
  };

  return (
    <div className="welcome-container">
      <div className="top-section" style={{flex: '0 0 40vh'}}></div>
      <div className="bottom-card">
        <header className="welcome-header">
          <h1>Welcome to</h1>
          <img src={omiverLogo} alt="Omiver Logo" />
        </header>
        <img
          src="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=2070"
          alt="Team working"
          className="card-image"
        />
        <p className="welcome-paragraph">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.
        </p>
        <button className="continue-button" onClick={handleContinue}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default WelcomeScreen;