import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Image as ImageIcon } from 'lucide-react';
import './ScanKitScreen.css';

const ScanKitScreen: React.FC = () => {
  const navigate = useNavigate();
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    // Simulate finding a code after a few seconds if we wanted auto-scan
    // For now, we'll let the user click the capture button for "manual" control
    // or just assume it's always "scanning" visually
  }, []);

  const handleCapture = () => {
    // Simulate successful scan
    setIsScanning(false);
    setTimeout(() => {
      navigate('/collection/steps');
    }, 500);
  };

  const toggleFlashlight = () => {
    setFlashlightOn(!flashlightOn);
  };

  return (
    <div className="scan-root">
      <header className="scan-header">
        <button className="scan-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1 className="scan-title">Scan QR Code</h1>
        <div style={{ width: 40 }}></div> {/* Spacer */}
      </header>

      <div className="camera-view">
        {/* Placeholder for camera feed - using a subtle gradient or pattern */}
        <div className="camera-feed-placeholder" style={{ 
          background: 'radial-gradient(circle, #333 0%, #111 100%)' 
        }}></div>

        <div className="scan-instruction-text">
          Align the QR code within the frame
        </div>

        <div className="scan-overlay">
          <div className="scan-reticle">
            <div className="scan-reticle-inner"></div>
            {isScanning && <div className="scan-line"></div>}
          </div>
        </div>

        <div className="scan-controls">
          <button className="scan-control-btn" onClick={() => { /* Open gallery logic */ }}>
            <ImageIcon size={24} />
          </button>
          
          <button className="scan-capture-btn" onClick={handleCapture}>
            <div className="scan-capture-inner"></div>
          </button>
          
          <button 
            className={`scan-control-btn ${flashlightOn ? 'active' : ''}`} 
            onClick={toggleFlashlight}
          >
            <Zap size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ScanKitScreen;
