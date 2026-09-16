import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, Edit3 } from 'lucide-react';
import "barcode-detector/polyfill";
import './ScanKitScreen.css';

/**
 * Minimal shape of the BarcodeDetector API we rely on. The `barcode-detector`
 * polyfill imported above guarantees `window.BarcodeDetector` exists, but the
 * DOM lib does not yet ship types for it.
 */
interface DetectedBarcode {
  rawValue?: string;
}
interface BarcodeDetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}
type BarcodeDetectorCtor = new (opts: { formats: string[] }) => BarcodeDetectorLike;

const BARCODE_FORMATS = [
  'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'itf',
];

const ScanKitScreen: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(true);
  /**
   * Set on unmount. `startCamera` awaits `getUserMedia`, which can resolve
   * *after* the component is gone — without this flag the resolved stream is
   * assigned to a dead ref and the camera stays on. On iOS that is a visible,
   * user-alarming leak (the green indicator stays lit).
   */
  const unmountedRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const handleDetectedCode = useCallback((code: string) => {
    isScanningRef.current = false;
    stopCamera();
    navigate('/collection/steps', { state: { kitCode: code } });
  }, [navigate, stopCamera]);

  const startCamera = useCallback(async () => {
    setError('');
    isScanningRef.current = true;
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('Camera access is not available in this browser.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      // The await above yields; we may have been unmounted in the meantime.
      if (unmountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      if (unmountedRef.current) {
        stopCamera();
        return;
      }
      setCameraReady(true);

      const Detector = (window as unknown as { BarcodeDetector?: BarcodeDetectorCtor })
        .BarcodeDetector;
      if (!Detector) {
        setError('Barcode scanning is not supported in this browser.');
        return;
      }

      const detector = new Detector({ formats: BARCODE_FORMATS });

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || videoRef.current.readyState < 2 || !isScanningRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            const scannedValue = codes[0].rawValue?.trim();
            if (scannedValue) {
              handleDetectedCode(scannedValue);
            }
          }
        } catch {
          // Detection throws transiently while the video buffer is between
          // frames. Nothing actionable — the next tick will retry.
        }
      }, 900);
    } catch {
      // getUserMedia rejects for permission denial, no device, or a device
      // already in use. All three are recoverable by the Retry button.
      if (!unmountedRef.current) {
        setError('Unable to access the camera. Please allow camera permissions and try again.');
      }
    }
  }, [handleDetectedCode, stopCamera]);

  // Acquire the camera exactly once on mount, release it exactly once on
  // unmount. `startCamera`/`stopCamera` are stable (their own deps are stable),
  // so this does not re-run on detection — which was the original bug.
  useEffect(() => {
    unmountedRef.current = false;
    startCamera();
    return () => {
      unmountedRef.current = true;
      isScanningRef.current = false;
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  const isScanning = cameraReady && !error;

  return (
    <div className="screen scan-root">
      <header className="scan-header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h1 className="scan-title">Scan Barcode</h1>
        {/* Balances the back button so the title stays optically centred. */}
        <div className="scan-header__spacer" aria-hidden="true" />
      </header>

      <div className="camera-view">
        <video ref={videoRef} className="camera-feed" playsInline muted />

        {!cameraReady && !error && <div className="camera-feed-placeholder" aria-busy="true" />}

        <div className="scan-overlay">
          <div className="scan-reticle">
            <div className="scan-reticle-inner"></div>
            {isScanning && <div className="scan-line"></div>}
          </div>
          <p className="scan-instruction-text" aria-live="polite">
            Align the barcode within the frame to scan automatically
          </p>
        </div>

        {error && (
          <div className="scan-error-container">
            <div className="error-banner" role="alert">
              {error}
            </div>
            <button className="btn btn--primary" onClick={startCamera}>
              <RefreshCw size={18} />
              Retry Camera
            </button>
            <button className="btn btn--secondary" onClick={() => navigate('/collection/steps')}>
              <Edit3 size={18} />
              Enter manually
            </button>
          </div>
        )}
      </div>

      {!error && (
        <div className="scan-footer">
          <button className="btn btn--secondary btn--block" onClick={() => navigate('/collection/steps')}>
            Enter manually
          </button>
        </div>
      )}
    </div>
  );
};

export default ScanKitScreen;
