import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, Settings, Edit } from 'lucide-react';
import './CollectionStepsScreen.css';
import { verifyKitCode, updateClient } from '../api/user';
import { useAppContext } from '../context/AppContext';

const CollectionStepsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  // State to simulate progress
  const [isSampleCollected, setIsSampleCollected] = useState(false);
  const [kitCode, setKitCode] = useState((location.state as { kitCode?: string } | null)?.kitCode || '');
  const [kitLinked, setKitLinked] = useState(Boolean((location.state as { kitCode?: string } | null)?.kitCode));
  const [kitLoading, setKitLoading] = useState(false);
  const [kitError, setKitError] = useState('');
  const [dietaryRecall, setDietaryRecall] = useState('');
  const [exerciseRecall, setExerciseRecall] = useState('');
  const [collectionFinishedAt, setCollectionFinishedAt] = useState(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  });

  // Split date/time for better mobile-friendly inputs
  const splitDateTime = (iso?: string) => {
    if (!iso) return { date: '', time: '' };
    const parts = iso.split('T');
    return { date: parts[0] || '', time: (parts[1] || '').slice(0,5) };
  };
  const initialDT = splitDateTime(collectionFinishedAt);
  const [collectionDate, setCollectionDate] = useState(initialDT.date);
  const [collectionTime, setCollectionTime] = useState(initialDT.time);

  const combineDateTime = (date: string, time: string) => {
    if (!date) return '';
    return `${date}T${time || '00:00'}`;
  };

  const setNow = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setCollectionDate(date);
    setCollectionTime(time);
    setCollectionFinishedAt(`${date}T${time}`);
  };
  const [recallSaving, setRecallSaving] = useState(false);
  const [recallCollapsed, setRecallCollapsed] = useState(false);
  const [savedDietary, setSavedDietary] = useState('');
  const [savedExercise, setSavedExercise] = useState('');
  const [savedCollectionFinishedAt, setSavedCollectionFinishedAt] = useState('');

  const handleLinkKit = async () => {
    const code = kitCode.trim();
    if (!code) return;

    setKitLoading(true);
    setKitError('');

    try {
      const result = await verifyKitCode(code);
      if (result.valid) {
        setKitLinked(true);
      } else {
        setKitError(result.message || 'Kit code is invalid. Please check and try again.');
      }
    } catch (error) {
      console.error(error);
      setKitError('Failed to verify kit code. Please try again.');
    } finally {
      setKitLoading(false);
    }
  };

  const handleSaveDietaryRecall = async () => {
    if (!state.auth.clientId) {
      console.error('Client ID not found');
      return;
    }

    setRecallSaving(true);
    try {
      await updateClient(state.auth.clientId, {
        dietary_recall: dietaryRecall,
        exercise_recall: exerciseRecall,
        collection_finished_at: collectionFinishedAt ? new Date(collectionFinishedAt).toISOString() : null,
      });
      // store saved values and collapse the form
      setSavedDietary(dietaryRecall);
      setSavedExercise(exerciseRecall);
      setSavedCollectionFinishedAt(collectionFinishedAt);
      setRecallCollapsed(true);
      console.log('Dietary, exercise recall and collection time saved successfully');
    } catch (error) {
      console.error('Failed to save dietary recall:', error);
    } finally {
      setRecallSaving(false);
    }
  };

  return (
    <div className="steps-root">
      <header className="steps-header">
        <button className="steps-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Complete your Test</h1>
        <button className="steps-settings-btn">
          <Settings size={22} />
        </button>
      </header>

      <div className="steps-content">
        <div className="steps-intro">Follow the steps below</div>

        {/* Step 1: Link Your Kit */}
        <div className="step-item">
          <div className="step-indicator">
            <div className={`step-circle ${kitLinked ? 'completed' : 'active'}`}>
              <Check size={18} />
            </div>
            <div className="step-line"></div>
          </div>
          <div className="step-details">
            <div className="step-title">Link Your Kit</div>
            <div className="step-desc">Scan the barcode on your test kit or enter the code manually</div>
            <div className="step-card">
              {kitLinked ? (
                <div className="kit-linked-box">
                  <Check size={18} fill="#0f5132" />
                  <div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Kit Linked</div>
                    <div>Code: {kitCode}</div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="url-row" style={{ marginTop: 0 }}>
                    <input
                      className="url-input"
                      placeholder="Enter kit code"
                      value={kitCode}
                      onChange={(e) => {
                        setKitCode(e.target.value);
                        setKitError('');
                      }}
                      disabled={kitLoading}
                    />
                    <button className="link-btn" onClick={handleLinkKit} disabled={kitLoading}>
                      {kitLoading ? 'Verifying...' : 'Link'}
                    </button>
                  </div>
                  <button
                    className="scan-cta"
                    style={{ marginTop: 12 }}
                    onClick={() => navigate('/collection/scan')}
                  >
                    <Camera size={18} />
                    <span>Scan with Camera</span>
                  </button>
                  {kitError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{kitError}</div>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Collect Your Sample (Active) */}
        <div className="step-item">
          <div className="step-indicator">
            <div className={`step-circle ${!isSampleCollected ? 'active' : 'completed'}`}>
              {isSampleCollected ? <Check size={18} /> : <Check size={18} style={{ opacity: 0.3 }} />}
              {/* Note: Icon usage here is a bit tricky, usually active step has a number or dot, using check for consistency with design mock which shows checkmark circle */}
            </div>
            <div className="step-line"></div>
          </div>
          <div className="step-details">
            <div className="step-title">Collect Your Sample</div>
            <div className="step-desc">Watch the instructional video and follow the steps to collect your sample</div>

            {!isSampleCollected && (
              <div className="step-card">
                  <iframe
                    title="vimeo-player"
                    src="https://player.vimeo.com/video/1051338117?h=8f460a47f8"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                    allowFullScreen
                  />
                <button className="confirm-btn" onClick={() => setIsSampleCollected(true)}>
                  Confirm Sample Collected
                </button>
              </div>
            )}

            {isSampleCollected && (
              <div className="step-card">
                <div className="kit-linked-box" style={{ background: '#fce8f8', color: '#8a4b7d', borderColor: '#e0c0d8' }}>
                  <Check size={18} />
                  Sample Collected
                </div>
              </div>
            )}

            {isSampleCollected && (
              <div className="step-card">
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
                    When did you finish the collection?
                  </div>
                  {recallCollapsed ? (
                    <div className="recall-summary">
                        <div className="recall-row recall-row-top">
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                            <div className="recall-label">Collection finished:</div>
                            <div className="recall-value">{savedCollectionFinishedAt ? savedCollectionFinishedAt.replace('T', ' ') : 'Not set'}</div>
                          </div>
                          <button
                            className="recall-edit-btn"
                            onClick={() => setRecallCollapsed(false)}
                            aria-label="Edit recalls"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      <div className="recall-row">
                        <div className="recall-label">Dietary recall:</div>
                        <div className="recall-value">{savedDietary || 'Not provided'}</div>
                      </div>
                      <div className="recall-row">
                        <div className="recall-label">Exercise recall:</div>
                        <div className="recall-value">{savedExercise || 'Not provided'}</div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="collection-time-row" style={{ marginBottom: 12 }}>
                        <input
                          type="date"
                          value={collectionDate}
                          onChange={(e) => {
                            const d = e.target.value;
                            setCollectionDate(d);
                            const combined = combineDateTime(d, collectionTime);
                            setCollectionFinishedAt(combined);
                          }}
                        />
                        <input
                          type="time"
                          value={collectionTime}
                          onChange={(e) => {
                            const t = e.target.value;
                            setCollectionTime(t);
                            const combined = combineDateTime(collectionDate, t);
                            setCollectionFinishedAt(combined);
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
                        <button
                          type="button"
                          className="small-plain-btn"
                          onClick={setNow}
                          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e0e0e0', background: 'white', cursor: 'pointer' }}
                        >
                          Set to Now
                        </button>
                        <div style={{ fontSize: '0.9rem', color: '#555' }}>
                          Selected: {collectionFinishedAt.replace('T', ' ')}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
                        Tell us what you ate in the last 24 hours
                      </div>
                      <textarea
                        placeholder="24-hour dietary recall (e.g., breakfast: eggs and toast, lunch: chicken salad, dinner: pasta...)"
                        value={dietaryRecall}
                        onChange={(e) => setDietaryRecall(e.target.value)}
                        className="form-textarea"
                        rows={4}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontFamily: 'inherit', marginBottom: '12px' }}
                      />
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: 8, color: '#333' }}>
                        Tell us about your recent exercise
                      </div>
                      <textarea
                        placeholder="Exercise recall (e.g., walked 30 minutes, strength training, yoga...)"
                        value={exerciseRecall}
                        onChange={(e) => setExerciseRecall(e.target.value)}
                        className="form-textarea"
                        rows={3}
                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e0e0e0', fontFamily: 'inherit', marginBottom: '12px' }}
                      />
                      <button 
                        onClick={handleSaveDietaryRecall}
                        disabled={recallSaving}
                        style={{
                          padding: '10px 16px',
                          backgroundColor: '#6b9b8a',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          fontWeight: 600,
                          cursor: recallSaving ? 'not-allowed' : 'pointer',
                          opacity: recallSaving ? 0.6 : 1,
                        }}
                      >
                        {recallSaving ? 'Saving...' : 'Save Recall'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Ship Your Sample */}
        <div className="step-item">
          <div className="step-indicator">
            {/* Simulating this is next */}
            <div className={`step-circle ${isSampleCollected ? 'active' : ''}`} style={{ backgroundColor: isSampleCollected ? '#6b9b8a' : '#e0e0e0' }}>
              <Check size={18} style={{ opacity: isSampleCollected ? 1 : 0.3 }} />
            </div>
            <div className="step-line"></div>
          </div>
          <div className="step-details">
            <div className="step-title" style={{ opacity: isSampleCollected ? 1 : 0.6 }}>Ship Your Sample</div>
            <div className="step-desc" style={{ opacity: isSampleCollected ? 1 : 0.6 }}>Place your sample in the prepaid return envelope and ship it to our laboratory</div>

            {/* Show hypothetical shipped state if collected? Or keep it simple as per mockup which shows logic flow */}
            {/* The mockup shows this step as 'Active/Completed' with "Sample Shipped". Let's assume for this demo we stop at collection confirmation */}

            <div className="step-card" style={{ opacity: 0.6 }}>
              <div className="status-badge" style={{ background: isSampleCollected ? '#eaf5ec' : '#eee', color: isSampleCollected ? '#6b9b8a' : '#999' }}>
                <Check size={12} /> Pending...
              </div>
              <div className="tracking-info">Tracking: PENDING</div>
            </div>
          </div>
        </div>

        {/* Step 4: Lab Processing */}
        <div className="step-item">
          <div className="step-indicator">
            <div className="step-circle">
              <Check size={18} style={{ opacity: 0.3 }} />
            </div>
          </div>
          <div className="step-details">
            <div className="step-title" style={{ opacity: 0.6 }}>Lab Processing</div>
            <div className="step-desc" style={{ opacity: 0.6 }}>Waiting laboratory receive your sample. Results ready in 7-10 business days.</div>

            <div className="step-card" style={{ opacity: 0.6 }}>
              <div className="status-badge" style={{ background: '#eee', color: '#999' }}>
                <Check size={12} /> Pending
              </div>
              <div className="tracking-info">Received: --/--/----</div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="info-card">
          <h3>What Happens Next?</h3>
          <p>
            Your sample is being analyzed by our laboratory. You will receive a notification when your results are ready. You can view your biomarker dashboard to see detailed insights.
          </p>
          <button className="dashboard-btn" onClick={() => navigate('/home')}>
            View Dashboard ➜
          </button>
        </div>

      </div>
    </div>
  );
};

export default CollectionStepsScreen;
