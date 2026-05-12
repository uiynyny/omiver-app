import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, CircleUserRound, Calendar, Mail, Package, Save } from 'lucide-react';
import omiver from '../assets/omiver.svg';
import { updateClient, type Patient, fetchDashboard, type BiomarkerSection, type Dashboard } from '../api/user';

import './PatientDetailScreen.css';

const PatientDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const patient = location.state?.patient as Patient | undefined;
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState<Patient | null>(patient ?? null);
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);

  useEffect(() => {
    if (patient?.id) {
      fetchDashboard(patient.id).then(setDashboardData).catch(console.error);
    }
  }, [patient?.id]);

  const biomarkers = useMemo(() => {
    if (!dashboardData?.biomarker_results) return [];
    return Object.entries(dashboardData.biomarker_results).map(([section, data]: [string, BiomarkerSection]) => ({
      section,
      count: data.biomarker_count,
      items: data.results.map((r) => ({
        value: r.value,
        unit: r.unit,
        name: r.biomarker_name,
        note: r.normal_range,
        tag: r.status,
      })),
    }));
  }, [dashboardData]);

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

  const handleFieldChange = (field: keyof Patient | string, value: string) => {
    setEditData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!editData?.id) return;
    setSaving(true);
    try {
      const updated = await updateClient(editData.id, {
        dietary_recall: editData.dietary_recall,
        dietary_typicality: editData.dietary_typicality,
        dietary_preference_mode: editData.dietary_preference_mode,
        preferred_cuisines: editData.preferred_cuisines,
        avoided_cuisines: editData.avoided_cuisines,
        weekly_exercise_routine: editData.weekly_exercise_routine,
        exercise_days_per_week: editData.exercise_days_per_week,
        exercise_types: editData.exercise_types,
        provider_notes: editData.provider_notes,
      });
      setEditData(updated);
      alert('Patient intake updated');
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen-root">
      <header className="home-header patient-detail-header">
        <button onClick={() => navigate('/provider/dashboard')} className="icon-btn-back">
          <ArrowLeft size={20} />
        </button>
        <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
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

          <section className="detail-section card-glass">
            <h3>Diet & Exercise Intake</h3>
            <div className="info-grid">
              <div className="info-item">
                <div className="info-label">24-hour Recall</div>
                <textarea
                  className="editable-textarea"
                  value={editData?.dietary_recall || ''}
                  onChange={(e) => handleFieldChange('dietary_recall', e.target.value)}
                  rows={4}
                />
              </div>
              <div className="info-item">
                <div className="info-label">Typicality (1-10)</div>
                <input
                  className="editable-input"
                  type="number"
                  min="1"
                  max="10"
                  value={editData?.dietary_typicality || ''}
                  onChange={(e) => handleFieldChange('dietary_typicality', e.target.value)}
                />
              </div>
              <div className="info-item">
                <div className="info-label">Diet Preference Mode</div>
                <input
                  className="editable-input"
                  value={editData?.dietary_preference_mode || ''}
                  onChange={(e) => handleFieldChange('dietary_preference_mode', e.target.value)}
                />
              </div>
              <div className="info-item">
                <div className="info-label">Days Exercising / Week</div>
                <input
                  className="editable-input"
                  type="number"
                  min="1"
                  max="7"
                  value={editData?.exercise_days_per_week || ''}
                  onChange={(e) => handleFieldChange('exercise_days_per_week', e.target.value)}
                />
              </div>
            </div>

            <div className="info-item full-width">
              <div className="info-label">Preferred Cuisines</div>
              <textarea
                className="editable-textarea"
                value={editData?.preferred_cuisines || ''}
                onChange={(e) => handleFieldChange('preferred_cuisines', e.target.value)}
                rows={3}
              />
            </div>

            <div className="info-item full-width">
              <div className="info-label">Avoided Cuisines</div>
              <textarea
                className="editable-textarea"
                value={editData?.avoided_cuisines || ''}
                onChange={(e) => handleFieldChange('avoided_cuisines', e.target.value)}
                rows={3}
              />
            </div>

            <div className="info-item full-width">
              <div className="info-label">Weekly Exercise Routine</div>
              <textarea
                className="editable-textarea"
                value={editData?.weekly_exercise_routine || ''}
                onChange={(e) => handleFieldChange('weekly_exercise_routine', e.target.value)}
                rows={4}
              />
            </div>

            <div className="info-item full-width">
              <div className="info-label">Exercise Types</div>
              <textarea
                className="editable-textarea"
                value={editData?.exercise_types || ''}
                onChange={(e) => handleFieldChange('exercise_types', e.target.value)}
                rows={3}
              />
            </div>

            <div className="info-item full-width">
              <div className="info-label">Provider Notes</div>
              <textarea
                className="editable-textarea"
                value={editData?.provider_notes || ''}
                onChange={(e) => handleFieldChange('provider_notes', e.target.value)}
                rows={4}
              />
            </div>

            <button className="primary-button save-button" onClick={handleSave} disabled={saving}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Intake Updates'}
            </button>
          </section>

          <section className="detail-section card-glass">
            <h3>Test Details</h3>
            {biomarkers.length === 0 ? (
              <div style={{ color: '#777' }}>No biomarker tests recorded yet.</div>
            ) : (
              biomarkers.map((section) => (
                <div className="biomarker-section" key={section.section} style={{ marginBottom: 20 }}>
                  <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div className="section-title" style={{ fontWeight: 700 }}>{section.section}</div>
                    <div className="section-count" style={{ color: '#777' }}>{section.count} Biomarkers</div>
                  </div>

                  <div className="biomarker-cards">
                    {section.items.map((item) => (
                      <div className="biomarker-card" key={item.name} style={{ display: 'flex', alignItems: 'center', padding: 10, border: '1px solid #eee', borderRadius: 8, marginBottom: 8 }}>
                        <div className="biomarker-left" style={{ width: 60 }}>
                          <div className="biomarker-value" style={{ fontWeight: 700 }}>{item.value}</div>
                          <div className="biomarker-unit" style={{ fontSize: 12, color: '#777' }}>{item.unit}</div>
                        </div>
                        <div className="biomarker-mid" style={{ flex: 1, marginLeft: 10 }}>
                          <div className="biomarker-name" style={{ fontWeight: 600 }}>{item.name}</div>
                          <div className="biomarker-note" style={{ fontSize: 12, color: '#777' }}>{item.note}</div>
                        </div>
                        <div className={`biomarker-tag ${item.tag === 'OPTIMAL' || item.tag === 'NORMAL' ? 'tag-optimal' : 'tag-normal'}`} style={{ padding: '4px 8px', borderRadius: 12, fontSize: 12, background: item.tag === 'OPTIMAL' || item.tag === 'NORMAL' ? '#eaf5ec' : '#fdf4e7', color: item.tag === 'OPTIMAL' || item.tag === 'NORMAL' ? '#6b9b8a' : '#d27644' }}>
                          {item.tag}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="detail-section card-glass">
            <h3>Recommendation Plans</h3>
            {dashboardData?.recommendations && dashboardData.recommendations.length > 0 ? (
              <ul className="rec-list" style={{ paddingLeft: 20 }}>
                {dashboardData.recommendations.map((rec, index) => (
                  <li key={index} style={{ marginBottom: 8 }}>{rec}</li>
                ))}
              </ul>
            ) : (
              <div style={{ color: '#777' }}>No recommendations available.</div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default PatientDetailScreen;
