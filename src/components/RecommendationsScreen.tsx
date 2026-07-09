import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, Utensils, Lightbulb, ShieldAlert, Award, HeartHandshake } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { fetchDashboard, fetchRecommendations, type Dashboard, type RecommendationResponse } from '../api/user';

import './RecommendationsScreen.css';
import BottomNav from './BottomNav';
import omiver from '../assets/omiver.svg';

const RecommendationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      Promise.all([
        fetchDashboard(clientId),
        fetchRecommendations(clientId)
      ])
        .then(([dashData, recs]) => {
          setDashboardData(dashData);
          // Find the latest approved recommendation
          const approved = recs.find(r => r.status === 'APPROVED');
          setRecommendation(approved || null);
          setLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching recommendations:', error);
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
            {/* Doctor Notes Callout */}
            {recommendation?.doctor_notes && (
              <section className="doctor-notes-section">
                <div className="dr-header">
                  <HeartHandshake size={20} color="#8a4b7d" />
                  <h3>Message From Your Practitioner</h3>
                </div>
                <div className="dr-body-content">
                  <p>"{recommendation.doctor_notes}"</p>
                </div>
              </section>
            )}

            {/* Exercise Recommendations */}
            <section className="recommendation-section exercise-section">
              <div className="section-header">
                <div className="section-icon exercise-icon">💪</div>
                <div>
                  <h2>Exercise Prescription</h2>
                  <p className="section-goal">Target: {exerciseGoal}</p>
                </div>
              </div>

              {recommendation?.exercise_final ? (
                <div className="rich-rec-content">
                  <p className="rec-summary-text">{recommendation.exercise_final.summary}</p>
                  
                  {recommendation.exercise_final.frequency && (
                    <div className="frequency-badge-container">
                      <span className="freq-badge">⏰ Frequency: {recommendation.exercise_final.frequency}</span>
                    </div>
                  )}

                  {recommendation.exercise_final.activities && recommendation.exercise_final.activities.length > 0 && (
                    <div className="activities-list-container">
                      <h4>Suggested Physical Activities</h4>
                      <div className="activities-grid">
                        {recommendation.exercise_final.activities.map((act, idx) => (
                          <span key={idx} className="activity-tag">🚴 {act}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {recommendation.exercise_final.precautions && recommendation.exercise_final.precautions.length > 0 && (
                    <div className="precautions-container">
                      <div className="precaution-header">
                        <ShieldAlert size={16} color="#c05621" />
                        <span>Precautions & Safety Guidelines</span>
                      </div>
                      <ul>
                        {recommendation.exercise_final.precautions.map((prec, idx) => (
                          <li key={idx}>{prec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div className="recommendation-item placeholder">
                  <div className="rec-bullet">→</div>
                  <p>Once your physical biomarker results are processed, your doctor will approve and publish your custom athletic routine here.</p>
                </div>
              )}
            </section>

            {/* Meal Plan Recommendations */}
            <section className="recommendation-section meal-section">
              <div className="section-header">
                <div className="section-icon meal-icon">🍽️</div>
                <div>
                  <h2>Nutrition & Meal Plan</h2>
                  <p className="section-goal">Dietary Profile: {dietaryPref}</p>
                </div>
              </div>

              {recommendation?.dietary_final ? (
                <div className="rich-rec-content">
                  <p className="rec-summary-text">{recommendation.dietary_final.summary}</p>

                  {/* Dos and Donts Grid */}
                  <div className="dos-donts-grid">
                    {recommendation.dietary_final.dos && recommendation.dietary_final.dos.length > 0 && (
                      <div className="food-list-card include-card">
                        <h5>🥗 Foods to Emphasize</h5>
                        <ul>
                          {recommendation.dietary_final.dos.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {recommendation.dietary_final.donts && recommendation.dietary_final.donts.length > 0 && (
                      <div className="food-list-card limit-card">
                        <h5>⚠️ Foods to Limit</h5>
                        <ul>
                          {recommendation.dietary_final.donts.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Daily Sample Meal Plan */}
                  {recommendation.dietary_final.sample_meal_plan && recommendation.dietary_final.sample_meal_plan.length > 0 && (
                    <div className="sample-meals-container">
                      <h4>Daily Sample Meal Planner</h4>
                      <div className="meals-timeline">
                        {recommendation.dietary_final.sample_meal_plan.map((mealObj, idx) => (
                          <div key={idx} className="timeline-meal-item">
                            <span className="meal-time-icon">{getMealIcon(mealObj.meal)}</span>
                            <div className="meal-details-body">
                              <span className="meal-name">{mealObj.meal}</span>
                              <p className="meal-desc">{mealObj.suggestion}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="recommendation-item placeholder">
                  <div className="rec-bullet">→</div>
                  <p>Once your blood analysis is complete, your personalized meal blueprint and nutrient guidelines will appear here.</p>
                </div>
              )}
            </section>

            {/* Health Profile Score card */}
            {dashboardData?.health_score !== null && dashboardData?.health_score !== undefined && (
              <section className="recommendation-section insights-section">
                <div className="section-header">
                  <Award size={22} color="#6b9b8a" />
                  <h2>Your Health Blueprint Summary</h2>
                </div>

                <div className="health-profile-grid">
                  <div className="health-item">
                    <span className="health-label">Metabolic Health Score</span>
                    <span className="health-value-highlight">{dashboardData.health_score} / 100</span>
                  </div>
                  <div className="health-item">
                    <span className="health-label">Optimal Biomarkers</span>
                    <span className="health-value">{dashboardData.optimal_biomarkers} / {dashboardData.total_biomarkers}</span>
                  </div>
                </div>
              </section>
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
