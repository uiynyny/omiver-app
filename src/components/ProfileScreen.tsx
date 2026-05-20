import React, { useMemo } from 'react'
import './ProfileScreen.css'
import BottomNav from './BottomNav';
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { User, Heart, Target, Apple, Pencil } from 'lucide-react'
import { clearAuthToken, logoutApi, clearPersistentLogin } from '../api/user'
import omiver from '../assets/omiver.svg'

const ProfileScreen: React.FC = () => {
  const { state, dispatch } = useAppContext()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // ignore network errors, still clear local state
    }
    clearAuthToken();
    clearPersistentLogin();
    dispatch({ type: 'CLEAR_AUTH' });
    navigate('/login');
  };

  const health = state?.registration?.healthConditions || 'None'
  const allergies = state?.registration?.allergies || 'None'
  const preferences = state?.registration?.dietary_preferences || 'None'
  const nutritional_goal = state?.registration?.nutritional_goal || 'None'
  const fitness_goal = state?.registration?.fitness_goal || 'None'
  const personal = state.registration;
  console.log("state", state)

  const name = `${state?.registration?.first_name || ''} ${state?.registration?.last_name || ''}`.trim() || ''
  const age = useMemo(() => {
      if (!personal.date_of_birth) return undefined;
      const b = new Date(personal.date_of_birth);
      const diff = Date.now() - b.getTime();
      return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }, [personal.date_of_birth]);

  const height = useMemo(() => {
    const h = state?.registration?.height;
    if (!h) return `5 ft 3 in`;
    const feet = Math.floor(h / 12);
    const inches = h % 12;
    return `${feet} ft ${inches} in`;
  }, [state?.registration?.height]);
  const weight = state?.registration?.weight ? `${state.registration.weight} lbs` : '153 lbs'

  return (
    <div className="profile-root">
      <header className="home-header">
        <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
      </header>

      <main className="profile-main">
        <section className="card">
          <div className="profile-summary-header">
            <div className="profile-summary-title"><User color="#6b9b8a" /> <div style={{ fontSize: 18 }}>Profile Summary</div></div>
            <button className="edit-profile-btn" onClick={() => navigate('/profile/edit')}>
              <Pencil size={14} style={{ marginRight: 8 }} /> Edit
            </button>
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
              <div className="summary-value">{height}</div>
            </div>
            <div className="summary-item">
              <div className="summary-label">Weight</div>
              <div className="summary-value">{weight}</div>
            </div>
          </div>
        </section>

        <section>
          <div className="section-title"><Heart color="#6b9b8a" /> <p>Health Conditions</p></div>
          <div className="section-content">{health || 'None'}</div>
        </section>

        <section style={{ marginTop: 18 }}>
          <div className="section-title"><Apple color="#d98252" /> Dietary Information</div>
          <div className="section-content">Food Allergies & Sensitivities: {allergies || 'None'}</div>
          <div style={{ height: 10 }} />
          <div className="section-content">Dietary Preferences: {preferences || 'None'}</div>
        </section>

        <section style={{ marginTop: 18 }}>
          <div className="section-title"><Target color="#6b9b8a" /> Your Goals</div>
          <div className="section-content">Nutrition Goals: {nutritional_goal || 'None'}</div>
          <div style={{ height: 10 }} />
          <div className="section-content">Fitness Goals: {fitness_goal || 'None'}</div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, marginBottom: 20 }}>
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </main>

      <BottomNav active="profile" />
    </div>
  )
}

export default ProfileScreen
