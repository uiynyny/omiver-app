import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, CheckCircle2, Save, Info, Package, Link2Off 
} from 'lucide-react';
import './CollectionStepsScreen.css';
import { 
  unlinkBarcodeAssignment, 
  fetchClient, 
  fetchOrders, 
  getKitCollection,
  saveCollectionStep1,
  saveCollectionStep2,
  saveCollectionStep2Pouch,
  saveCollectionStep3,
  saveCollectionStep4,
  fetchCollectionProgress,
} from '../api/user';
import { useAppContext } from '../context/AppContext';

type StepNumber = 1 | 2 | 3 | 4 | 5;

const CollectionStepsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();

  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);

  // States
  const [kitCode, setKitCode] = useState((location.state as { kitCode?: string } | null)?.kitCode || '');
  const [linkedOrderId, setLinkedOrderId] = useState<number | null>(null);
  /** Arms the destructive unlink action; a second press carries it out. */
  const [confirmUnlink, setConfirmUnlink] = useState(false);

  // Step loading/error states
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  
  const [feedbackBanner, setFeedbackBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const feedbackTimeoutRef = useRef<number | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackBanner({ message, type });
    if (feedbackTimeoutRef.current) {
      window.clearTimeout(feedbackTimeoutRef.current);
    }
    feedbackTimeoutRef.current = window.setTimeout(() => {
      setFeedbackBanner(null);
      feedbackTimeoutRef.current = null;
    }, 5000);
  };

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        window.clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentStep]);

  // `kitCode` is read by the recovery effect below but must NOT be one of its
  // dependencies: the effect also *sets* it, and the barcode field writes to it
  // on every keystroke — which re-ran the whole three-request recovery on each
  // character typed, and stomped the user's input mid-edit. A ref gives the
  // effect the current value without subscribing it to changes.
  const kitCodeRef = useRef(kitCode);
  useEffect(() => { kitCodeRef.current = kitCode; }, [kitCode]);

  useEffect(() => {
    let isMounted = true;
    const recoverProgress = async () => {
      if (!state.auth.clientId) {
        if (isMounted) setLoading(false);
        return;
      }
      try {
        let maxStep: StepNumber = 1;
        let kCode = kitCodeRef.current;
        let lOrderId = (location.state as { orderId?: number } | null)?.orderId ?? null;

        const progress = await fetchCollectionProgress(state.auth.clientId).catch(() => null);
        if (progress?.step_progress) {
          const sp = progress.step_progress;
          if (sp.step1?.completed && sp.step1.barcode) {
            kCode = sp.step1.barcode;
            maxStep = Math.max(maxStep, 2) as StepNumber;
          }
          if (sp.step2?.completed) maxStep = Math.max(maxStep, 3) as StepNumber;
          if (sp.step2_pouch?.completed) maxStep = Math.max(maxStep, 4) as StepNumber;
          if (sp.step3?.completed) maxStep = Math.max(maxStep, 5) as StepNumber;
        }

        const clientData = await fetchClient(state.auth.clientId);
        if (clientData.collection_finished_at) {
          maxStep = Math.max(maxStep, 5) as StepNumber;
        }

        const orders = await fetchOrders(state.auth.clientId).catch(() => []);
        // An order is "done" once the lab has the sample; until then it is the
        // one the collection flow should attach to.
        const activeOrder = orders.find(
          (o: any) => o.status !== 'SAMPLE_DELIVERED' && o.status !== 'CANCELLED',
        );
        if (activeOrder) {
          lOrderId = activeOrder.id;
          const barcode = (activeOrder as any).barcode_number || (activeOrder as any).kit_barcode;
          if (barcode && !barcode.startsWith('KIT-') && barcode !== (activeOrder as any).order_number) {
            kCode = barcode;
            maxStep = Math.max(maxStep, 2) as StepNumber;
          }

          try {
            const data = await getKitCollection(activeOrder.id);
            if (data.kit_barcode && !data.kit_barcode.startsWith('KIT-') && data.kit_barcode !== activeOrder.order_number) {
              kCode = data.kit_barcode;
              maxStep = Math.max(maxStep, 2) as StepNumber;
            }
            if (data.collected_at) {
              maxStep = Math.max(maxStep, 3) as StepNumber;
            }
            if (data.status === 'COLLECTED') {
              maxStep = Math.max(maxStep, 4) as StepNumber;
            } else if (data.status === 'SHIPPING' || data.status === 'TESTING' || data.status === 'FINISHED') {
              maxStep = Math.max(maxStep, 5) as StepNumber;
            }
          } catch {
            // ignore
          }
        }

        if (isMounted) {
          setKitCode(kCode);
          setLinkedOrderId(lOrderId);
          setCurrentStep(maxStep);
        }
      } catch {
        // Recovery is best-effort: the wizard still works from step 1, so
        // surface it without blocking. (The raw error is deliberately not
        // logged — these responses carry PHI.)
        if (isMounted) {
          setApiError('We could not restore your previous progress. You can continue from step 1.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void recoverProgress();
    
    return () => {
      isMounted = false;
    };
    // `kitCode` is intentionally absent — see kitCodeRef above.
  }, [state.auth.clientId, location.state]);

  const handleLinkKit = async () => {
    const code = kitCode.trim();
    if (!code) {
      setApiError('Please enter or scan your barcode.');
      return;
    }
    if (!state.auth.clientId) {
      setApiError('Client account not found. Please log in again.');
      return;
    }

    setApiLoading(true);
    setApiError('');

    try {
      const res = await saveCollectionStep1(state.auth.clientId, code, linkedOrderId || undefined);
      if (res.success) {
        if (res.order_id) setLinkedOrderId(res.order_id);
        showFeedback('✓ Step 1 saved: Barcode registered and linked to account!', 'success');
        setCurrentStep(2);
      } else {
        setApiError('Barcode could not be verified. Please check the code and try again.');
      }
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message
        || 'Failed to save and link barcode. Please try again.';
      setApiError(msg);
      showFeedback(msg, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  /**
   * Detach the barcode from the account and reset collection progress.
   *
   * Without this a mis-scanned or mistyped barcode is unrecoverable from
   * inside the app — the wizard jumps straight to step 2 on the next visit and
   * there is no way back. Destructive, so it is gated behind a second press
   * (`confirmUnlink`) rather than a browser `confirm()` dialog.
   */
  const handleUnlinkKit = async () => {
    if (!state.auth.clientId) return;

    if (!confirmUnlink) {
      setConfirmUnlink(true);
      return;
    }

    setConfirmUnlink(false);
    setApiLoading(true);
    setApiError('');
    try {
      await unlinkBarcodeAssignment({
        barcode_number: kitCode,
        client_id: state.auth.clientId,
      });
      setKitCode('');
      setLinkedOrderId(null);
      setCurrentStep(1);
      showFeedback('Kit unlinked. You can register a different barcode.', 'success');
    } catch (error: unknown) {
      const msg = (error as { message?: string })?.message || 'Failed to unlink kit.';
      setApiError(msg);
      showFeedback(msg, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  const handleConfirmSampleCollected = async () => {
    if (!state.auth.clientId || !kitCode.trim()) {
      setApiError('Please link your kit barcode first.');
      return;
    }
    setApiLoading(true);
    setApiError('');

    try {
      const res = await saveCollectionStep2(state.auth.clientId, kitCode.trim(), linkedOrderId || undefined);
      if (res.success) {
        showFeedback('✓ Step 2 saved: Sample collection recorded!', 'success');
        setCurrentStep(3);
      }
    } catch (error: any) {
      const msg = error.message || 'Unable to save collection data right now. Please try again.';
      setApiError(msg);
      showFeedback(msg, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  const handleBarcodeInBox = async () => {
    setApiError('');
    setApiLoading(true);
    try {
      const res = await saveCollectionStep2Pouch(state.auth.clientId!, linkedOrderId || undefined);
      if (res.success) {
        showFeedback('✓ Specimen pouch confirmed inside kit box!', 'success');
        setCurrentStep(4);
      }
    } catch (err: any) {
      setApiError(err.message || 'Failed to confirm placement in database. Please try again.');
    } finally {
      setApiLoading(false);
    }
  };

  const handleSavePreparation = async () => {
    setApiLoading(true);
    setApiError('');
    try {
      const res = await saveCollectionStep3(state.auth.clientId!, linkedOrderId || undefined);
      if (res.success) {
        showFeedback('✓ Step 3 saved: Drop-off preparation recorded!', 'success');
        setCurrentStep(5);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to save Step 3 preparation.';
      setApiError(msg);
      showFeedback(msg, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  const handleMarkShipped = async () => {
    if (!linkedOrderId) {
      setApiError('Please link your barcode first so we know which order to ship.');
      return;
    }

    setApiError('');
    setApiLoading(true);
    try {
      const res = await saveCollectionStep4(state.auth.clientId!, linkedOrderId);
      if (res.success) {
        showFeedback('✓ Sample marked as shipped & tracking activated!', 'success');
        const to = window.setTimeout(() => {
          navigate('/kits?tab=orders');
        }, 1200);
        feedbackTimeoutRef.current = to;
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to update order status';
      setApiError(msg);
      showFeedback(msg, 'error');
    } finally {
      setApiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="screen wizard__loading">
        <div className="wizard__loading-inner" role="status" aria-busy="true">
          <span className="spinner" aria-hidden="true" />
          <p className="text-secondary">Loading your progress…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="wizard">
      <header className="wizard__header">
        <button className="icon-btn" onClick={() => navigate(-1)} aria-label="Go back">
          <ArrowLeft size={24} />
        </button>
        <h1 className="wizard__title">Sample Collection</h1>
        <div className="wizard__header-spacer" aria-hidden="true" />
      </header>
      
      <div className="wizard__progress">
        <div className="progress">
          <div className="progress__fill" style={{ width: `${(currentStep / 5) * 100}%` }}></div>
        </div>
      </div>

      <main className="wizard__body" aria-live="polite">
        {feedbackBanner && (
          <div className={`error-banner ${feedbackBanner.type === 'success' ? 'error-banner--success' : ''}`} role="alert">
            {feedbackBanner.type === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
            {feedbackBanner.message}
          </div>
        )}

        {apiError && (
          <div className="error-banner" role="alert">
            <Info size={18} />
            {apiError}
          </div>
        )}

        {currentStep > 1 && kitCode && (
          <div className="wizard__linked">
            <div className="wizard__linked-info">
              <span className="wizard__linked-label">Linked kit</span>
              <span className="wizard__linked-code">{kitCode}</span>
            </div>
            <div className="wizard__linked-actions">
              {confirmUnlink && (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setConfirmUnlink(false)}
                  disabled={apiLoading}
                >
                  Cancel
                </button>
              )}
              <button
                type="button"
                className="btn btn--sm wizard__unlink"
                onClick={handleUnlinkKit}
                disabled={apiLoading}
                aria-busy={apiLoading}
              >
                <Link2Off size={16} aria-hidden="true" />
                {confirmUnlink ? 'Confirm unlink — resets progress' : 'Unlink kit'}
              </button>
            </div>
          </div>
        )}

        <div className="wizard__step-container">
          {currentStep === 1 && (
          <div className="fade-in">
            <div className="wizard__step-header">
              <span className="section-label">Step 1 of 5</span>
              <h2 className="section-title">Link your kit</h2>
              <p className="text-secondary">
                Unbox your green Omiver test kit and register the unique barcode to associate the physical sample with your profile.
              </p>
            </div>
            <div className="wizard__step-content stack">
              <div className="field">
                <label className="field__label" htmlFor="kit-barcode">
                  Kit Barcode
                </label>
                <div className="wizard__barcode-row">
                  <input
                    id="kit-barcode"
                    className="input"
                    placeholder="e.g. TASSO-001"
                    value={kitCode}
                    onChange={(e) => {
                      setKitCode(e.target.value);
                      setApiError('');
                    }}
                    disabled={apiLoading}
                  />
                  <button 
                    className="icon-btn icon-btn--plain" 
                    onClick={() => navigate('/collection/scan')}
                    aria-label="Scan barcode with camera"
                    title="Scan with Camera"
                    disabled={apiLoading}
                  >
                    <Camera size={24} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

          {currentStep === 2 && (
          <div className="fade-in">
            <div className="wizard__step-header">
              <span className="section-label">Step 2 of 5</span>
              <h2 className="section-title">Collect your sample</h2>
              <p className="text-secondary">
                Follow the instruction manual to attach the micro-collection pod to your upper outer arm and draw your sample comfortably.
              </p>
            </div>
            <div className="wizard__step-content stack">
              <div className="wizard__video">
                <iframe
                  title="Collection Instructions Video"
                  src="https://player.vimeo.com/video/1051338117?h=8f460a47f8"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                />
              </div>
              <div className="card">
                <h3 className="card__title">Checklist</h3>
                <ol className="wizard__checklist">
                  <li>Clean site with alcohol prep pad.</li>
                  <li>Peel adhesive liner.</li>
                  <li>Apply to upper arm firmly.</li>
                  <li>Press actuator button until click.</li>
                  <li>Wait 2–5 minutes until filled.</li>
                  <li>Remove, invert gently 5 times.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

          {currentStep === 3 && (
          <div className="fade-in">
            <div className="wizard__step-header">
              <span className="section-label">Step 3 of 5</span>
              <h2 className="section-title">Seal the pouch</h2>
              <p className="text-secondary">
                Protect your sample during transit.
              </p>
            </div>
            <div className="wizard__step-content stack">
              <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                <Package size={48} style={{ color: 'var(--accent)', marginBottom: 'var(--sp-4)' }} />
                <p className="text-body">
                  Seal your collection tube inside the silver preservation pouch, then place the pouch back inside the green Omiver box.
                </p>
              </div>
            </div>
          </div>
        )}

          {currentStep === 4 && (
          <div className="fade-in">
            <div className="wizard__step-header">
              <span className="section-label">Step 4 of 5</span>
              <h2 className="section-title">Prepare for shipment</h2>
              <p className="text-secondary">
                Pack the kit securely inside the return shipping mailer.
              </p>
            </div>
            <div className="wizard__step-content stack">
              <div className="card">
                <ol className="wizard__checklist">
                  <li>Place closed green box inside poly mailer.</li>
                  <li>Seal envelope securely.</li>
                  <li>Affix prepaid return shipping label.</li>
                </ol>
              </div>
            </div>
          </div>
        )}

          {currentStep === 5 && (
          <div className="fade-in">
            <div className="wizard__step-header">
              <span className="section-label">Step 5 of 5</span>
              <h2 className="section-title">Ship your sample</h2>
              <p className="text-secondary">
                Drop off your prepaid package at any FedEx drop box or location.
              </p>
            </div>
            <div className="wizard__step-content stack">
               <div className="card">
                <h3 className="card__title">What happens next?</h3>
                <p className="text-secondary" style={{ marginTop: 'var(--sp-2)' }}>
                  Once received, our certified metabolomics laboratory processes your sample. Your personal biomarker report and precision diet/exercise recommendations will be generated automatically.
                </p>
              </div>
            </div>
          </div>
        )}
        </div>
      </main>

      <footer className="wizard__footer">
        <div className="wizard__footer-content">
          {currentStep === 1 && (
          <button 
            className="btn btn--primary btn--block" 
            onClick={handleLinkKit} 
            disabled={apiLoading}
            aria-busy={apiLoading}
          >
            {apiLoading ? <span className="spinner" aria-hidden="true" /> : <Save size={18} />}
            {apiLoading ? 'Saving...' : 'Save & Continue'}
          </button>
        )}
        {currentStep === 2 && (
          <button 
            className="btn btn--primary btn--block" 
            onClick={handleConfirmSampleCollected} 
            disabled={apiLoading}
            aria-busy={apiLoading}
          >
            {apiLoading ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={18} />}
            {apiLoading ? 'Saving...' : 'I have collected my sample'}
          </button>
        )}
        {currentStep === 3 && (
          <button 
            className="btn btn--primary btn--block" 
            onClick={handleBarcodeInBox} 
            disabled={apiLoading}
            aria-busy={apiLoading}
          >
            {apiLoading ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={18} />}
            {apiLoading ? 'Saving...' : 'I have sealed the pouch'}
          </button>
        )}
        {currentStep === 4 && (
          <button 
            className="btn btn--primary btn--block" 
            onClick={handleSavePreparation} 
            disabled={apiLoading}
            aria-busy={apiLoading}
          >
            {apiLoading ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={18} />}
            {apiLoading ? 'Saving...' : 'Box is packed'}
          </button>
        )}
        {currentStep === 5 && (
          <button 
            className="btn btn--primary btn--block" 
            onClick={handleMarkShipped} 
            disabled={apiLoading}
            aria-busy={apiLoading}
          >
            {apiLoading ? <span className="spinner" aria-hidden="true" /> : <CheckCircle2 size={18} />}
            {apiLoading ? 'Saving...' : 'I have dropped it off'}
          </button>
        )}
        </div>
      </footer>
    </div>
  );
};

export default CollectionStepsScreen;
