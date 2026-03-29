import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Cog, CircleUserRound, Calendar, Mail, Package } from 'lucide-react';
import omiver from '../assets/omiver.svg';

import './PatientDetailScreen.css';

const PatientDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const patient = location.state?.patient;

  if (!patient) {
    return (
      <div className="screen-root">
        <div className="error-container">
          <h2>Patient not found</h2>
          <button onClick={() => navigate('/provider/dashboard')} className="primary-button">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const age = patient.date_of_birth ?
    Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : 'N/A';

  return (
    <div className="screen-root">
      <header className="home-header">
        <div className="left-icons">
          <button onClick={() => navigate('/provider/dashboard')} className="icon-btn-back">
            <ArrowLeft size={20} />
          </button>
        </div>
        <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
        <div className="right-icons">
          <Cog className="icon-btn" size={20} />
        </div>
      </header>

      <main className="detail-main">
        <div className="patient-header-card">
          <CircleUserRound size={64} strokeWidth={1} color="#c99bb9" />
          <div className="patient-header-info">
            <h2>{patient.full_name || `${patient.first_name} ${patient.last_name}`}</h2>
            <div className="patient-header-sub">
              <Mail size={14} /> <span>{patient.email}</span>
            </div>
          </div>
        </div>

        <div className="grid-container">
          <section className="detail-section card-glass">
            <h3>Profile Information</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">Age</div>
                <div className="info-value">{age}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Gender</div>
                <div className="info-value">{patient.gender || 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Height</div>
                <div className="info-value">{patient.height ? `${patient.height} cm` : 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Weight</div>
                <div className="info-value">{patient.weight ? `${patient.weight} kg` : 'N/A'}</div>
              </div>
            </div>
          </section>

          <section className="detail-section card-glass">
            <h3>Health Summary</h3>
            <div className="summary-list">
              <div className="summary-item">
                <Package size={20} color="#6b9b8a" />
                <div>
                  <div className="summary-title">Total Orders</div>
                  <div className="summary-value">{patient.total_orders || 0}</div>
                </div>
              </div>
              <div className="summary-item">
                <Calendar size={20} color="#6b9b8a" />
                <div>
                  <div className="summary-title">Latest Test</div>
                  <div className="summary-value">
                    {patient.latest_test_date ? new Date(patient.latest_test_date).toLocaleDateString() : 'No tests yet'}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default PatientDetailScreen;
