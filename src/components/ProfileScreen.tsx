import React from 'react'
import './ProfileScreen.css'
import BottomNav from './BottomNav';
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { User, Heart, Target, Apple } from 'lucide-react'

const ProfileScreen: React.FC = () => {
  const { state, dispatch } = useAppContext()
  const navigate = useNavigate()

  const handleLogout = () => {
    dispatch({ type: 'CLEAR_AUTH' });
    navigate('/login');
  };

  const health = state?.registration?.healthConditions || 'None'
  const allergies = state?.registration?.allergies || 'None'
  const preferences = state?.registration?.dietary_preferences || 'None'
  const nutritional_goal = state?.registration?.nutritional_goal || 'None'
  const fitness_goal = state?.registration?.fitness_goal || 'None'

  const name = `${state?.registration?.firstName || ''} ${state?.registration?.lastName || ''}`.trim() || ''
  const age = state?.registration?.date_of_birth || '25'
  const height = state?.registration?.height || `63"`
  const weight = state?.registration?.weight || '153'

  return (
    <div className="profile-root">
      <header className="profile-header">
        <div className="profile-logo">OMIVER</div>
        <div className="profile-subtitle">Your Profile Summary</div>
      </header>

      <main className="profile-main">
        <section className="card">
          <div className="profile-summary-title"><User color="#6b9b8a" /> <div style={{ fontSize: 18 }}>Profile Summary</div></div>
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
