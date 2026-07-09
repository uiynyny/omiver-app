import React, { useMemo } from 'react';
import './ProfileScreen.css';
import BottomNav from './BottomNav';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Target, Pencil, Settings } from 'lucide-react';
import omiver from '../assets/omiver.svg';

const ProfileScreen: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const reg = state.registration;

  const name = `${reg?.first_name || ''} ${reg?.last_name || ''}`.trim() || 'Omiver Individual';
  
  const age = useMemo(() => {
    if (!reg.date_of_birth) return 'N/A';
    const b = new Date(reg.date_of_birth);
    const diff = Date.now() - b.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25)) || 'N/A';
  }, [reg.date_of_birth]);

  const heightDisplay = useMemo(() => {
    const h = reg?.height;
    if (!h) return `5 ft 3 in`;
    const feet = Math.floor(h / 12);
    const inches = h % 12;
    return `${feet} ft ${inches} in`;
  }, [reg?.height]);

  const weightDisplay = reg?.weight ? `${reg.weight} lbs` : '150 lbs';

  return (
    <div className="profile-root">
      <header className="home-header" style={{ display: 'flex', justifyContent: 'center', padding: '16px 20px', alignItems: 'center' }}>
        <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
      </header>

      <main className="profile-main">
        {/* Profile Card */}
        <section className="card">
          <div className="profile-summary-header">
            <div className="profile-summary-title">
              <User color="#6b9b8a" /> 
              <div style={{ fontSize: 18, fontWeight: 700 }}>Profile Summary</div>
            </div>
          </div>
          <div className="summary-grid">
            <div className="summary-item">
              <div className="summary-label">Name</div>
              <div className="summary-value">{name}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Age</div>
              <div className="summary-value">{age}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Height</div>
              <div className="summary-value">{heightDisplay}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Weight</div>
              <div className="summary-value">{weightDisplay}</div>
            </div>
          </div>
        </section>

        {/* Health Conditions */}
        <section className="profile-section-block">
          <div className="section-title">
            <Heart color="#6b9b8a" /> 
            <p style={{ margin: 0 }}>Health Conditions</p>
          </div>
          <div className="section-content">{reg.healthConditions || 'None specified'}</div>
        </section>

        {/* Goals */}
        <section className="recommendation-section exercise-section" style={{ marginTop: 18 }}>
          <div className="section-title">
            <Target color="#6b9b8a" /> 
            <p style={{ margin: 0 }}>Your Targets & Goals</p>
          </div>
          <div className="section-content">
            <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>Nutrition Goal:</div>
            <div>{reg.nutritional_goal || 'None specified'}</div>
            <div style={{ height: 12 }} />
            <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>Fitness Goals:</div>
            <div>{reg.fitness_goal || 'None specified'}</div>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, marginBottom: 20 }}>
          <button className="logout-button" onClick={() => navigate('/profile/settings')} style={{ borderColor: '#6b9b8a', color: '#6b9b8a' }}>
            Go to Settings
          </button>
        </div>
      </main>

      <BottomNav active="profile" />
    </div>
  );
};

export default ProfileScreen;
