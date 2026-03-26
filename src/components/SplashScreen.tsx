
import { useNavigate } from 'react-router-dom';
import './SplashScreen.css';
import omiverLogo from '../assets/omiver.svg';

const SplashScreen = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    navigate('/login');
  };

  return (
    <div className={`welcome-screen splash`} onClick={handleNext} style={{ cursor: 'pointer' }}>
      <img src={omiverLogo} alt="Omiver Logo" className="omiver-logo" />
    </div> 
  );
};

export default SplashScreen;
