import { useNavigate } from 'react-router-dom';

const WelcomeScreen2 = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', gap: '20px' }}>
      <h1>This is the next Welcome Screen!</h1>
      <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', cursor: 'pointer' }}>Go Back</button>
    </div>
  );
};

export default WelcomeScreen2;