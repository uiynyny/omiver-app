import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb, Download, FileText, CheckCircle2, ChevronDown, ChevronUp, AlertCircle, Dumbbell, Utensils, FlaskConical } from 'lucide-react';
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
import { formatDate } from '../utils/format';

import './RecommendationsScreen.css';
import BottomNav from './BottomNav';

const RecommendationsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [reports, setReports] = useState<BiomarkerReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
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
    if (!clientId) {
      setLoading(false);
      return;
    }
    
    let cancelled = false;
    setLoading(true);
    setLoadError('');

    Promise.allSettled([
      fetchDashboard(clientId),
      fetchRecommendations(clientId),
      fetchBiomarkerReports(clientId)
    ]).then(([dashData, recData, reportData]) => {
      if (cancelled) return;

      if (dashData.status === 'fulfilled') setDashboardData(dashData.value);
      if (recData.status === 'fulfilled') setRecommendations(recData.value || []);
      if (reportData.status === 'fulfilled') {
        const sorted = (reportData.value || []).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setReports(sorted);
      }
      
      if (dashData.status === 'rejected' && recData.status === 'rejected') {
        setLoadError('We could not load your recommendations. Please try again.');
      }
      setLoading(false);
    });
    
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const handleDownloadRecommendation = async (recId: number) => {
    try {
      setDownloadingRecId(recId);
      setDownloadError(null);
      await downloadRecommendationPdf(recId);
    } catch {
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
    } catch {
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
    <div className="screen screen--nav">
      <header className="app-header">
        <span />
        <span className="app-header__title">Recommendations</span>
        <span />
      </header>

      <main className="container stack-lg" style={{ paddingTop: 'var(--sp-4)' }}>
        <section className="fade-in stack-sm">
          <div className="row">
            <span className="icon-btn icon-btn--plain" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', pointerEvents: 'none' }}>
              <Lightbulb size={20} />
            </span>
            <h1 className="section-title" style={{ marginBottom: 0 }}>Personalized Protocol</h1>
          </div>
          <p className="text-secondary text-body">Powered by Omiver AI & Reviewed by Healthcare Professionals</p>
        </section>

        {downloadError && (
          <div className="error-banner" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            {downloadError}
          </div>
        )}
        
        {loadError && (
          <div className="error-banner" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="stack" aria-busy="true">
            <span className="sr-only">Crafting your metabolic blueprint...</span>
            <div className="skeleton" style={{ height: 200 }} />
            <div className="skeleton" style={{ height: 120 }} />
          </div>
        ) : (
          <div className="stack-lg">
            {/* 1. Model Recommendations */}
            {recommendations.length > 0 && recommendations.map((rec) => {
              const dietary = rec.dietary_final;
              const exercise = rec.exercise_final;
              const dateStr = rec.approved_at || rec.created_at;
              const formattedDate = dateStr 
                ? formatDate(dateStr)
                : 'Recent';

              return (
                <section key={rec.id} className="card stack">
                  <div className="row-between" style={{ alignItems: 'flex-start' }}>
                    <div className="row">
                      <span className="icon-btn icon-btn--plain" style={{ background: 'var(--optimal-soft)', color: 'var(--optimal)' }}>
                        <FileText size={20} />
                      </span>
                      <div className="stack" style={{ gap: '2px' }}>
                        <div className="row" style={{ gap: 'var(--sp-2)' }}>
                          <h2 className="card__title" style={{ margin: 0 }}>Precision Health Plan</h2>
                          {rec.status === 'APPROVED' && (
                            <span className="chip chip--optimal" style={{ minHeight: '24px', padding: '0 8px', fontSize: '11px' }}>
                              <CheckCircle2 size={12} /> Approved
                            </span>
                          )}
                        </div>
                        <span className="text-label text-secondary">
                          Plan #{rec.id} · {formattedDate}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => handleDownloadRecommendation(rec.id)}
                      disabled={downloadingRecId === rec.id}
                      aria-busy={downloadingRecId === rec.id}
                    >
                      <Download size={14} />
                      <span>{downloadingRecId === rec.id ? 'Generating...' : 'PDF'}</span>
                    </button>
                  </div>

                  {rec.doctor_notes && (
                    <div className="card card--inset stack-sm" style={{ borderLeft: '3px solid var(--watch)' }}>
                      <div className="row" style={{ color: 'var(--watch)' }}>
                        <CheckCircle2 size={16} />
                        <h3 className="section-title" style={{ margin: 0, fontSize: 'var(--fs-body)' }}>Physician Clinical Notes</h3>
                      </div>
                      <p className="text-body text-secondary" style={{ fontStyle: 'italic' }}>"{rec.doctor_notes}"</p>
                    </div>
                  )}

                  {dietary && (
                    <div className="stack-sm" style={{ marginTop: 'var(--sp-2)' }}>
                      <div className="row text-optimal">
                        <Utensils size={18} />
                        <h3 className="section-title" style={{ margin: 0, fontSize: 'var(--fs-heading)' }}>Dietary Protocol</h3>
                      </div>
                      {dietary.summary && (
                        <p className="text-body text-secondary">{dietary.summary}</p>
                      )}

                      <div className="grid-2col">
                        {dietary.dos && dietary.dos.length > 0 && (
                          <div className="card card--inset stack-sm" style={{ borderColor: 'var(--optimal-soft)', borderWidth: '1px' }}>
                            <h4 className="text-label text-optimal">Prioritize</h4>
                            <ul className="rec-list-ul">
                              {dietary.dos.map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                        {dietary.donts && dietary.donts.length > 0 && (
                          <div className="card card--inset stack-sm" style={{ borderColor: 'var(--risk-soft)', borderWidth: '1px' }}>
                            <h4 className="text-label text-risk">Limit / Avoid</h4>
                            <ul className="rec-list-ul">
                              {dietary.donts.map((item, idx) => <li key={idx}>{item}</li>)}
                            </ul>
                          </div>
                        )}
                      </div>

                      {dietary.sample_meal_plan && dietary.sample_meal_plan.length > 0 && (
                        <div className="stack-sm" style={{ marginTop: 'var(--sp-2)' }}>
                          <h4 className="text-label text-tertiary">Sample Daily Meals</h4>
                          <div className="stack-sm">
                            {dietary.sample_meal_plan.map((mealItem, idx) => (
                              <div key={idx} className="card card--inset row" style={{ alignItems: 'flex-start' }}>
                                <span className="icon-btn icon-btn--plain" style={{ background: 'var(--surface-3)', fontSize: '1.2rem' }}>
                                  {getMealIcon(mealItem.meal)}
                                </span>
                                <div className="stack" style={{ gap: '2px' }}>
                                  <span className="text-body" style={{ fontWeight: 600 }}>{mealItem.meal}</span>
                                  <span className="text-body text-secondary">{mealItem.suggestion}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {exercise && (
                    <div className="stack-sm" style={{ marginTop: 'var(--sp-4)' }}>
                      <div className="row text-accent">
                        <Dumbbell size={18} />
                        <h3 className="section-title" style={{ margin: 0, fontSize: 'var(--fs-heading)' }}>Exercise Protocol</h3>
                      </div>
                      {exercise.summary && (
                        <p className="text-body text-secondary">{exercise.summary}</p>
                      )}

                      {exercise.frequency && (
                        <div>
                          <span className="chip chip--accent">{exercise.frequency}</span>
                        </div>
                      )}

                      {exercise.activities && exercise.activities.length > 0 && (
                        <div className="stack-sm" style={{ marginTop: 'var(--sp-2)' }}>
                          <h4 className="text-label text-tertiary">Activities</h4>
                          <div className="row" style={{ flexWrap: 'wrap' }}>
                            {exercise.activities.map((act, idx) => (
                              <span key={idx} className="chip">{act}</span>
                            ))}
                          </div>
                        </div>
                      )}

                      {exercise.precautions && exercise.precautions.length > 0 && (
                        <div className="card card--inset stack-sm" style={{ borderLeft: '3px solid var(--watch)' }}>
                          <div className="row text-watch">
                            <AlertCircle size={16} />
                            <h4 className="text-label" style={{ color: 'inherit' }}>Clinical Precautions</h4>
                          </div>
                          <ul className="rec-list-ul">
                            {exercise.precautions.map((p, idx) => (
                              <li key={idx} className="text-body text-secondary">{p}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {!dietary && !exercise && rec.text && (
                    <div className="card card--inset" style={{ marginTop: 'var(--sp-2)' }}>
                      <p className="text-body">{rec.text}</p>
                    </div>
                  )}
                </section>
              );
            })}

            {/* 2. Biomarker Delta Reports */}
            {reports.length > 0 && reports.map((report) => (
              <section key={report.primary_id} className="card stack-sm">
                <div className="row-between">
                  <button 
                    type="button"
                    className="row" 
                    onClick={() => toggleReport(report.primary_id)}
                    style={{ flex: 1, textAlign: 'left' }}
                  >
                    <span className="icon-btn icon-btn--plain" style={{ background: 'var(--surface-3)' }}>
                      <FlaskConical size={20} />
                    </span>
                    <div className="stack" style={{ gap: '2px' }}>
                      <h2 className="card__title" style={{ margin: 0 }}>Biomarker Delta Report</h2>
                      <span className="text-label text-secondary">
                        {formatDate(report.created_at)}
                      </span>
                    </div>
                  </button>

                  <div className="row" style={{ gap: 'var(--sp-2)' }}>
                    <button
                      type="button"
                      className="btn btn--secondary btn--sm"
                      onClick={() => handleDownloadReport(report.primary_id)}
                      disabled={downloadingReportId === report.primary_id}
                      aria-busy={downloadingReportId === report.primary_id}
                    >
                      <Download size={14} />
                      <span className="sr-only">Download PDF</span>
                    </button>

                    <button 
                      type="button"
                      className="icon-btn icon-btn--plain"
                      onClick={() => toggleReport(report.primary_id)}
                      aria-expanded={expandedReports[report.primary_id]}
                      aria-label="Toggle report"
                    >
                      {expandedReports[report.primary_id] ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </button>
                  </div>
                </div>
                
                {expandedReports[report.primary_id] && (
                  <div className="report-frame">
                    {/*
                      This renders HTML produced server-side. `sandbox=""` (an
                      empty value, not a missing attribute) is the maximally
                      restrictive setting: no scripts, no forms, no top-level
                      navigation, and a unique opaque origin so the document
                      cannot reach back into the app. Do NOT add
                      `allow-scripts` alongside `allow-same-origin` — together
                      they let the frame remove its own sandbox.
                    */}
                    <iframe
                      srcDoc={report.report}
                      title={`Biomarker Report ${report.primary_id}`}
                      className="report-iframe"
                      sandbox=""
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>
                )}
              </section>
            ))}

            {!hasContent && dashboardData?.recommendations && dashboardData.recommendations.length > 0 && (
              <section className="card stack-sm">
                <div className="row">
                  <span className="icon-btn icon-btn--plain" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                    <Lightbulb size={20} />
                  </span>
                  <div className="stack" style={{ gap: '2px' }}>
                    <h2 className="card__title" style={{ margin: 0 }}>Personalized Insights</h2>
                    <span className="text-label text-secondary">Based on your health profile</span>
                  </div>
                </div>
                <ul className="rec-list-ul" style={{ marginTop: 'var(--sp-2)' }}>
                  {dashboardData.recommendations.map((rec, idx) => (
                    <li key={idx} className="text-body text-secondary">{rec}</li>
                  ))}
                </ul>
              </section>
            )}

            {!hasContent && (!dashboardData?.recommendations || dashboardData.recommendations.length === 0) && (
              <div className="empty-state">
                <span className="empty-state__icon" aria-hidden="true">
                  <Lightbulb size={24} />
                </span>
                <h2 className="empty-state__title">No recommendations yet</h2>
                <p className="empty-state__body">
                  Once your blood analysis is complete and your doctor approves your protocol, your personalized plans will appear here.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="stack-sm" style={{ marginTop: 'var(--sp-4)' }}>
              <button type="button" className="btn btn--primary btn--block" onClick={() => navigate('/collection/steps')}>
                Complete Sample Collection
              </button>
              <button type="button" className="btn btn--secondary btn--block" onClick={() => navigate('/home')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        )}
      </main>

      <BottomNav active="recommendations" />
    </div>
  );
};

export default RecommendationsScreen;
