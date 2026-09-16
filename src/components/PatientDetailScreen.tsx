import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CircleUserRound, Calendar, Mail, Package, Download, FileText } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { 
  updateClient, 
  type Patient, 
  fetchDashboard, 
  fetchRecommendations,
  downloadRecommendationPdf,
  type BiomarkerSection, 
  type Dashboard,
  type RecommendationResponse,
  getProviderPatients
} from '../api/user';

const PatientDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;

  const [patient, setPatient] = useState<Patient | undefined>(location.state?.patient as Patient | undefined);
  const [loadingPatient, setLoadingPatient] = useState(!location.state?.patient);
  const [patientError, setPatientError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [editData, setEditData] = useState<Patient | null>(patient ?? null);
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationResponse[]>([]);
  const [downloadingRecId, setDownloadingRecId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadPatient = async () => {
      if (patient) {
        setLoadingPatient(false);
        return;
      }
      if (!clientId || !id) {
        if (!cancelled) {
          setPatientError("Invalid patient or provider ID");
          setLoadingPatient(false);
        }
        return;
      }
      try {
        const patients = await getProviderPatients(clientId);
        const found = patients.find(p => String(p.id) === id);
        if (!cancelled) {
          if (found) {
            setPatient(found);
            setEditData(found);
          } else {
            setPatientError("Patient not found");
          }
        }
      } catch {
        if (!cancelled) {
          setPatientError("Failed to load patient");
        }
      } finally {
        if (!cancelled) setLoadingPatient(false);
      }
    };
    loadPatient();
    return () => { cancelled = true; };
  }, [clientId, id, patient]);

  useEffect(() => {
    let cancelled = false;
    if (patient?.id) {
      fetchDashboard(patient.id)
        .then(data => { if (!cancelled) setDashboardData(data); })
        .catch(() => {});
      fetchRecommendations(patient.id)
        .then(data => { if (!cancelled) setRecommendations(data); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
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

  if (loadingPatient) {
    return (
      <div className="screen">
        <div className="container stack" style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div className="spinner"></div>
          <p className="text-secondary">Loading patient...</p>
        </div>
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <div className="screen">
        <div className="container stack" style={{ alignItems: 'center', justifyContent: 'center', flex: 1 }}>
          <div className="error-banner" role="alert">{patientError || "Patient not found"}</div>
          <button onClick={() => navigate('/provider/dashboard')} className="btn btn--primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const age = patient.date_of_birth ?
    Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : 'N/A';

  const handleDownloadPdf = async (recId: number) => {
    try {
      setDownloadingRecId(recId);
      await downloadRecommendationPdf(recId);
    } catch {
      // Ignore download errors quietly as per original logic
    } finally {
      setDownloadingRecId(null);
    }
  };

  const handleFieldChange = (field: keyof Patient | string, value: string | number) => {
    setEditData((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = async () => {
    if (!editData?.id) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      const updated = await updateClient(editData.id, {
        dietary_recall: editData.dietary_recall,
        exercise_recall: editData.exercise_recall,
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
      setPatient(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error: unknown) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="screen">
      <header className="app-header">
        <button onClick={() => navigate('/provider/dashboard')} className="icon-btn" aria-label="Back to dashboard">
          <ArrowLeft size={20} />
        </button>
        <div className="app-header__title truncate">Patient Details</div>
        <div style={{ width: 44 }}></div>
      </header>

      <main className="container stack-lg" style={{ paddingBlock: 'var(--sp-6)' }}>
        <div className="card row" style={{ padding: 'var(--sp-6) var(--sp-4)' }}>
          <CircleUserRound size={64} strokeWidth={1} color="var(--accent)" />
          <div className="stack-sm">
            <h1 className="stat__value stat__value--display" style={{ fontSize: 'var(--fs-title)' }}>
              {patient.full_name || `${patient.first_name} ${patient.last_name}`}
            </h1>
            <div className="row text-secondary text-label">
              <Mail size={14} /> <span>{patient.email}</span>
            </div>
          </div>
        </div>

        <section className="card stack">
          <h2 className="section-title">Profile Information</h2>
          <div className="row-between" style={{ flexWrap: 'wrap', gap: 'var(--sp-4)' }}>
            <div className="stack-sm">
              <div className="stat__label">Age</div>
              <div className="stat__value">{age}</div>
            </div>
            <div className="stack-sm">
              <div className="stat__label">Gender</div>
              <div className="stat__value">{patient.gender || 'N/A'}</div>
            </div>
            <div className="stack-sm">
              <div className="stat__label">Height</div>
              <div className="stat__value">{patient.height ? `${patient.height} cm` : 'N/A'}</div>
            </div>
            <div className="stack-sm">
              <div className="stat__label">Weight</div>
              <div className="stat__value">{patient.weight ? `${patient.weight} kg` : 'N/A'}</div>
            </div>
          </div>
        </section>

        <section className="card stack">
          <h2 className="section-title">Health Summary</h2>
          <div className="row" style={{ gap: 'var(--sp-6)' }}>
            <div className="row">
              <Package size={24} color="var(--accent)" />
              <div className="stack-sm" style={{ marginLeft: 'var(--sp-2)' }}>
                <div className="stat__label">Total Orders</div>
                <div className="stat__value">{patient.total_orders || 0}</div>
              </div>
            </div>
            <div className="row">
              <Calendar size={24} color="var(--accent)" />
              <div className="stack-sm" style={{ marginLeft: 'var(--sp-2)' }}>
                <div className="stat__label">Latest Test</div>
                <div className="stat__value" style={{ fontSize: 'var(--fs-body)' }}>
                  {patient.latest_test_date ? new Date(patient.latest_test_date).toLocaleDateString() : 'No tests yet'}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="card stack">
          <h2 className="section-title">Diet & Exercise Intake</h2>
          {saveError && <div className="error-banner" role="alert">{saveError}</div>}
          {saveSuccess && <div className="error-banner" style={{ background: 'var(--optimal-soft)', color: 'var(--optimal)' }} role="status">Patient intake updated</div>}
          
          <div className="field">
            <label htmlFor="dietary_recall" className="field__label">24-hour Recall</label>
            <textarea
              id="dietary_recall"
              className="textarea"
              value={editData?.dietary_recall || ''}
              onChange={(e) => handleFieldChange('dietary_recall', e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="field">
            <label htmlFor="exercise_recall" className="field__label">24-hour Exercise Recall</label>
            <textarea
              id="exercise_recall"
              className="textarea"
              value={editData?.exercise_recall || ''}
              onChange={(e) => handleFieldChange('exercise_recall', e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="row" style={{ gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
            <div className="field spacer" style={{ minWidth: 150 }}>
              <label htmlFor="dietary_typicality" className="field__label">Typicality</label>
              <select
                id="dietary_typicality"
                className="select"
                value={editData?.dietary_typicality || ''}
                onChange={(e) => handleFieldChange('dietary_typicality', e.target.value)}
              >
                <option value="1">Unusual</option>
                <option value="2">Rarely</option>
                <option value="3">Sometimes</option>
                <option value="4">Often</option>
                <option value="5">Always</option>
              </select>
            </div>
            
            <div className="field spacer" style={{ minWidth: 150 }}>
              <label htmlFor="dietary_preference_mode" className="field__label">Diet Preference Mode</label>
              <input
                id="dietary_preference_mode"
                className="input"
                value={editData?.dietary_preference_mode || ''}
                onChange={(e) => handleFieldChange('dietary_preference_mode', e.target.value)}
              />
            </div>
            
            <div className="field spacer" style={{ minWidth: 150 }}>
              <label htmlFor="exercise_days_per_week" className="field__label">Days Exercising / Week</label>
              <input
                id="exercise_days_per_week"
                className="input"
                type="number"
                min="1"
                max="7"
                value={editData?.exercise_days_per_week || ''}
                onChange={(e) => handleFieldChange('exercise_days_per_week', e.target.value)}
              />
            </div>
          </div>
          
          <div className="field">
            <label htmlFor="preferred_cuisines" className="field__label">Preferred Cuisines</label>
            <textarea
              id="preferred_cuisines"
              className="textarea"
              value={editData?.preferred_cuisines || ''}
              onChange={(e) => handleFieldChange('preferred_cuisines', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="field">
            <label htmlFor="avoided_cuisines" className="field__label">Avoided Cuisines</label>
            <textarea
              id="avoided_cuisines"
              className="textarea"
              value={editData?.avoided_cuisines || ''}
              onChange={(e) => handleFieldChange('avoided_cuisines', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="field">
            <label htmlFor="weekly_exercise_routine" className="field__label">Weekly Exercise Routine</label>
            <textarea
              id="weekly_exercise_routine"
              className="textarea"
              value={editData?.weekly_exercise_routine || ''}
              onChange={(e) => handleFieldChange('weekly_exercise_routine', e.target.value)}
              rows={4}
            />
          </div>
          
          <div className="field">
            <label htmlFor="exercise_types" className="field__label">Exercise Types</label>
            <textarea
              id="exercise_types"
              className="textarea"
              value={editData?.exercise_types || ''}
              onChange={(e) => handleFieldChange('exercise_types', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="field">
            <label htmlFor="provider_notes" className="field__label">Provider Notes</label>
            <textarea
              id="provider_notes"
              className="textarea"
              value={editData?.provider_notes || ''}
              onChange={(e) => handleFieldChange('provider_notes', e.target.value)}
              rows={4}
            />
          </div>
          
          <button className="btn btn--primary" onClick={handleSave} disabled={saving} style={{ marginTop: 'var(--sp-4)' }}>
            {saving ? 'Saving...' : 'Save Intake Updates'}
          </button>
        </section>

        <section className="card stack">
          <h2 className="section-title">Test Details</h2>
          {biomarkers.length === 0 ? (
            <div className="text-secondary">No biomarker tests recorded yet.</div>
          ) : (
            biomarkers.map((section) => (
              <div className="stack" key={section.section} style={{ marginBottom: 'var(--sp-4)' }}>
                <div className="row-between">
                  <div className="section-label" style={{ color: 'var(--text)' }}>{section.section}</div>
                  <div className="text-tertiary text-label">{section.count} Biomarkers</div>
                </div>

                <div className="stack-sm">
                  {section.items.map((item) => (
                    <div className="row card card--inset" key={item.name} style={{ padding: 'var(--sp-3)' }}>
                      <div style={{ width: 60 }}>
                        <div className="stat__value" style={{ fontSize: 'var(--fs-body)' }}>{item.value}</div>
                        <div className="stat__unit" style={{ fontSize: 'var(--fs-label)', marginLeft: 0 }}>{item.unit}</div>
                      </div>
                      <div className="spacer">
                        <div className="text-body" style={{ fontWeight: 600 }}>{item.name}</div>
                        <div className="text-secondary text-label">{item.note}</div>
                      </div>
                      <div className={`chip ${item.tag === 'OPTIMAL' || item.tag === 'NORMAL' ? 'chip--optimal' : 'chip--risk'}`}>
                        {item.tag}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>

        <section className="card stack">
          <h2 className="section-title">Recommendation Plans</h2>
          {recommendations.length > 0 ? (
            <div className="stack-sm">
              {recommendations.map((rec) => (
                <div 
                  key={rec.id} 
                  className="row card card--inset"
                  style={{ flexWrap: 'wrap', gap: 'var(--sp-4)' }}
                >
                  <div className="spacer">
                    <div className="row">
                      <FileText size={18} color="var(--accent)" />
                      <strong className="text-body">Plan #{rec.id}</strong>
                      <span className={`chip ${rec.status === 'APPROVED' ? 'chip--optimal' : 'chip--watch'}`}>
                        {rec.status}
                      </span>
                    </div>
                    <p className="text-secondary text-label" style={{ marginTop: 'var(--sp-2)' }}>
                      {rec.text ? rec.text.slice(0, 100) + '...' : 'Personalized metabolic plan'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDownloadPdf(rec.id)}
                    disabled={downloadingRecId === rec.id}
                    className="btn btn--secondary btn--sm"
                  >
                    <Download size={14} />
                    <span>{downloadingRecId === rec.id ? 'Downloading...' : 'Download PDF'}</span>
                  </button>
                </div>
              ))}
            </div>
          ) : dashboardData?.recommendations && dashboardData.recommendations.length > 0 ? (
            <ul className="stack-sm" style={{ paddingLeft: 'var(--sp-4)', listStyleType: 'disc' }}>
              {dashboardData.recommendations.map((rec, index) => (
                <li key={index} className="text-body">{rec}</li>
              ))}
            </ul>
          ) : (
            <div className="text-secondary">No recommendations available.</div>
          )}
        </section>
      </main>
    </div>
  );
};

export default PatientDetailScreen;
