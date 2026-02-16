import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Play, Settings } from 'lucide-react';
import './CollectionStepsScreen.css';

const CollectionStepsScreen: React.FC = () => {
  const navigate = useNavigate();
  // State to simulate progress
  const [isSampleCollected, setIsSampleCollected] = useState(false);

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

        {/* Step 1: Link Your Kit (Completed) */}
        <div className="step-item">
          <div className="step-indicator">
            <div className="step-circle completed">
              <Check size={18} />
            </div>
            <div className="step-line"></div>
          </div>
          <div className="step-details">
            <div className="step-title">Link Your Kit</div>
            <div className="step-desc">Scan the barcode on your test kit or enter the code manually</div>
            <div className="step-card">
              <div className="kit-linked-box">
                <Check size={18} fill="#0f5132" />
                <div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Kit Linked</div>
                  <div>Code: JSAI5B9K5K5J5K5J5H</div>
                </div>
              </div>
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
                <div className="video-placeholder">
                  <div className="play-button">
                    <Play size={20} fill="white" style={{ marginLeft: 3 }} />
                  </div>
                </div>
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
