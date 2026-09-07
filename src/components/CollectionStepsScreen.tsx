import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, X, CheckCircle2, Save, Info, BookOpen, ShieldCheck, Package } from 'lucide-react';
import './CollectionStepsScreen.css';
import { 
  updateClient, 
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

const CollectionStepsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();

  // State to track collection progress
  const [isSampleCollected, setIsSampleCollected] = useState(false);
  const [kitCode, setKitCode] = useState((location.state as { kitCode?: string } | null)?.kitCode || '');
  const [kitLinked, setKitLinked] = useState(Boolean((location.state as { kitCode?: string } | null)?.kitCode));
  const [kitLoading, setKitLoading] = useState(false);
  const [kitError, setKitError] = useState('');
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [linkedOrderId, setLinkedOrderId] = useState<number | null>(null);
  const [collectionConfirmed, setCollectionConfirmed] = useState(false);
  const [finalizeError, setFinalizeError] = useState('');
  const [shippedLoading, setShippedLoading] = useState(false);
  const [shippedError, setShippedError] = useState('');
  const [preparedForShipment, setPreparedForShipment] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Step-by-step saving states and feedback
  const [savingStep1, setSavingStep1] = useState(false);
  const [savingStep2, setSavingStep2] = useState(false);
  const [savingStep3, setSavingStep3] = useState(false);
  const [savingStep4, setSavingStep4] = useState(false);
  const [step1SavedTime, setStep1SavedTime] = useState<string | null>(null);
  const [step2SavedTime, setStep2SavedTime] = useState<string | null>(null);
  const [step3SavedTime, setStep3SavedTime] = useState<string | null>(null);
  const [step4SavedTime, setStep4SavedTime] = useState<string | null>(null);
  const [feedbackBanner, setFeedbackBanner] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedbackBanner({ message, type });
    setTimeout(() => {
      setFeedbackBanner(null);
    }, 5000);
  };

  // Instructional modal state
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [instructionStep, setInstructionStep] = useState<number>(1);
  const [modalBarcode, setModalBarcode] = useState('');
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const recoverProgress = async () => {
      if (!state.auth.clientId) {
        setLoading(false);
        return;
      }
      try {
        // 1. Recover collection progress from backend progress endpoint
        const progress = await fetchCollectionProgress(state.auth.clientId).catch(() => null);
        if (progress?.step_progress) {
          const sp = progress.step_progress;
          if (sp.step1?.completed && sp.step1.barcode) {
            setKitCode(sp.step1.barcode);
            setModalBarcode(sp.step1.barcode);
            setKitLinked(true);
            setStep1SavedTime(sp.step1.saved_at ? new Date(sp.step1.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Saved');
          }
          if (sp.step2?.completed) {
            setIsSampleCollected(true);
            setStep2SavedTime(sp.step2.saved_at ? new Date(sp.step2.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Saved');
          }
          if (sp.step2_pouch?.completed) {
            setCollectionConfirmed(true);
          }
          if (sp.step3?.completed) {
            setPreparedForShipment(true);
            setStep3SavedTime(sp.step3.saved_at ? new Date(sp.step3.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Saved');
          }
          if (sp.step4?.completed) {
            setStep4SavedTime(sp.step4.saved_at ? new Date(sp.step4.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Saved');
          }
        }

        // 2. Recover collection progress from client profile
        const clientData = await fetchClient(state.auth.clientId);
        if (clientData.collection_finished_at) {
          setIsSampleCollected(true);
          setCollectionConfirmed(true);
          setPreparedForShipment(true);
          setStep2SavedTime(new Date(clientData.collection_finished_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }

        // 3. Recover barcode linkage from order history
        const orders = await fetchOrders(state.auth.clientId).catch(() => []);
        const activeOrder = orders.find(o => o.status !== 'FINISHED' && o.status !== 'CANCELLED');
        if (activeOrder) {
          setLinkedOrderId(activeOrder.id);
          const barcode = (activeOrder as any).barcode_number || (activeOrder as any).kit_barcode;
          if (barcode && !barcode.startsWith('KIT-') && barcode !== activeOrder.order_number) {
            setKitCode(barcode);
            setModalBarcode(barcode);
            setKitLinked(true);
            setStep1SavedTime('Linked');
          }

          try {
            const data = await getKitCollection(activeOrder.id);
            if (data.kit_barcode && !data.kit_barcode.startsWith('KIT-') && data.kit_barcode !== activeOrder.order_number) {
              setKitCode(data.kit_barcode);
              setModalBarcode(data.kit_barcode);
              setKitLinked(true);
              setStep1SavedTime('Linked');
            }
            if (data.collected_at) {
              setIsSampleCollected(true);
              setStep2SavedTime(new Date(data.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
            }
            if (data.status === 'COLLECTED') {
              setIsSampleCollected(true);
              setCollectionConfirmed(true);
              setPreparedForShipment(false);
            } else if (data.status === 'SHIPPING' || data.status === 'TESTING' || data.status === 'FINISHED') {
              setIsSampleCollected(true);
              setCollectionConfirmed(true);
              setPreparedForShipment(true);
            }
          } catch {
            // No collection session started yet
          }
        }
      } catch (err) {
        console.error('Failed to recover collection progress:', err);
      } finally {
        setLoading(false);
      }
    };

    recoverProgress();
  }, [state.auth.clientId]);

  useEffect(() => {
    const initOrderId = (location.state as any)?.orderId;
    if (initOrderId) {
      setLinkedOrderId(initOrderId);
      getKitCollection(initOrderId).then(data => {
        if (data.kit_barcode) {
          setKitCode(data.kit_barcode);
          setModalBarcode(data.kit_barcode);
          setKitLinked(true);
          setStep1SavedTime('Linked');
        }
        if (data.collected_at) {
          setIsSampleCollected(true);
          setStep2SavedTime(new Date(data.collected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
        if (data.status === 'COLLECTED') {
          setIsSampleCollected(true);
          setCollectionConfirmed(true);
        } else if (data.status === 'SHIPPING' || data.status === 'TESTING' || data.status === 'FINISHED') {
          setIsSampleCollected(true);
          setCollectionConfirmed(true);
          setPreparedForShipment(true);
        }
      }).catch(console.error);
    }
  }, [location.state]);

  // Step 1: Save & Link Barcode
  const handleLinkKit = async (): Promise<boolean> => {
    const code = kitCode.trim();
    if (!code) {
      setKitError('Please enter or scan your barcode.');
      return false;
    }

    if (!state.auth.clientId) {
      setKitError('Client account not found. Please log in again.');
      return false;
    }

    setKitLoading(true);
    setSavingStep1(true);
    setKitError('');
    setAssignmentMessage('');

    try {
      const orderIdToScan = linkedOrderId || (location.state as any)?.orderId;
      const res = await saveCollectionStep1(state.auth.clientId, code, orderIdToScan);

      if (res.success) {
        setKitLinked(true);
        if (res.order_id) setLinkedOrderId(res.order_id);
        const nowTime = new Date(res.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setStep1SavedTime(nowTime);
        setAssignmentMessage(res.message);
        showFeedback('✓ Step 1 saved: Barcode registered and linked to account!', 'success');
        return true;
      } else {
        setKitError('Barcode could not be verified. Please check the code and try again.');
        return false;
      }
    } catch (error: any) {
      console.error(error);
      const msg = error.message || 'Failed to save and link barcode. Please try again.';
      setKitError(msg);
      showFeedback(msg, 'error');
      return false;
    } finally {
      setKitLoading(false);
      setSavingStep1(false);
    }
  };

  const [unlinkLoading, setUnlinkLoading] = useState(false);

  const handleUnlinkKit = async () => {
    if (!state.auth.clientId) return;
    if (!window.confirm("Are you sure you want to unlink this kit? This will reset your collection progress for this kit.")) {
      return;
    }
    
    setUnlinkLoading(true);
    try {
      await unlinkBarcodeAssignment({
        barcode_number: kitCode,
        client_id: state.auth.clientId,
      });
      setKitCode('');
      setModalBarcode('');
      setKitLinked(false);
      setAssignmentMessage('');
      setKitError('');
      setIsSampleCollected(false);
      setCollectionConfirmed(false);
      setPreparedForShipment(false);
      setStep1SavedTime(null);
      setStep2SavedTime(null);
      setStep3SavedTime(null);
    } catch (err: any) {
      console.error("Error unlinking kit:", err);
      alert(err.message || "Failed to unlink kit.");
    } finally {
      setUnlinkLoading(false);
    }
  };

  // Step 2: Confirm & Save Sample Collection Data
  const handleConfirmSampleCollected = async () => {
    if (!state.auth.clientId || !kitLinked || !kitCode.trim()) {
      setFinalizeError('Please link your kit barcode first.');
      return false;
    }

    setSavingStep2(true);
    setFinalizeError('');

    try {
      const orderIdToConfirm = linkedOrderId || (location.state as any)?.orderId;
      const res = await saveCollectionStep2(state.auth.clientId, kitCode.trim(), orderIdToConfirm);

      if (res.success) {
        setIsSampleCollected(true);
        setCollectionConfirmed(true);
        const nowTime = new Date(res.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setStep2SavedTime(nowTime);
        showFeedback('✓ Step 2 saved: Sample collection recorded and timestamped!', 'success');
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Failed to save collection step:', error);
      const msg = error.message || 'Unable to save collection data right now. Please try again.';
      setFinalizeError(msg);
      showFeedback(msg, 'error');
      return false;
    } finally {
      setSavingStep2(false);
    }
  };

  // Step 2 sub-step: Confirm barcode placement in box
  const handleBarcodeInBox = async () => {
    setFinalizeError('');
    setSavingStep2(true);
    const orderIdToConfirm = linkedOrderId || (location.state as any)?.orderId;
    try {
      const res = await saveCollectionStep2Pouch(state.auth.clientId!, orderIdToConfirm);
      if (res.success) {
        setCollectionConfirmed(true);
        const nowTime = new Date(res.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setStep2SavedTime(nowTime);
        showFeedback('✓ Specimen pouch confirmed inside kit box!', 'success');
      }
    } catch (err: any) {
      console.error('Failed to confirm collection:', err);
      setFinalizeError(err.message || 'Failed to confirm placement in database. Please try again.');
    } finally {
      setSavingStep2(false);
    }
  };

  // Step 3: Save Packaging & Drop-off Status
  const handleSavePreparation = async () => {
    setSavingStep3(true);
    try {
      const orderIdToConfirm = linkedOrderId || (location.state as any)?.orderId;
      const res = await saveCollectionStep3(state.auth.clientId!, orderIdToConfirm);
      if (res.success) {
        setPreparedForShipment(true);
        const nowTime = new Date(res.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setStep3SavedTime(nowTime);
        showFeedback('✓ Step 3 saved: Drop-off preparation recorded in cloud!', 'success');
      }
    } catch (err: any) {
      console.error(err);
      showFeedback(err.message || 'Failed to save Step 3 preparation.', 'error');
    } finally {
      setSavingStep3(false);
    }
  };

  // Step 4: Save & Mark Shipped
  const handleMarkShipped = async () => {
    const orderIdToShip = linkedOrderId || (location.state as any)?.orderId;
    if (!orderIdToShip) {
      setShippedError('Please link your barcode first so we know which order to ship.');
      return;
    }

    setShippedError('');
    setSavingStep4(true);
    setShippedLoading(true);
    try {
      const res = await saveCollectionStep4(state.auth.clientId!, orderIdToShip);
      if (res.success) {
        const nowTime = new Date(res.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setStep4SavedTime(nowTime);
        showFeedback('✓ Step 4 saved: Sample marked as shipped & tracking activated!', 'success');
        setTimeout(() => {
          navigate('/kits?tab=orders');
        }, 1200);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update order status';
      console.error('Failed to update order status', err);
      setShippedError(message);
      showFeedback(message, 'error');
    } finally {
      setSavingStep4(false);
      setShippedLoading(false);
    }
  };

  // Modal Next / Save Handlers
  const handleModalSaveStep1 = async () => {
    const code = modalBarcode.trim() || kitCode.trim();
    if (!code) {
      setModalError('Please enter or scan your barcode code to continue.');
      return;
    }
    setModalSaving(true);
    setModalError('');
    try {
      setKitCode(code);
      if (state.auth.clientId) {
        const orderIdToScan = linkedOrderId || (location.state as any)?.orderId;
        const res = await saveCollectionStep1(state.auth.clientId, code, orderIdToScan);
        if (res.success) {
          setKitLinked(true);
          if (res.order_id) setLinkedOrderId(res.order_id);
          setStep1SavedTime(new Date(res.saved_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      }
      setInstructionStep(2);
    } catch (err: any) {
      console.error(err);
      setModalError(err.message || 'Failed to save barcode.');
      setInstructionStep(2);
    } finally {
      setModalSaving(false);
    }
  };

  const handleModalSaveStep2 = async () => {
    setModalSaving(true);
    setModalError('');
    try {
      if (kitLinked && kitCode.trim() && state.auth.clientId) {
        await handleConfirmSampleCollected();
      }
      setInstructionsOpen(false);
      setInstructionStep(1);
    } catch (err) {
      console.error(err);
      setInstructionsOpen(false);
    } finally {
      setModalSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="steps-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: 24, background: '#fff' }}>
        <div style={{ textAlign: 'center', color: '#417690' }}>
          <div style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8 }}>Loading your progress...</div>
          <div style={{ opacity: 0.6, fontSize: '0.9rem' }}>Please wait while Omiver restores your collection draft...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="steps-root">
      <header className="steps-header">
        <button className="steps-back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <h1>Sample Collection Guide</h1>
        <button className="steps-settings-btn"></button>
      </header>

      <div className="steps-content">
        {feedbackBanner && (
          <div style={{
            position: 'fixed',
            top: '70px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: feedbackBanner.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: feedbackBanner.type === 'success' ? '#166534' : '#991b1b',
            padding: '12px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600,
            fontSize: '0.9rem',
            width: '90%',
            maxWidth: '400px'
          }}>
            {feedbackBanner.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
            {feedbackBanner.message}
          </div>
        )}

        <div className="steps-intro-row">
          <div>
            <div className="steps-intro" style={{ margin: 0 }}>Follow the step-by-step instructions below</div>
            <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>Data is automatically saved at each step</div>
          </div>
          <button className="instructions-btn" type="button" onClick={() => setInstructionsOpen(true)}>
            <BookOpen size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />
            Quick Guide
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            STEP 1: Open Your Box and Scan Barcode
           ───────────────────────────────────────────────────────────── */}
        <div className="step-item">
          <div className="step-indicator">
            <div className={`step-circle ${kitLinked ? 'completed' : 'active'}`}>
              <Check size={18} />
            </div>
            <div className="step-line"></div>
          </div>
          <div className="step-details">
            <div className="step-title">Step 1: Open your box and scan barcode</div>
            <div className="step-desc">
              Unbox your green Omiver test kit and register the unique barcode to associate the physical sample with your health profile.
            </div>

            <div className="step-manual-guide">
              <h4>
                <Info size={16} color="#1b4332" />
                Step 1 Instructions:
              </h4>
              <ol className="manual-steps-list">
                <li><strong>Unpack the Kit:</strong> Open the green Omiver test box and verify all contents (collection device, alcohol wipe, bandage, silver foil bag, return mailer).</li>
                <li><strong>Locate the Barcode:</strong> Find the unique alphanumeric barcode printed on the bottom-right corner of the box or inside the sleeve label.</li>
                <li><strong>Scan or Enter:</strong> Use the camera scanner below or manually type the code, then tap <strong>Save & Link Barcode</strong>.</li>
              </ol>
            </div>

            <div className="step-card">
              {kitLinked ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="kit-linked-box" style={{ margin: 0 }}>
                    <CheckCircle2 size={20} color="#0f5132" />
                    <div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: 700 }}>Step 1 Completed & Saved</div>
                      <div>Linked Barcode: <strong>{kitCode}</strong></div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span className="save-status-badge">
                      <Check size={14} /> Data Saved in Database {step1SavedTime ? `(${step1SavedTime})` : ''}
                    </span>
                    <button 
                      onClick={handleUnlinkKit} 
                      disabled={unlinkLoading}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {unlinkLoading ? 'Unlinking...' : 'Change / Unlink Kit'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="url-row" style={{ marginTop: 0 }}>
                    <input
                      className="url-input"
                      placeholder="Enter kit barcode (e.g. TASSO-001)"
                      value={kitCode}
                      onChange={(e) => {
                        setKitCode(e.target.value);
                        setKitError('');
                      }}
                      disabled={kitLoading || savingStep1}
                    />
                    <button 
                      className="link-btn" 
                      onClick={handleLinkKit} 
                      disabled={kitLoading || savingStep1}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      {savingStep1 ? (
                        <>
                          <span className="save-spinner"></span>
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <Save size={15} />
                          <span>Save & Link</span>
                        </>
                      )}
                    </button>
                  </div>

                  <button
                    className="scan-cta"
                    style={{ marginTop: 12 }}
                    onClick={() => navigate('/collection/scan')}
                  >
                    <Camera size={18} />
                    <span>Scan Barcode with Camera</span>
                  </button>

                  {assignmentMessage && <div style={{ color: '#0f5132', fontSize: 13, marginTop: 8, fontWeight: 600 }}>{assignmentMessage}</div>}
                  {kitError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8, fontWeight: 600 }}>{kitError}</div>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            STEP 2: Place Collection Device on Arm & Collect Sample
           ───────────────────────────────────────────────────────────── */}
        <div className="step-item">
          <div className="step-indicator">
            <div className={`step-circle ${collectionConfirmed ? 'completed' : (kitLinked ? 'active' : '')}`}>
              {collectionConfirmed ? <Check size={18} /> : <Check size={18} style={{ opacity: kitLinked ? 1 : 0.3 }} />}
            </div>
            <div className="step-line"></div>
          </div>
          <div className="step-details">
            <div className="step-title">Step 2: Place the collection device on your arm (based on instruction manual)</div>
            <div className="step-desc">
              Follow the instruction manual to attach the micro-collection pod to your upper outer arm and draw your sample comfortably.
            </div>

            <div className="step-manual-guide">
              <h4>
                <ShieldCheck size={16} color="#1b4332" />
                Step 2 Instructions (Instruction Manual):
              </h4>
              <ol className="manual-steps-list">
                <li><strong>Clean the Site:</strong> Select an area on your upper outer arm (deltoid) with warm skin. Disinfect thoroughly with the included alcohol prep pad and allow to air dry for 10 seconds.</li>
                <li><strong>Peel Adhesive Liner:</strong> Grasp the red pull-tab and peel away the protective backing to expose the medical-grade skin adhesive.</li>
                <li><strong>Apply to Upper Arm:</strong> Place the device vertically on your sanitized upper arm and press firmly along the outer edges to ensure a tight seal.</li>
                <li><strong>Activate Collection:</strong> Firmly press the large top actuator button until you feel/hear a distinct click. Blood will begin drawing automatically.</li>
                <li><strong>Wait 2–5 Minutes:</strong> Keep your arm relaxed and resting downward by your side until the collection tube fills to the indicator line.</li>
                <li><strong>Remove & Invert:</strong> Gently peel the device from your arm, apply the bandage, invert the collection tube gently 5 times, and seal inside the silver preservation pouch.</li>
              </ol>
            </div>

            {!isSampleCollected && (
              <div className="step-card">
                <div style={{ marginBottom: 10, fontWeight: 600, color: '#334155' }}>Video Walkthrough:</div>
                <div className="video-container" style={{ width: '100%', aspectRatio: '16/9', borderRadius: 10, overflow: 'hidden', marginBottom: 14 }}>
                  <iframe
                    title="vimeo-player"
                    src="https://player.vimeo.com/video/1051338117?h=8f460a47f8"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="autoplay; fullscreen; encrypted-media"
                    allowFullScreen
                  />
                </div>

                {!kitLinked && (
                  <div style={{ color: '#b45309', marginBottom: 10, fontSize: '0.88rem', fontWeight: 600 }}>
                    ⚠️ Please complete Step 1 (Link your kit barcode) before saving collection data.
                  </div>
                )}

                {finalizeError && <div style={{ color: '#dc2626', marginBottom: 10, fontSize: '0.88rem', fontWeight: 600 }}>{finalizeError}</div>}

                <button 
                  className="save-action-btn" 
                  onClick={handleConfirmSampleCollected} 
                  disabled={!kitLinked || savingStep2}
                  title={!kitLinked ? 'Link your kit first' : ''}
                >
                  {savingStep2 ? (
                    <>
                      <span className="save-spinner"></span>
                      <span>Saving Collection Data...</span>
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      <span>Save & Confirm Sample Collection</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {isSampleCollected && (
              <div className="step-card">
                <div className="kit-linked-box" style={{ background: '#fce8f8', color: '#8a4b7d', borderColor: '#e0c0d8' }}>
                  <CheckCircle2 size={20} color="#8a4b7d" />
                  <div>
                    <div style={{ fontWeight: 700 }}>Step 2 Completed: Sample Collected</div>
                    <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Blood sample successfully drawn and sealed in preservation pouch.</div>
                  </div>
                </div>

                {step2SavedTime && (
                  <div className="save-status-badge" style={{ marginTop: 10 }}>
                    <Check size={14} /> Collection Recorded & Saved ({step2SavedTime})
                  </div>
                )}
              </div>
            )}

            {/* Placement in box confirmation */}
            {isSampleCollected && !collectionConfirmed && (
              <div className="step-card" style={{ marginTop: 10 }}>
                <div style={{ marginBottom: 6, fontWeight: 700, color: '#1e293b' }}>Confirm Specimen Pouch Placement:</div>
                <div className="barcode-instruction" style={{ marginBottom: 10 }}>
                  Place the sealed silver specimen pouch inside the green Omiver box.
                </div>
                {finalizeError && <div style={{ color: '#dc2626', marginBottom: 8 }}>{finalizeError}</div>}
                <button
                  className="save-action-btn secondary-save"
                  onClick={handleBarcodeInBox}
                  disabled={!kitLinked || savingStep2}
                >
                  {savingStep2 ? (
                    <>
                      <span className="save-spinner"></span>
                      <span>Saving Confirmation...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save & Confirm Pouch in Box</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            STEP 3: Prepare Your Sample for Shipment
           ───────────────────────────────────────────────────────────── */}
        <div className="step-item">
          <div className="step-indicator">
            <div className={`step-circle ${preparedForShipment ? 'completed' : (collectionConfirmed ? 'active' : '')}`}>
              {preparedForShipment ? <Check size={18} /> : <Check size={18} style={{ opacity: collectionConfirmed ? 1 : 0.3 }} />}
            </div>
            <div className="step-line"></div>
          </div>
          <div className="step-details">
            <div className="step-title">Step 3: Prepare your sample for shipment</div>
            <div className="step-desc">Pack the kit securely inside the return shipping mailer</div>

            <div className="step-manual-guide">
              <h4>
                <Package size={16} color="#1b4332" />
                Packaging Checklist:
              </h4>
              <ol className="manual-steps-list">
                <li>Place your sealed silver collection pouch with the desiccant into your green Omiver box.</li>
                <li>Slide the closed box inside the prepaid return poly mailer envelope.</li>
                <li>Peel the adhesive tape on the envelope flap and seal securely.</li>
                <li>Affix the included prepaid return shipping label to the outside.</li>
              </ol>
            </div>

            <div className="step-card">
              {!preparedForShipment ? (
                <button
                  className="save-action-btn"
                  onClick={handleSavePreparation}
                  disabled={!collectionConfirmed || !kitLinked || savingStep3}
                >
                  {savingStep3 ? (
                    <>
                      <span className="save-spinner"></span>
                      <span>Saving Drop-off Status...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save & Confirm Drop-off Preparation</span>
                    </>
                  )}
                </button>
              ) : (
                <div>
                  <div className="kit-linked-box" style={{ margin: 0 }}>
                    <CheckCircle2 size={18} />
                    <span>Package sealed and prepared for return transit.</span>
                  </div>
                  {step3SavedTime && (
                    <div className="save-status-badge" style={{ marginTop: 8 }}>
                      <Check size={14} /> Drop-off Prepared & Saved ({step3SavedTime})
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            STEP 4: Ship Your Sample & Track
           ───────────────────────────────────────────────────────────── */}
        <div className="step-item">
          <div className="step-indicator">
            <div className={`step-circle ${preparedForShipment ? 'active' : ''}`} style={{ backgroundColor: preparedForShipment ? '#6b9b8a' : '#e0e0e0' }}>
              <Check size={18} style={{ opacity: preparedForShipment ? 1 : 0.3 }} />
            </div>
            <div className="step-line"></div>
          </div>
          <div className="step-details">
            <div className="step-title" style={{ opacity: preparedForShipment ? 1 : 0.6 }}>Step 4: Ship your sample & track</div>
            <div className="step-desc" style={{ opacity: preparedForShipment ? 1 : 0.6 }}>
              Drop off your prepaid package at any FedEx drop box or location.
            </div>

            <div className="step-card" style={{ opacity: preparedForShipment ? 1 : 0.7 }}>
              <div className="status-badge" style={{ background: preparedForShipment ? '#eaf5ec' : '#eee', color: preparedForShipment ? '#6b9b8a' : '#999' }}>
                <Check size={12} /> {preparedForShipment ? 'Ready to Ship' : 'Pending Step 3'}
              </div>
              <div className="tracking-info">Transit Status: {preparedForShipment ? 'PREPARED / DROP-OFF READY' : 'PENDING'}</div>
            </div>

            {preparedForShipment && (
              <div style={{ marginTop: 10 }}>
                {shippedError && <div style={{ color: '#dc2626', marginBottom: 8, fontSize: '0.88rem' }}>{shippedError}</div>}
                <button
                  className="save-action-btn secondary-save"
                  disabled={shippedLoading || !preparedForShipment || !kitLinked}
                  onClick={handleMarkShipped}
                >
                  {shippedLoading ? (
                    <>
                      <span className="save-spinner"></span>
                      <span>Updating Transit Status...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>Save & Mark Sample as Shipped</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Info Card */}
        <div className="info-card">
          <h3>What Happens Next?</h3>
          <p>
            Once received, our certified metabolomics laboratory processes your sample. Your personal biomarker report and precision diet/exercise recommendations will be generated automatically.
          </p>
          <button className="dashboard-btn" onClick={() => navigate('/home')}>
            Return to Dashboard ➜
          </button>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            INSTRUCTIONAL MODAL
           ───────────────────────────────────────────────────────────── */}
        {instructionsOpen && (
          <div className="instructions-overlay" role="presentation" onMouseDown={(event) => {
            if (event.target === event.currentTarget) setInstructionsOpen(false);
          }}>
            <section className="instructions-modal" role="dialog" aria-modal="true" aria-labelledby="instructions-title">
              <div className="instructions-modal-header">
                <div>
                  <div className="instructions-eyebrow">Sample Collection Guide</div>
                  <h2 id="instructions-title">Collection Instructions</h2>
                </div>
                <button className="instructions-close" type="button" onClick={() => setInstructionsOpen(false)} aria-label="Close collection instructions">
                  <X size={20} />
                </button>
              </div>

              <div className="instruction-step-list">
                <div className={`instruction-step ${instructionStep === 1 ? 'current' : 'complete'}`}>
                  <span className="instruction-number">{instructionStep === 1 ? '1' : <Check size={16} />}</span>
                  <div>
                    <h3>Step 1: Open your box and scan barcode</h3>
                    <p>
                      Open your green Omiver kit box. Find the unique alphanumeric barcode on the bottom-right corner of the box and register it using the scanner on the main page.
                    </p>
                  </div>
                </div>

                <div className={`instruction-step ${instructionStep === 2 ? 'current' : ''}`}>
                  <span className="instruction-number">2</span>
                  <div>
                    <h3>Step 2: Place the collection device on your arm</h3>
                    <p style={{ marginBottom: 8 }}>
                      Follow the official manual protocol:
                    </p>
                    <ol style={{ margin: 0, paddingLeft: 18, fontSize: '0.84rem', color: '#475569', lineHeight: 1.45 }}>
                      <li>Clean your upper outer arm with the alcohol wipe and allow to dry.</li>
                      <li>Peel off the red adhesive liner to expose the sticky surface.</li>
                      <li>Stick device firmly onto the upper arm.</li>
                      <li>Press the large red top button firmly until it clicks.</li>
                      <li>Relax arm downward for 2–5 minutes until the pod fills.</li>
                      <li>Peel off device, bandage arm, invert tube 5 times, and seal in silver bag.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {instructionStep === 1 ? (
                <button 
                  className="instruction-save-btn" 
                  type="button" 
                  onClick={() => setInstructionStep(2)}
                >
                  Next Step →
                </button>
              ) : (
                <button 
                  className="instruction-save-btn" 
                  type="button" 
                  onClick={() => setInstructionsOpen(false)}
                >
                  Got It ✓
                </button>
              )}

              {instructionStep === 2 && (
                <button 
                  className="instruction-secondary-btn" 
                  type="button" 
                  onClick={() => setInstructionStep(1)}
                >
                  Back to Step 1
                </button>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionStepsScreen;
