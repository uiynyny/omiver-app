import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Download, FileText, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Dumbbell, Utensils } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { 
  fetchDashboard, 
  fetchBiomarkerReports, 
  fetchRecommendations,
  downloadRecommendationPdf,
  downloadBiomarkerReportPdf,
  type Dashboard, 
  type BiomarkerReportResponse,
  type RecommendationResponse 
} from '../api/user';

import './RecommendationsScreen.css';
import BottomNav from './BottomNav';
import omiver from '../assets/omiver.svg';

const RecommendationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [reports, setReports] = useState<BiomarkerReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedReports, setExpandedReports] = useState<Record<number, boolean>>({});
  const [downloadingRecId, setDownloadingRecId] = useState<number | null>(null);
  const [downloadingReportId, setDownloadingReportId] = useState<number | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

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
        fetchRecommendations(clientId).catch(() => [] as RecommendationResponse[]),
        fetchBiomarkerReports(clientId).catch(() => [] as BiomarkerReportResponse[])
      ])
        .then(([dashData, recData, reportData]) => {
          setDashboardData(dashData);
          setRecommendations(recData || []);
          // Sort reports in reverse chronological order (newest first)
          const sorted = (reportData || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
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

  const handleDownloadRecommendation = async (recId: number) => {
    try {
      setDownloadingRecId(recId);
      setDownloadError(null);
      await downloadRecommendationPdf(recId);
    } catch (err) {
      console.error('Download recommendation PDF failed:', err);
      setDownloadError('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingRecId(null);
    }
  };

  const handleDownloadReport = async (reportId: number) => {
    try {
      setDownloadingReportId(reportId);
      setDownloadError(null);
      await downloadBiomarkerReportPdf(reportId);
    } catch (err) {
      console.error('Download biomarker report PDF failed:', err);
      setDownloadError('Failed to download PDF. Please try again.');
    } finally {
      setDownloadingReportId(null);
    }
  };

  const getMealIcon = (meal: string) => {
    switch (meal.toLowerCase()) {
      case 'breakfast': return '🍳';
      case 'lunch': return '🥗';
      case 'dinner': return '🐟';
      default: return '🍽️';
    }
  };

  const hasContent = recommendations.length > 0 || reports.length > 0;

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
          <p className="recommendations-subtitle">Powered by Omiver AI & Reviewed by Healthcare Professionals</p>
        </div>

        {downloadError && (
          <div style={{ margin: '16px 20px', padding: '12px 16px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px', color: '#c53030', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
            <AlertCircle size={18} />
            <span>{downloadError}</span>
          </div>
        )}

        {loading ? (
          <div className="recommendations-loading">
            <div className="loading-card">
              <Lightbulb size={48} className="pulse-icon" color="#6b9b8a" />
              <p>Crafting your metabolic blueprint...</p>
            </div>
          </div>
        ) : (
          <div className="recommendations-content">
            {/* 1. Model Recommendations */}
            {recommendations.length > 0 && recommendations.map((rec) => {
              const dietary = rec.dietary_final;
              const exercise = rec.exercise_final;
              const dateStr = rec.approved_at || rec.created_at;
              const formattedDate = dateStr 
                ? new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Recent';

              return (
                <section key={rec.id} className="recommendation-section" style={{ marginBottom: '24px' }}>
                  {/* Card Header & PDF Download Action */}
                  <div className="rec-card-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="section-icon" style={{ background: '#eaf5ec', color: '#166534' }}>
                        <FileText size={24} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#1a202c' }}>Precision Health Plan</h2>
                          {rec.status === 'APPROVED' && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#dcfce7', color: '#15803d', fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '12px' }}>
                              <CheckCircle2 size={12} /> Approved
                            </span>
                          )}
                        </div>
                        <p className="section-goal" style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                          Plan #{rec.id} • {formattedDate}
                        </p>
                      </div>
                    </div>

                    <button
                      className="download-pdf-btn"
                      onClick={() => handleDownloadRecommendation(rec.id)}
                      disabled={downloadingRecId === rec.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#166534',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        cursor: downloadingRecId === rec.id ? 'wait' : 'pointer',
                        transition: 'background 0.2s',
                        boxShadow: '0 2px 4px rgba(22, 101, 52, 0.2)'
                      }}
                    >
                      <Download size={16} />
                      <span>{downloadingRecId === rec.id ? 'Generating PDF...' : 'Download PDF'}</span>
                    </button>
                  </div>

                  {/* Doctor Notes Callout */}
                  {rec.doctor_notes && (
                    <div className="doctor-notes-section" style={{ marginBottom: '18px' }}>
                      <div className="dr-header">
                        <CheckCircle2 size={18} color="#8a4b7d" />
                        <h3>Physician Clinical Notes</h3>
                      </div>
                      <div className="dr-body-content">
                        <p>"{rec.doctor_notes}"</p>
                      </div>
                    </div>
                  )}

                  {/* Dietary Plan */}
                  {dietary && (
                    <div className="protocol-block" style={{ marginTop: '12px', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Utensils size={20} color="#166534" />
                        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>Precision Dietary Protocol</h3>
                      </div>
                      {dietary.summary && (
                        <p className="rec-summary-text" style={{ marginBottom: '14px' }}>{dietary.summary}</p>
                      )}

                      <div className="dos-donts-grid" style={{ marginBottom: '16px' }}>
                        {dietary.dos && dietary.dos.length > 0 && (
                          <div className="food-list-card include-card">
                            <h5>Foods to Prioritize</h5>
                            <ul>
                              {dietary.dos.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {dietary.donts && dietary.donts.length > 0 && (
                          <div className="food-list-card limit-card">
                            <h5>Foods to Avoid / Moderate</h5>
                            <ul>
                              {dietary.donts.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {dietary.sample_meal_plan && dietary.sample_meal_plan.length > 0 && (
                        <div className="sample-meals-container">
                          <h4>Sample Daily Meal Protocol</h4>
                          <div className="meals-timeline">
                            {dietary.sample_meal_plan.map((mealItem, idx) => (
                              <div key={idx} className="timeline-meal-item">
                                <div className="meal-time-icon">{getMealIcon(mealItem.meal)}</div>
                                <div className="meal-details-body">
                                  <div className="meal-name">{mealItem.meal}</div>
                                  <p className="meal-desc">{mealItem.suggestion}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Exercise Plan */}
                  {exercise && (
                    <div className="protocol-block" style={{ marginTop: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <Dumbbell size={20} color="#0f766e" />
                        <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>Exercise & Physical Activity Protocol</h3>
                      </div>
                      {exercise.summary && (
                        <p className="rec-summary-text" style={{ marginBottom: '12px' }}>{exercise.summary}</p>
                      )}

                      {exercise.frequency && (
                        <div className="frequency-badge-container" style={{ marginBottom: '12px' }}>
                          <span className="freq-badge">Prescribed Frequency: {exercise.frequency}</span>
                        </div>
                      )}

                      {exercise.activities && exercise.activities.length > 0 && (
                        <div className="activities-list-container" style={{ marginBottom: '14px' }}>
                          <h4>Prescribed Activities</h4>
                          <div className="activities-grid">
                            {exercise.activities.map((act, idx) => (
                              <span key={idx} className="activity-tag">{act}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {exercise.precautions && exercise.precautions.length > 0 && (
                        <div className="precautions-container">
                          <div className="precaution-header">
                            <AlertCircle size={16} />
                            <span>Clinical Precautions & Safety</span>
                          </div>
                          <ul>
                            {exercise.precautions.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {!dietary && !exercise && rec.text && (
                    <div className="recommendation-item" style={{ marginTop: '10px' }}>
                      <div className="rec-bullet">→</div>
                      <p>{rec.text}</p>
                    </div>
                  )}
                </section>
              );
            })}

            {/* 2. Biomarker Delta Reports */}
            {reports.length > 0 && reports.map((report) => (
              <section key={report.primary_id} className="recommendation-section report-section" style={{ marginBottom: '20px' }}>
                <div 
                  className="section-header" 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}
                >
                  <div 
                    onClick={() => toggleReport(report.primary_id)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', flex: 1 }}
                  >
                    <div className="section-icon report-icon" style={{ marginRight: '10px' }}>📋</div>
                    <div>
                      <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Biomarker Delta Report</h2>
                      <p className="section-goal" style={{ margin: 0 }}>
                        Generated on {new Date(report.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      className="download-pdf-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadReport(report.primary_id);
                      }}
                      disabled={downloadingReportId === report.primary_id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: '#1e3a8a',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: downloadingReportId === report.primary_id ? 'wait' : 'pointer',
                        transition: 'background 0.2s',
                      }}
                    >
                      <Download size={14} />
                      <span>{downloadingReportId === report.primary_id ? 'Downloading...' : 'Download PDF'}</span>
                    </button>

                    <div 
                      onClick={() => toggleReport(report.primary_id)}
                      style={{ fontSize: '1.25rem', color: '#6b9b8a', paddingLeft: '6px', userSelect: 'none', cursor: 'pointer' }}
                    >
                      {expandedReports[report.primary_id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
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
            ))}

            {!hasContent && dashboardData?.recommendations && dashboardData.recommendations.length > 0 && (
              <section className="recommendation-section" style={{ marginBottom: '20px' }}>
                <div className="section-header" style={{ marginBottom: '12px' }}>
                  <div className="section-icon" style={{ background: '#eaf5ec', color: '#166534' }}>
                    <Lightbulb size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.2rem' }}>Personalized Insights</h2>
                    <p className="section-goal" style={{ margin: 0 }}>Based on your health profile</p>
                  </div>
                </div>
                <ul className="rec-list" style={{ paddingLeft: '20px', margin: 0 }}>
                  {dashboardData.recommendations.map((rec, idx) => (
                    <li key={idx} style={{ marginBottom: '8px', color: '#334155', fontSize: '0.95rem' }}>{rec}</li>
                  ))}
                </ul>
              </section>
            )}

            {!hasContent && (!dashboardData?.recommendations || dashboardData.recommendations.length === 0) && (
              <div className="bottom-card">
                <div className="recommendation-item placeholder" style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div className="rec-bullet" style={{ fontSize: '2rem', marginBottom: '10px' }}>→</div>
                  <p>Once your blood analysis is complete and your doctor approves your tailored protocol, your personalized biomarker delta reports and downloadable precision PDF plans will appear here.</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <section className="recommendations-actions" style={{ marginTop: '20px' }}>
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
