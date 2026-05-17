import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

// @ts-ignore - polyfill package may not provide TypeScript declarations
import "@sec-ant/barcode-detector"; // Polyfill for broader browser support
import './ScanKitScreen.css';

const ScanKitScreen: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    const stopCamera = () => {
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };

    const handleDetectedCode = (code: string) => {
      setIsScanning(false);
      stopCamera();
      navigate('/collection/steps', { state: { kitCode: code } });
    };

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Camera access is not available in this browser.');
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setCameraReady(true);

        const BarcodeDetectorCtor = (window as typeof window & { BarcodeDetector?: typeof BarcodeDetector }).BarcodeDetector;
        if (!BarcodeDetectorCtor) {
          setError('Barcode scanning is not supported in this browser.');
          return;
        }

        const detector = new BarcodeDetectorCtor({
          formats: ['code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'itf'],
        });

        scanIntervalRef.current = window.setInterval(async () => {
          if (!videoRef.current || videoRef.current.readyState < 2 || !isScanning) return;
          try {
            const codes = await detector.detect(videoRef.current);
            if (codes.length > 0) {
              const scannedValue = codes[0].rawValue?.trim();
              if (scannedValue) {
                handleDetectedCode(scannedValue);
              }
            }
          } catch (scanError) {
            console.error(scanError);
          }
        }, 900);
      } catch (cameraError) {
        console.error(cameraError);
        setError('Unable to access the camera. Please allow camera permissions and try again.');
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      if (scanIntervalRef.current) {
        window.clearInterval(scanIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isScanning, navigate]);

  // scanning is fully automatic via BarcodeDetector; no manual capture controls required

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
        <video ref={videoRef} className="camera-feed" playsInline muted />

        {!cameraReady && <div className="camera-feed-placeholder" />}

        <div className="scan-instruction-text">
          Align the barcode within the frame
        </div>

        {error && <div className="scan-error">{error}</div>}

        <div className="scan-overlay">
          <div className="scan-reticle">
            <div className="scan-reticle-inner"></div>
            {isScanning && <div className="scan-line"></div>}
          </div>
        </div>

        {/* Controls removed — scanning is automatic and captures detected barcodes */}
      </div>
    </div>
  );
};

export default ScanKitScreen;
