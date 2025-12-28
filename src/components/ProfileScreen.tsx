import React from 'react'
import './ProfileScreen.css'
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom'
import { User, Heart, Apple, Target, CircleUserRound, Album, ChartPie, LocateFixed, ListChecks } from 'lucide-react'

const ProfileScreen: React.FC = () => {
  const { state } = useAppContext()
  const navigate = useNavigate()

  const personal = state?.registration?.personalInfo || {}
  const health = state?.registration?.healthConditions || 'None'
  const dietary = state?.registration?.dietary || { allergies: 'None', preferences: 'None' }
  const goals = state?.registration?.goals || { nutritionGoals: 'None', fitnessGoals: 'None' }

  const name =  `${personal.firstName || ''} ${personal.lastName || ''}`.trim() || ''
  const age = personal.birthday || '25'
  const height = personal.height || `63"`
  const weight = personal.weight || '153 lbs'

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
          <div className="section-title"><Heart color="#6b9b8a" /> Health Conditions</div>
          <div className="section-content">{health || 'None'}</div>
        </section>

        <section style={{ marginTop: 18 }}>
          <div className="section-title"><Apple color="#d98252" /> Dietary Information</div>
          <div className="section-content">Food Allergies & Sensitivities: {dietary.allergies || 'None'}</div>
          <div style={{ height: 10 }} />
          <div className="section-content">Dietary Preferences: {dietary.preferences || 'None'}</div>
        </section>

        <section style={{ marginTop: 18 }}>
          <div className="section-title"><Target color="#6b9b8a" /> Your Goals</div>
          <div className="section-content">Nutrition Goals: {goals.nutritionGoals || 'None'}</div>
          <div style={{ height: 10 }} />
          <div className="section-content">Fitness Goals: {goals.fitnessGoals || 'None'}</div>
        </section>
      </main>

      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/home')}><ChartPie size={28} />Dashboard</button>
        <button className="nav-item" onClick={() => navigate('/kits')}><Album size={28} />Kits</button>
        <button className="nav-item" onClick={() => navigate('/collection')}><LocateFixed size={28} />Collection</button>
        <button className="nav-item" onClick={() => navigate('/orders')}><ListChecks size={28} />Orders</button>
        <button className="nav-item active" onClick={() => navigate('/profile')}><CircleUserRound size={28} />Profile</button>
      </nav>
    </div>
  )
}

export default ProfileScreen
