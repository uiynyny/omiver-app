import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { fetchDashboard, fetchBiomarkerReports, type Dashboard, type BiomarkerReportResponse } from '../api/user';

import './RecommendationsScreen.css';
import BottomNav from './BottomNav';
import omiver from '../assets/omiver.svg';

const RecommendationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
  const [reports, setReports] = useState<BiomarkerReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReports, setExpandedReports] = useState<Record<number, boolean>>({});

  const toggleReport = (id: number) => {
    setExpandedReports(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  useEffect(() => {
    if (clientId) {
      Promise.all([
        fetchDashboard(clientId),
        fetchBiomarkerReports(clientId)
      ])
        .then(([dashData, reportData]) => {
          setDashboardData(dashData);
          // Sort reports in reverse chronological order (newest first)
          const sorted = reportData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          setReports(sorted);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching data:', error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [clientId]);

  const exerciseGoal = state?.registration?.fitness_goal || 'General wellness';
  const dietaryPref = state?.registration?.dietary_preferences || 'Balanced';

  // Render Daily Meal Suggestion Helper
  const getMealIcon = (meal: string) => {
    switch (meal.toLowerCase()) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥗';
      case 'dinner': return '🐟';
      default: return '🍽️';
    }
  };

  return (
    <div className="recommendations-root">
      <header className="home-header">
        <div className="centered-logo">
          <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
        </div>
      </header>

      <main className="recommendations-main">
        <div className="recommendations-title-section">
          <Lightbulb size={32} color="#6b9b8a" />
          <h1>Personalized Recommendations</h1>
          <p className="recommendations-subtitle">Approved by your clinical team & powered by Omiver AI</p>
        </div>

        {loading ? (
          <div className="recommendations-loading">
            <div className="loading-card">
              <Lightbulb size={48} className="pulse-icon" color="#6b9b8a" />
              <p>Crafting your metabolic blueprint...</p>
            </div>
          </div>
        ) : (
          <div className="bottom-card">
            {reports.length > 0 ? (
              reports.map((report) => (
                <section key={report.primary_id} className="recommendation-section report-section" style={{ marginBottom: '20px' }}>
                  <div 
                    className="section-header" 
                    onClick={() => toggleReport(report.primary_id)}
                    style={{ cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div className="section-icon report-icon" style={{ marginRight: '10px' }}>📋</div>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Biomarker Report</h2>
                        <p className="section-goal" style={{ margin: 0 }}>Generated on {new Date(report.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div style={{ fontSize: '1.25rem', color: '#6b9b8a', paddingLeft: '10px', userSelect: 'none' }}>
                      {expandedReports[report.primary_id] ? '▲' : '▼'}
                    </div>
                  </div>
                  
                  {expandedReports[report.primary_id] && (
                    <div className="report-iframe-container" style={{ marginTop: '15px' }}>
                      <iframe
                        srcDoc={report.report}
                        title={`Biomarker Report ${report.primary_id}`}
                        className="report-iframe"
                        style={{
                          width: '100%',
                          height: '600px',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          backgroundColor: '#ffffff',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                        }}
                      />
                    </div>
                  )}
                </section>
              ))
            ) : (
              <div className="recommendation-item placeholder" style={{ padding: '40px 20px', textAlign: 'center' }}>
                <div className="rec-bullet" style={{ fontSize: '2rem', marginBottom: '10px' }}>→</div>
                <p>Once your blood analysis is complete, your personalized biomarker delta reports and precision plans will appear here.</p>
              </div>
            )}

            {/* Action Buttons */}
            <section className="recommendations-actions">
              <button className="action-button primary" onClick={() => navigate('/collection/steps')}>
                Complete Sample Collection
              </button>
              <button className="action-button secondary" onClick={() => navigate('/home')}>
                Back to Dashboard
              </button>
            </section>
          </div>
        )}
      </main>

      <BottomNav active="recommendations" />
    </div>
  );
};

export default RecommendationsScreen;
