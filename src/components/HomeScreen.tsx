import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HeartPulse } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

import './HomeScreen.css';
import BottomNav from './BottomNav';
import omiver from '../assets/omiver.svg';
import { fetchDashboard, fetchClient, setCustomProfileKey, getCustomProfileKey, type BiomarkerSection, type Dashboard } from '../api/user';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const personal = state.registration;
  const displayName = `${state.registration.first_name ?? ''} ${state.registration.last_name ?? ''}`.trim();
  
  const isLocked = !!state.registration.use_custom_key && !getCustomProfileKey();
  const [unlockKey, setUnlockKey] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  const clientId = state.auth.clientId;
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);

  useEffect(() => {
    if (clientId) {
      fetchDashboard(clientId).then((data) => {
        setDashboardData(data);
      }).catch((error) => console.error(error));
    }
  }, [clientId]);

  const handleUnlock = async () => {
    if (!unlockKey.trim() || !clientId) return;
    setUnlocking(true);
    setUnlockError('');
    try {
      setCustomProfileKey(unlockKey);
      const clientData = await fetchClient(clientId);
      if (clientData.first_name === '[Locked]' || clientData.last_name === '[Locked]') {
        setCustomProfileKey(null);
        setUnlockError('Incorrect passphrase. Please try again.');
      } else {
        dispatch({
          type: 'UPDATE_REGISTRATION',
          payload: clientData,
        });
        const dashData = await fetchDashboard(clientId);
        setDashboardData(dashData);
      }
    } catch (err) {
      console.error(err);
      setCustomProfileKey(null);
      setUnlockError('An error occurred during decryption. Please try again.');
    } finally {
      setUnlocking(false);
    }
  };

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

  const age = useMemo(() => {
    if (!personal.date_of_birth) return undefined;
    const b = new Date(personal.date_of_birth);
    const diff = Date.now() - b.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }, [personal.date_of_birth]);

  const heightFormatted = useMemo(() => {  
    const h = personal.height;
    if (!h) return '—';
    if (typeof h === 'number') {
      const feet = Math.floor(h / 12);
      const inches = h % 12;
      return `${feet} ft ${inches} in`;
    }
  }, [dashboardData?.profile?.height, personal.height]);

  const [showFullReport, setShowFullReport] = useState(false);

  const criticalBiomarkers = useMemo(() => {
    const list: Array<{ name: string; value: number; unit: string; tag: string; section: string }> = [];
    biomarkers.forEach(sec => {
      sec.items.forEach(item => {
        if (item.tag === 'LOW' || item.tag === 'HIGH' || item.tag === 'Low' || item.tag === 'High') {
          list.push({ ...item, section: sec.section });
        }
      });
    });
    return list;
  }, [biomarkers]);

  return (
    <div className="screen-root">
      <header className="home-header">
        <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
      </header>

      <main className="home-main">
        {isLocked && (
          <div className="unlock-profile-card" style={{
            background: '#fff2eb',
            border: '1px solid #ffdecb',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ margin: 0, color: '#d97736', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔒 Profile Locked (Offline Encryption)
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#666', lineHeight: 1.4 }}>
              Your profile first and last name are encrypted offline with a custom key. Please enter your passphrase to unlock.
            </p>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <input
                type="password"
                placeholder="Enter Encryption Key..."
                value={unlockKey}
                onChange={(e) => setUnlockKey(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #ddd',
                  fontSize: '0.95rem'
                }}
              />
              <button
                onClick={handleUnlock}
                disabled={unlocking || !unlockKey.trim()}
                style={{
                  background: '#d97736',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 16px',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  opacity: (unlocking || !unlockKey.trim()) ? 0.7 : 1
                }}
              >
                {unlocking ? 'Unlocking...' : 'Unlock'}
              </button>
            </div>
            {unlockError && (
              <span style={{ color: '#dc2626', fontSize: '0.82rem', fontWeight: 500 }}>{unlockError}</span>
            )}
          </div>
        )}
        <div className="top-summary">
          <section className="score-card">
            <div className='score' >
              <div className="score-left">
                <div className="score-label">Overall Health Score</div>
                <div className="score-value">{dashboardData?.health_score ?? 0}%</div>
              </div>
              <div className="score-right">
                <HeartPulse className='score-circle' size={36} strokeWidth={1} />
              </div>
            </div>

            <div className="score-bar">
              <div className="score-fill" style={{ width: `${dashboardData?.health_score ?? 0}%` }} />
              <div className="score-sub">{dashboardData?.optimal_biomarkers ?? 0} out of {dashboardData?.total_biomarkers ?? 0} biomarkers in optimal range</div>
            </div>
          </section>
        </div>
        <div className='bottom-card'>
          <section className="profile-summary">
            <div className="profile-summary-header">
              <h3>Profile Summary</h3>
            </div>
            <div className="profile-grid">
              <div className="profile-card">
                <div className="card-label">Name</div>
                <div className="card-value">{dashboardData?.profile?.name || displayName || '—'}</div>
              </div>
              <div className="profile-card">
                <div className="card-label">Age</div>
                <div className="card-value">{dashboardData?.profile?.age || age || '—'}</div>
              </div>
              <div className="profile-card">
                <div className="card-label">Height</div>
                <div className="card-value">{heightFormatted}</div>
              </div>
              <div className="profile-card">
                <div className="card-label">Weight</div>
                <div className="card-value">
                  {dashboardData?.profile?.weight || personal.weight
                    ? `${dashboardData?.profile?.weight || personal.weight} lbs`
                    : '—'}
                </div>
              </div>
            </div>
          </section>

          {biomarkers.length > 0 && !showFullReport && (
            <section className="report-abstract-card" style={{
              background: '#fcfcfc',
              border: '1px solid #eee',
              borderRadius: '16px',
              padding: '16px',
              marginTop: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px'
            }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: '#111' }}>Test Report Abstract</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center' }}>
                <div style={{ background: '#f8f8f8', padding: '10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>Total</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>{dashboardData?.total_biomarkers ?? 0}</div>
                </div>
                <div style={{ background: '#e8f5ef', padding: '10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#2f6b54' }}>Optimal</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2f6b54', marginTop: '4px' }}>{dashboardData?.optimal_biomarkers ?? 0}</div>
                </div>
                <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>To Watch</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#991b1b', marginTop: '4px' }}>
                    {(dashboardData?.total_biomarkers ?? 0) - (dashboardData?.optimal_biomarkers ?? 0)}
                  </div>
                </div>
              </div>

              {criticalBiomarkers.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#b91c1c' }}>Biomarkers to Watch ({criticalBiomarkers.length})</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                    {criticalBiomarkers.map(item => (
                      <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: '#fff5f5', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#333' }}>{item.name}</span>
                          <span style={{ fontSize: '0.7rem', color: '#888' }}>{item.section}</span>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>{item.value} {item.unit}</span>
                          <span style={{ fontSize: '0.7rem', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', background: '#fca5a5', color: '#991b1b' }}>{item.tag}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setShowFullReport(true)} className="order-kit-btn" style={{
                fontSize: '1rem',
                padding: '10px 20px',
                marginTop: '8px',
                width: '100%',
                fontWeight: 600,
                borderRadius: '12px'
              }}>
                View Full Report
              </button>
            </section>
          )}

          {biomarkers.length > 0 && showFullReport && (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>
              <button onClick={() => setShowFullReport(false)} style={{
                background: '#e5e7eb',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: '16px',
                width: 'fit-content',
                alignSelf: 'flex-start'
              }}>
                ← Back to Summary
              </button>

              {biomarkers.map((section) => (
                <section className="biomarker-section" key={section.section}>
                  <div className="section-header">
                    <div className="section-title">{section.section}</div>
                    <div className="section-count">{section.count} Biomarkers</div>
                  </div>

                  <div className="biomarker-cards">
                    {section.items.map((item: { value: number; unit: string; name: string; note: string; tag: string }) => (
                      <div className="biomarker-card" key={item.name}>
                        <div className="biomarker-left">
                          <div className="biomarker-value">{item.value}</div>
                          <div className="biomarker-unit">{item.unit}</div>
                        </div>
                        <div className="biomarker-mid">
                          <div className="biomarker-name">{item.name}</div>
                          <div className="biomarker-note">{item.note}</div>
                        </div>
                        <div className={`biomarker-tag ${item.tag === 'OPTIMAL' || item.tag === 'Optimal' ? 'tag-optimal' : 'tag-normal'}`}>
                          {item.tag}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}

          <section className="recommendations">
            {biomarkers.length === 0 ? (
              <div className="no-data-cta">
                <h3>Unlock Your Insights</h3>
                <p className="rec-lead">You haven't taken any biomarker tests yet. Order a test kit to begin tracking your health and receive personalized recommendations.</p>
                <button className="order-kit-btn" onClick={() => navigate('/kits')}>Order Test Kit</button>
              </div>
            ) : (
              <>
                <h3>Personalized Recommendations</h3>
                <p className="rec-lead">Based on your biomarker results and health goals, we recommend:</p>
                <ul className="rec-list">
                  {(dashboardData?.recommendations || []).map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </main>

      <BottomNav active="home" />
    </div>
  );
};

export default HomeScreen;

