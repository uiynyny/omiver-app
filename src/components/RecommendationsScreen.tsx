import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Utensils, Lightbulb } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { fetchDashboard } from '../api/user';

import './RecommendationsScreen.css';
import BottomNav from './BottomNav';
import omiver from '../assets/omiver.svg';
import { type Dashboard } from '../api/user';

const RecommendationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      fetchDashboard(clientId)
        .then((data) => {
          setDashboardData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [clientId]);

  const exerciseGoal = state?.registration?.fitness_goal || 'General wellness';
  const dietaryPref = state?.registration?.dietary_preferences || 'Balanced';

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
          <p className="recommendations-subtitle">Based on your health profile and biomarker results</p>
        </div>

        {loading ? (
          <div className="recommendations-loading">
            <div className="loading-card">
              <Lightbulb size={48} color="#6b9b8a" />
              <p>Loading your recommendations...</p>
            </div>
          </div>
        ) : (
          <div className="bottom-card">
            {/* Exercise Recommendations */}
            <section className="recommendation-section exercise-section">
              <div className="section-header">
                <div className="section-icon exercise-icon">💪</div>
                <div>
                  <h2>Exercise Plan</h2>
                  <p className="section-goal">Goal: {exerciseGoal}</p>
                </div>
              </div>

              {dashboardData?.recommendations && dashboardData.recommendations.length > 0 ? (
                <div className="recommendations-list">
                  {dashboardData.recommendations
                    .filter((rec: string) => rec.toLowerCase().includes('exercise') || rec.toLowerCase().includes('cardio') || rec.toLowerCase().includes('strength'))
                    .map((rec: string, index: number) => (
                      <div key={index} className="recommendation-item">
                        <div className="rec-bullet">✓</div>
                        <p>{rec}</p>
                      </div>
                    ))}
                  {(!dashboardData.recommendations.some((rec: string) => rec.toLowerCase().includes('exercise') || rec.toLowerCase().includes('cardio'))) && (
                    <div className="recommendation-item placeholder">
                      <div className="rec-bullet">→</div>
                      <p>Maintain consistent exercise routine tailored to your fitness goals. Consider a mix of cardio and strength training.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="recommendation-item placeholder">
                  <div className="rec-bullet">→</div>
                  <p>Once you complete your biomarker test, we'll provide personalized exercise recommendations.</p>
                </div>
              )}
            </section>

            {/* Meal Plan Recommendations */}
            <section className="recommendation-section meal-section">
              <div className="section-header">
                <div className="section-icon meal-icon">🍽️</div>
                <div>
                  <h2>Meal Plan</h2>
                  <p className="section-goal">Preference: {dietaryPref}</p>
                </div>
              </div>

              {dashboardData?.recommendations && dashboardData.recommendations.length > 0 ? (
                <div className="recommendations-list">
                  {dashboardData.recommendations
                    .filter((rec: string) => rec.toLowerCase().includes('meal') || rec.toLowerCase().includes('diet') || rec.toLowerCase().includes('nutrition') || rec.toLowerCase().includes('food'))
                    .map((rec: string, index: number) => (
                      <div key={index} className="recommendation-item">
                        <div className="rec-bullet">✓</div>
                        <p>{rec}</p>
                      </div>
                    ))}
                  {(!dashboardData.recommendations.some((rec: string) => rec.toLowerCase().includes('meal') || rec.toLowerCase().includes('diet'))) && (
                    <div className="recommendation-item placeholder">
                      <div className="rec-bullet">→</div>
                      <p>Personalized meal plans will be generated based on your dietary preferences and health markers.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="recommendation-item placeholder">
                  <div className="rec-bullet">→</div>
                  <p>Once you complete your biomarker test, we'll provide personalized meal recommendations.</p>
                </div>
              )}
            </section>

            {/* Health Insights */}
            <section className="recommendation-section insights-section">
              <div className="section-header">
                <div className="section-icon">📊</div>
                <h2>Your Health Profile</h2>
              </div>

              <div className="health-profile-grid">
                <div className="health-item">
                  <Target size={20} color="#6b9b8a" />
                  <span className="health-label">Fitness Goal</span>
                  <span className="health-value">{exerciseGoal}</span>
                </div>
                <div className="health-item">
                  <Utensils size={20} color="#6b9b8a" />
                  <span className="health-label">Diet Preference</span>
                  <span className="health-value">{dietaryPref}</span>
                </div>
              </div>
            </section>

            {/* Action Buttons */}
            <section className="recommendations-actions">
              <button className="action-button primary" onClick={() => navigate('/collection/steps')}>
                Start Sample Collection
              </button>
              <button className="action-button secondary" onClick={() => navigate('/orders')}>
                Back to Orders
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
