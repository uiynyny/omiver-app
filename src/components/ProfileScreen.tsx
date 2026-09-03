import React, { useMemo, useState } from 'react';
import './ProfileScreen.css';
import BottomNav from './BottomNav';
import { useAppContext } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Target, Pencil, Settings, ChevronRight, LogOut } from 'lucide-react';
import omiver from '../assets/omiver.svg';
import { logoutApi, clearAuthToken, clearPersistentLogin } from '../api/user';

type Field = { key: string; label: string; value?: string | number | null };

const ProfileScreen: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  const reg = state.registration;
  const [detail, setDetail] = useState<'dietary' | 'exercise' | null>(null);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      // ignore
    }
    clearAuthToken();
    clearPersistentLogin();
    dispatch({ type: 'CLEAR_AUTH' });
    navigate('/login');
  };

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

  // Client's health conditions (mapped from API snake_case `health_conditions`)
  const healthConditions =
    reg?.healthConditions || (reg as Record<string, unknown>)?.health_conditions;
  const healthConditionsText =
    healthConditions && healthConditions !== '' ? String(healthConditions) : 'None specified';

  // User's dietary information
  const dietaryFields: Field[] = [
    { key: 'dietary_preferences', label: 'Dietary Preferences', value: reg?.dietary_preferences },
    { key: 'preferred_cuisines', label: 'Preferred Cuisines', value: reg?.preferred_cuisines },
    { key: 'avoided_cuisines', label: 'Avoided Cuisines', value: reg?.avoided_cuisines },
    { key: 'allergies', label: 'Allergies', value: reg?.allergies },
    { key: 'dietary_recall', label: 'Dietary Recall', value: reg?.dietary_recall },
    { key: 'dietary_typicality', label: 'Dietary Typicality', value: reg?.dietary_typicality },
    { key: 'dietary_preference_mode', label: 'Preference Mode', value: reg?.dietary_preference_mode },
  ];

  // User's exercise information
  const exerciseFields: Field[] = [
    { key: 'exercise_types', label: 'Exercise Types', value: reg?.exercise_types },
    { key: 'exercise_days_per_week', label: 'Days Per Week', value: reg?.exercise_days_per_week },
    { key: 'weekly_exercise_routine', label: 'Weekly Routine', value: reg?.weekly_exercise_routine },
    { key: 'exercise_recall', label: 'Exercise Recall', value: reg?.exercise_recall },
  ];

  const activeFields = detail === 'dietary' ? dietaryFields : detail === 'exercise' ? exerciseFields : [];

  const renderDetailFields = (fields: Field[]) =>
    fields.map((f) => {
      const hasValue = f.value !== undefined && f.value !== null && f.value !== '';
      return (
        <div key={f.key} className="profile-detail-row">
          <div className="profile-detail-row-label">{f.label}</div>
          <div className="profile-detail-row-value">{hasValue ? String(f.value) : 'None specified'}</div>
        </div>
      );
    });

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
          <div className="section-content">{healthConditionsText}</div>
        </section>

        {/* Dietary & Exercise Information */}
        <section className="recommendation-section exercise-section" style={{ marginTop: 18 }}>
          <div className="section-title">
            <Target color="#6b9b8a" /> 
            <p style={{ margin: 0 }}>Diet and Exercise preferences</p>
          </div>
          <div className="section-content">
            <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>Nutrition Goal:</div>
            <div>{reg.preferred_cuisines || 'None specified'}</div>
            <div style={{ height: 12 }} />
            <div style={{ fontWeight: 600, color: '#333', marginBottom: 4 }}>Fitness Goals:</div>
            <div>{reg.weekly_exercise_routine || 'None specified'}</div>
          </div>
        </section>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32, marginBottom: 20 }}>
          <button className="logout-button" onClick={() => navigate('/profile/settings')} style={{ borderColor: '#6b9b8a', color: '#6b9b8a' }}>
            Go to Settings
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <button className="logout-button" onClick={handleLogout} style={{ borderColor: '#ff4d4f', color: '#ff4d4f' }}>
            <LogOut size={16} style={{ marginRight: 8 }} /> Logout Account
          </button>
        </div>
      </main>

      {/* Detail overlay */}
      {detail && (
        <div className="profile-detail-overlay" onClick={() => setDetail(null)}>
          <div className="profile-detail-card" onClick={(e) => e.stopPropagation()}>
            <div className="profile-detail-title">
              {detail === 'dietary' ? 'Dietary Information' : 'Exercise Information'}
            </div>
            <div className="profile-detail-rows">
              {renderDetailFields(activeFields)}
            </div>
            <button className="profile-detail-close" onClick={() => setDetail(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      <BottomNav active="profile" />
    </div>
  );
};

export default ProfileScreen;
