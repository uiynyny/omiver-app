import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, Settings } from 'lucide-react';
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
  const [recallSaving, setRecallSaving] = useState(false);

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
      });
      // Optionally show a success message or navigate
      console.log('Dietary recall saved successfully');
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
                  src="https://player.vimeo.com/video/759587605?fl=pl&fe=sh" 
                  width="100%" 
                  height="300" 
                  frameBorder="0" 
                  allow="autoplay; fullscreen; picture-in-picture" 
                  allowFullScreen
                  style={{ borderRadius: '8px', marginBottom: '12px' }}
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
                  <button 
                    onClick={handleSaveDietaryRecall}
                    disabled={recallSaving || !dietaryRecall.trim()}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: '#6b9b8a',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: recallSaving || !dietaryRecall.trim() ? 'not-allowed' : 'pointer',
                      opacity: recallSaving || !dietaryRecall.trim() ? 0.6 : 1,
                    }}
                  >
                    {recallSaving ? 'Saving...' : 'Save Dietary Recall'}
                  </button>
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
