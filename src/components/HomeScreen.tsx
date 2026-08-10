import { useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { useAppContext } from '../context/AppContext';



import './HomeScreen.css';

import BottomNav from './BottomNav';

import omiver from '../assets/omiver.svg';

import { fetchDashboard, fetchClient, setCustomProfileKey, getCustomProfileKey, fetchBiomarkerTests, fetchBiomarkerTestDetail, fetchRecommendations, fetchBiomarkerReports, type BiomarkerSection, type Dashboard, type BiomarkerTest, type BiomarkerTestDetail } from '../api/user';



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



  const [biomarkerTests, setBiomarkerTests] = useState<BiomarkerTest[]>([]);

  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);

  const [selectedTestDetail, setSelectedTestDetail] = useState<BiomarkerTestDetail | null>(null);

  const [selectedTestRecs, setSelectedTestRecs] = useState<string[]>([]);

  const [loadingDetail, setLoadingDetail] = useState(false);

  const [viewMode, setViewMode] = useState<'category' | 'flat'>('category');

  const [hasReports, setHasReports] = useState(false);



  useEffect(() => {

    if (clientId) {

      fetchDashboard(clientId).then((data) => {

        setDashboardData(data);

      }).catch((error) => console.error(error));



      fetchBiomarkerTests(clientId).then((data) => {

        setBiomarkerTests(data);

      }).catch((error) => console.error(error));

      fetchBiomarkerReports(clientId).then((data) => {

        setHasReports(data.length > 0);

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

        const testData = await fetchBiomarkerTests(clientId);

        setBiomarkerTests(testData);

      }

    } catch (err) {

      console.error(err);

      setCustomProfileKey(null);

      setUnlockError('An error occurred during decryption. Please try again.');

    } finally {

      setUnlocking(false);

    }

  };



  const handleSelectTest = async (testId: number) => {

    setSelectedTestId(testId);

    setLoadingDetail(true);

    setViewMode('category');

    try {

      const detail = await fetchBiomarkerTestDetail(testId);

      setSelectedTestDetail(detail);

      const recsData = await fetchRecommendations(clientId!, testId);

      const texts = recsData.map(r => r.text || '').filter(t => !!t);

      setSelectedTestRecs(texts);

    } catch (error) {

      console.error("Failed to load test details/recommendations:", error);

    } finally {

      setLoadingDetail(false);

    }

  };



  const selectedTestMetadata = useMemo(() => {

    if (!selectedTestDetail?.data?.result) return null;

    const total = selectedTestDetail.data.result.length;

    const optimal = selectedTestDetail.data.result.filter((r: any) => r.status === 'OPTIMAL' || r.status === 'Optimal').length;

    const healthScore = total > 0 ? Math.round((optimal / total) * 100) : 0;

    return {

      total,

      optimal,

      toWatch: total - optimal,

      healthScore

    };

  }, [selectedTestDetail]);



  const ionNameMap = useMemo(() => {

    const map: Record<number, string> = {};

    selectedTestDetail?.data?.result?.forEach((r: any) => {

      map[r.biomarker] = r.name;

    });

    return map;

  }, [selectedTestDetail]);



  const ionDescMap = useMemo(() => {
    const map: Record<number, string> = {};

    selectedTestDetail?.data?.result?.forEach((r: any) => {
      const info = r.additional_information;
      if (info) {
        map[r.biomarker] = `Formula: ${info.ionTopFormula || 'N/A'} | m/z: ${info.ionMz || 'N/A'} | Mod: ${info.ionTopMod || 'N/A'}`;
      } else {
        map[r.biomarker] = 'No metadata available.';
      }
    });

    return map;
  }, [selectedTestDetail]);



  const selectedTestBiomarkers = useMemo(() => {

    if (!selectedTestDetail?.data?.result) return [];

    const grouped: Record<string, any[]> = {};

    selectedTestDetail.data.result.forEach((r: any) => {

      const cat = r.category || 'General';

      if (!grouped[cat]) {

        grouped[cat] = [];

      }

      grouped[cat].push(r);

    });

    return Object.entries(grouped).map(([section, results]) => ({

      section,

      count: results.length,

      items: results.map((r: any) => ({

        value: r.value,

        unit: r.unit,

        name: r.biomarker_name,

        note: r.normal_range,

        tag: r.status,

      })),

    }));

  }, [selectedTestDetail]);



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



  const criticalBiomarkers = useMemo(() => {

    const list: Array<{ name: string; value: number; unit: string; tag: string; section: string }> = [];

    biomarkers.forEach(sec => {

      sec.items.forEach(item => {

        if (item.tag !== 'OPTIMAL' && item.tag !== 'Optimal') {

          list.push({ ...item, section: sec.section });

        }

      });

    });

    // Sort LOW/HIGH first (highest priority) and NORMAL last (lower priority)
    return list.sort((a, b) => {
      const aCritical = (a.tag === 'LOW' || a.tag === 'HIGH' || a.tag === 'Low' || a.tag === 'High') ? 0 : 1;
      const bCritical = (b.tag === 'LOW' || b.tag === 'HIGH' || b.tag === 'Low' || b.tag === 'High') ? 0 : 1;
      return aCritical - bCritical;
    });

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



          {biomarkerTests.length > 0 && selectedTestId === null && (

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>

              <section className="biomarker-tests-section" style={{

                background: '#ffffff',

                border: '1px solid #eee',

                borderRadius: '16px',

                padding: '16px',

                display: 'flex',

                flexDirection: 'column',

                gap: '12px'

              }}>

                <h3 style={{ margin: 0, fontSize: '1rem', color: '#111' }}>Your Biomarker Tests</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                  {biomarkerTests.map((test) => {

                    const testDate = new Date(test.recorded_at).toLocaleDateString(undefined, {

                      year: 'numeric',

                      month: 'long',

                      day: 'numeric'

                    });

                    return (

                      <div

                        key={test.id}

                        onClick={() => handleSelectTest(test.id)}

                        className="test-slot-card"

                        style={{

                          background: '#fcfcfc',

                          border: '1px solid #e5e7eb',

                          borderRadius: '12px',

                          padding: '14px',

                          cursor: 'pointer',

                          transition: 'all 0.2s ease',

                          display: 'flex',

                          justifyContent: 'space-between',

                          alignItems: 'center'

                        }}

                      >

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'left' }}>

                          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>

                            Test Report — {testDate}

                          </span>

                          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>

                            {test.result_count ?? 0} biomarkers analyzed

                          </span>

                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>

                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#d97736' }}>

                            View Report

                          </span>

                          <span style={{ color: '#d97736', fontSize: '1rem' }}>→</span>

                        </div>

                      </div>

                    );

                  })}

                </div>

              </section>

            </div>

          )}



          {selectedTestId !== null && (

            <div style={{ display: 'flex', flexDirection: 'column', marginTop: '16px' }}>

              <button onClick={() => { setSelectedTestId(null); setSelectedTestDetail(null); setSelectedTestRecs([]); }} style={{

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

                ← Back to Tests

              </button>



              {loadingDetail ? (

                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>

                  <div style={{ fontSize: '1rem', fontWeight: 600 }}>Loading biomarker results...</div>

                </div>

              ) : !selectedTestDetail ? (

                <div style={{ textAlign: 'center', padding: '40px 0', color: '#666' }}>

                  No results found for this test.

                </div>

              ) : (

                <>

                  <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #f3f4f6' }}>

                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#111' }}>

                      Report for {new Date(selectedTestDetail?.recorded_at || '').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}

                    </h3>

                  </div>



                  <div style={{

                    background: '#f8fafc',

                    border: '1px solid #e2e8f0',

                    borderRadius: '14px',

                    padding: '16px',

                    marginBottom: '16px',

                    display: 'flex',

                    flexDirection: 'column',

                    gap: '10px',

                    textAlign: 'left'

                  }}>

                    <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#1e293b', fontWeight: 700 }}>🧪 Test Session Metadata</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: '0.82rem', color: '#475569' }}>

                      <div>

                        <strong>Kit Used:</strong> <span style={{ color: '#0f172a' }}>{selectedTestDetail?.kit_name || 'Standard Test Kit'}</span>

                      </div>

                      <div>

                        <strong>Barcode:</strong> <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>{selectedTestDetail?.barcode_number || 'N/A'}</span>

                      </div>

                      <div>

                        <strong>Time of Test:</strong> <span style={{ color: '#0f172a' }}>{new Date(selectedTestDetail?.recorded_at || '').toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>

                      </div>

                      <div>

                        <strong>Test ID:</strong> <span style={{ color: '#0f172a', fontFamily: 'monospace' }}>#{selectedTestDetail?.id}</span>

                      </div>

                    </div>



                    {selectedTestDetail?.data && selectedTestDetail.data.result && (

                      <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px', marginTop: '6px' }}>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>

                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>

                            📁 Parsed Raw Lab Entries (TASSO / Mass Spec Data):

                          </span>

                        </div>





                        <div style={{

                          maxHeight: '200px',

                          overflowY: 'auto',

                          border: '1px solid #e2e8f0',

                          borderRadius: '8px',

                          background: '#fafafa'

                        }}>

                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', textAlign: 'left' }}>

                            <thead>

                              <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>

                                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Biomarker Name</th>

                                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569', width: '120px' }}>Value (Intensity)</th>

                                <th style={{ padding: '8px 12px', fontWeight: 600, color: '#475569' }}>Detail</th>

                              </tr>

                            </thead>

                            <tbody>

                              {selectedTestDetail.data.result.map((item: { biomarker: number; value: number; biomarker_name?: string; additional_information?: any }, idx: number) => {

                                const name = item.biomarker_name || ionNameMap[item.biomarker] || `Biomarker #${item.biomarker}`;

                                const info = item.additional_information;

                                const detailText = info

                                  ? `Formula: ${info.ionTopFormula || 'N/A'} | m/z: ${info.ionMz || 'N/A'} | Mod: ${info.ionTopMod || 'N/A'}`

                                  : ionDescMap[item.biomarker] || 'No metadata available.';

                                return (

                                  <tr key={idx} style={{ borderBottom: idx < selectedTestDetail.data.result.length - 1 ? '1px solid #f1f5f9' : 'none' }}>

                                    <td style={{ padding: '8px 12px', fontWeight: 600, color: '#0f172a' }}>{name}</td>

                                    <td style={{ padding: '8px 12px', color: '#d97736', fontWeight: 600, fontFamily: 'monospace' }}>

                                      {item.value.toLocaleString()}

                                    </td>

                                    <td style={{ padding: '8px 12px', color: '#4b5563', fontSize: '0.75rem' }}>{detailText}</td>

                                  </tr>

                                );

                              })}

                            </tbody>

                          </table>

                        </div>



                      </div>

                    )}

                  </div>



                  {selectedTestMetadata && (

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', textAlign: 'center', marginBottom: '16px' }}>

                      <div style={{ background: '#f8f8f8', padding: '10px', borderRadius: '10px' }}>

                        <div style={{ fontSize: '0.8rem', color: '#666' }}>Total</div>

                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginTop: '4px' }}>{selectedTestMetadata.total}</div>

                      </div>

                      <div style={{ background: '#e8f5ef', padding: '10px', borderRadius: '10px' }}>

                        <div style={{ fontSize: '0.8rem', color: '#2f6b54' }}>Optimal</div>

                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#2f6b54', marginTop: '4px' }}>{selectedTestMetadata.optimal}</div>

                      </div>

                      <div style={{ background: '#fef2f2', padding: '10px', borderRadius: '10px' }}>

                        <div style={{ fontSize: '0.8rem', color: '#991b1b' }}>To Watch</div>

                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#991b1b', marginTop: '4px' }}>{selectedTestMetadata.toWatch}</div>

                      </div>

                    </div>

                  )}



                  <div style={{

                    display: 'flex',

                    background: '#f3f4f6',

                    padding: '4px',

                    borderRadius: '10px',

                    marginBottom: '16px',

                    width: 'fit-content'

                  }}>

                    <button

                      onClick={() => setViewMode('category')}

                      style={{

                        background: viewMode === 'category' ? '#ffffff' : 'transparent',

                        border: 'none',

                        borderRadius: '8px',

                        padding: '6px 16px',

                        fontSize: '0.85rem',

                        fontWeight: 600,

                        color: viewMode === 'category' ? '#111827' : '#6b7280',

                        cursor: 'pointer',

                        boxShadow: viewMode === 'category' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',

                        transition: 'all 0.1s ease'

                      }}

                    >

                      By Category

                    </button>

                    <button

                      onClick={() => setViewMode('flat')}

                      style={{

                        background: viewMode === 'flat' ? '#ffffff' : 'transparent',

                        border: 'none',

                        borderRadius: '8px',

                        padding: '6px 16px',

                        fontSize: '0.85rem',

                        fontWeight: 600,

                        color: viewMode === 'flat' ? '#111827' : '#6b7280',

                        cursor: 'pointer',

                        boxShadow: viewMode === 'flat' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',

                        transition: 'all 0.1s ease'

                      }}

                    >

                      All Biomarkers ({selectedTestDetail.data.result.length})

                    </button>

                  </div>



                  {viewMode === 'flat' ? (

                    <div className="biomarker-cards" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

                      {selectedTestDetail.data.result.map((r: any) => (

                        <div className="biomarker-card" key={r.id} style={{

                          display: 'flex',

                          justifyContent: 'space-between',

                          alignItems: 'center',

                          background: '#ffffff',

                          border: '1px solid #eee',

                          borderRadius: '12px',

                          padding: '12px 16px'

                        }}>

                          <div className="biomarker-mid" style={{ textAlign: 'left', flex: 1 }}>

                            <div className="biomarker-name" style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>{r.biomarker_name}</div>

                            <div className="biomarker-category" style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '2px' }}>Category: {r.category || 'General'}</div>

                            <div className="biomarker-note" style={{ fontSize: '0.75rem', color: '#4b5563', marginTop: '4px' }}>{r.normal_range}</div>

                          </div>

                          <div className="biomarker-right" style={{ display: 'flex', alignItems: 'center', gap: '12px', textAlign: 'right' }}>

                            <div className="biomarker-left" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>

                              <div className="biomarker-value" style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#111827' }}>{r.value}</div>

                              <div className="biomarker-unit" style={{ fontSize: '0.75rem', color: '#6b7280' }}>{r.unit}</div>

                            </div>

                            <div className={`biomarker-tag ${r.status === 'OPTIMAL' || r.status === 'Optimal' || r.status === 'NORMAL' || r.status === 'Normal' ? 'tag-optimal' : 'tag-normal'}`} style={{

                              fontSize: '0.75rem',

                              fontWeight: 600,

                              padding: '4px 8px',

                              borderRadius: '6px'

                            }}>

                              {r.status}

                            </div>

                          </div>

                        </div>

                      ))}

                    </div>

                  ) : (

                    selectedTestBiomarkers.map((section) => (

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

                    ))

                  )}

                </>

              )}

            </div>

          )}



          <section className="recommendations">

            {selectedTestId !== null ? (

              <>

                <h3>Recommendations for this Test</h3>

                {selectedTestRecs.length === 0 ? (

                  <p className="rec-lead">No approved recommendations are available for this test session yet.</p>

                ) : (

                  <>

                    <p className="rec-lead">Based on your biomarker results for this test, your doctor has approved:</p>

                    <ul className="rec-list">

                      {selectedTestRecs.map((rec: string, index: number) => (

                        <li key={index}>{rec}</li>

                      ))}

                    </ul>

                  </>

                )}

              </>

            ) : biomarkerTests.length === 0 ? (

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

                {hasReports && (
                  <div className="plans-quick-links" style={{
                    marginTop: '16px',
                    padding: '16px',
                    background: '#f0fdf4',
                    borderRadius: '12px',
                    border: '1px solid #bbf7d0',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}>
                    <h4 style={{ margin: 0, color: '#166534', fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      🥗 Precision Diet & Exercise Plans Available
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#14532d', lineHeight: 1.4 }}>
                      Your personalized metabolic nutrition blueprints and physical training protocols have been generated!
                    </p>
                    <button
                      onClick={() => navigate('/recommendations')}
                      style={{
                        background: '#166534',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '4px',
                        width: 'fit-content'
                      }}
                    >
                      View Diet & Exercise Plans →
                    </button>
                  </div>
                )}
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

