import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Check, X } from 'lucide-react';
import './CollectionStepsScreen.css';
import { updateClient, linkBarcodeAssignment, unlinkBarcodeAssignment, markBarcodeCollected, updateOrderStatus, fetchClient, fetchOrders, collectionScan, collectionShip, getKitCollection, collectionConfirm } from '../api/user';
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
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [linkedOrderId, setLinkedOrderId] = useState<number | null>(null);
  const [collectionConfirmed, setCollectionConfirmed] = useState(false);
  const [finalizeError, setFinalizeError] = useState('');
  const [shippedLoading, setShippedLoading] = useState(false);
  const [shippedError, setShippedError] = useState('');
  const [preparedForShipment, setPreparedForShipment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [instructionsOpen, setInstructionsOpen] = useState(true);
  const [instructionStep, setInstructionStep] = useState<number>(1);

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
        // 1. Recover collection progress
        const clientData = await fetchClient(state.auth.clientId);
        if (clientData.collection_finished_at) {
          setIsSampleCollected(true);
        }
        
        if (clientData.collection_finished_at) {
          setCollectionConfirmed(true);
          setPreparedForShipment(true);
        }

        // 2. Recover barcode linkage from order history
        const orders = await fetchOrders(state.auth.clientId);
        const activeOrder = orders.find(o => o.status !== 'FINISHED' && o.status !== 'CANCELLED');
        console.log('Recovered active order:', activeOrder);
        if (activeOrder) {
          setLinkedOrderId(activeOrder.id);
          const barcode = (activeOrder as any).barcode_number || (activeOrder as any).kit_barcode;
          if (barcode && !barcode.startsWith('KIT-') && barcode !== activeOrder.order_number) {
            setKitCode(barcode);
            setKitLinked(true);
          } else {
            setKitCode('');
            setKitLinked(false);
          }

          try {
            const data = await getKitCollection(activeOrder.id);
            if (data.kit_barcode && !data.kit_barcode.startsWith('KIT-') && data.kit_barcode !== activeOrder.order_number) {
              setKitCode(data.kit_barcode);
              setKitLinked(true);
            }
            if (data.collected_at) {
              setIsSampleCollected(true);
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
            console.log('No collection session started yet for active order.');
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
          setKitLinked(true);
        }
        if (data.collected_at) {
          setIsSampleCollected(true);
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
      }).catch(console.error);
    }
  }, [location.state]);

  const handleLinkKit = async (): Promise<boolean> => {
    const code = kitCode.trim();
    if (!code) return false;

    if (!state.auth.clientId) {
      setKitError('Client account not found. Please log in again.');
      return false;
    }

    setKitLoading(true);
    setKitError('');
    setAssignmentMessage('');

    try {
      const orderIdToScan = linkedOrderId || (location.state as any)?.orderId;
      if (orderIdToScan) {
          await collectionScan(orderIdToScan, code);
      }

      const result = await linkBarcodeAssignment({
        barcode_number: code,
        client_id: state.auth.clientId,
      });
      if (result.linked) {
        setKitLinked(true);
        setLinkedOrderId(result.order_id);
        setAssignmentMessage(result.already_linked ? 'Barcode is already linked to your account.' : `Barcode linked to ${result.test_kit_name}.`);
        if (result.order_id && !orderIdToScan) {
          await collectionScan(result.order_id, code);
        }
      } else {
        setKitError('Barcode could not be linked. Please try again.');
        return false;
      }
    } catch (error) {
      console.error(error);
      setKitError('Failed to link barcode. Please try again.');
      return false;
    } finally {
      setKitLoading(false);
    }
    return true;
  };

  const [unlinkLoading, setUnlinkLoading] = useState(false);

  const handleUnlinkKit = async () => {
    if (!state.auth.clientId) return;
    if (!window.confirm("Are you sure you want to unlink this kit? This will reset your collection progress.")) {
      return;
    }
    
    setUnlinkLoading(true);
    try {
      await unlinkBarcodeAssignment({
        barcode_number: kitCode,
        client_id: state.auth.clientId,
      });
      setKitCode('');
      setKitLinked(false);
      setAssignmentMessage('');
      setKitError('');
      setIsSampleCollected(false);
      setCollectionConfirmed(false);
      setPreparedForShipment(false);
    } catch (err: any) {
      console.error("Error unlinking kit:", err);
      alert(err.message || "Failed to unlink kit.");
    } finally {
      setUnlinkLoading(false);
    }
  };

  const handleBarcodeInBox = async () => {
    setFinalizeError('');
    const orderIdToConfirm = linkedOrderId || (location.state as any)?.orderId;
    if (orderIdToConfirm) {
      try {
        await collectionConfirm(orderIdToConfirm);
        setCollectionConfirmed(true);
      } catch (err) {
        console.error('Failed to confirm collection:', err);
        setFinalizeError('Failed to confirm collection in database. Please try again.');
      }
    } else {
      setCollectionConfirmed(true);
    }
  }

  const handleConfirmSampleCollected = async () => {
    if (!state.auth.clientId || !kitLinked || !kitCode.trim()) return false;

    const collectedAt = new Date().toISOString();
    try {
      await markBarcodeCollected({
        barcode_number: kitCode.trim(),
        client_id: state.auth.clientId,
        collected_at: collectedAt,
      });
      await updateClient(state.auth.clientId, { collection_finished_at: collectedAt });
      const orderIdToConfirm = linkedOrderId || (location.state as any)?.orderId;
      if (orderIdToConfirm) await collectionConfirm(orderIdToConfirm);
      setIsSampleCollected(true);
      setCollectionConfirmed(true);
      return true;
    } catch (error) {
      console.error('Failed to save collection step:', error);
      setFinalizeError('Unable to save this step right now. Please try again.');
      return false;
    }
  };

  const handleInstructionNext = async () => {
      setInstructionStep(prev => {
        const nextStep = prev + 1;
        if (nextStep > 2) {
          setInstructionStep(1);
          setInstructionsOpen(false);
          return prev;
        }
        return nextStep;
      });

  };

  const handleMarkShipped = async () => {
    const orderIdToShip = linkedOrderId || (location.state as any)?.orderId;
    if (!orderIdToShip) {
      setShippedError('Please link your barcode first so we know which order to ship.');
      return;
    }

    setShippedError('');
    setShippedLoading(true);
    try {
      await collectionShip(orderIdToShip);
      await updateOrderStatus(orderIdToShip, {
        status: 'SHIPPED',
        title: 'Shipped',
        description: 'Your sample has been shipped',
      });
      navigate('/kits?tab=orders');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update order status';
      console.error('Failed to update order status', err);
      setShippedError(message);
    } finally {
      setShippedLoading(false);
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
        <h1>Complete your Test</h1>
        <button className="steps-settings-btn">
        </button>
      </header>

      <div className="steps-content">
        <div className="steps-intro-row">
          <div className="steps-intro">Follow the steps below</div>
          <button className="instructions-btn" type="button" onClick={() => setInstructionsOpen(true)}>
            Collection instructions
          </button>
        </div>

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
            <div className="barcode-hint">Tip: The barcode is on the bottom-right corner of the box.</div>
            <div className="step-card">
              {kitLinked ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div className="kit-linked-box" style={{ margin: 0 }}>
                    <Check size={18} fill="#0f5132" />
                    <div>
                      <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Kit Linked</div>
                      <div>Code: {kitCode}</div>
                    </div>
                  </div>
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
                      textAlign: 'left',
                      padding: '4px 6px',
                      textDecoration: 'underline',
                      alignSelf: 'flex-start'
                    }}
                  >
                    {unlinkLoading ? 'Unlinking...' : 'Unlink / Change Kit'}
                  </button>
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
                  {assignmentMessage && <div style={{ color: '#0f5132', fontSize: 13, marginTop: 8 }}>{assignmentMessage}</div>}
                  {kitError && <div style={{ color: '#dc2626', fontSize: 13, marginTop: 8 }}>{kitError}</div>}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Collect Your Sample (Active) */}
        <div className="step-item">
          <div className="step-indicator">
            <div className={`step-circle ${collectionConfirmed ? 'completed' : (kitLinked ? 'active' : '')}`}>
              {collectionConfirmed ? <Check size={18} /> : <Check size={18} style={{ opacity: kitLinked ? 1 : 0.3 }} />}
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
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                />
                {!kitLinked && (
                  <div style={{ color: '#b45309', marginBottom: 10 }}>Please link your kit first to continue.</div>
                )}
                <button className="confirm-btn" onClick={handleConfirmSampleCollected} disabled={!kitLinked} title={!kitLinked ? 'Link your kit first' : ''}>
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

            {/* Final confirmation: ensure user wrote barcode on foil envelope and placed in box */}
            {isSampleCollected && !collectionConfirmed && (
              <div className="step-card">
                <div style={{ marginBottom: 8, fontWeight: 600 }}>Final step: confirm barcode placement</div>
                <div style={{ marginBottom: 12 }} className="barcode-instruction">Please write the barcode number on the silver foil envelope and place it inside the green Omiver box.</div>
                {finalizeError && <div style={{ color: '#dc2626', marginBottom: 8 }}>{finalizeError}</div>}
                <button
                  className="confirm-btn"
                  onClick={handleBarcodeInBox}
                  style={{ marginTop: 0 }}
                  disabled={!kitLinked}
                >
                  I placed the barcode inside the box
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step 3: Prepare Your Sample for Shipment */}
        <div className="step-item">
          <div className="step-indicator">
            <div className={`step-circle ${preparedForShipment ? 'completed' : (collectionConfirmed ? 'active' : '')}`}>
              {preparedForShipment ? <Check size={18} /> : <Check size={18} style={{ opacity: collectionConfirmed ? 1 : 0.3 }} />}
            </div>
            <div className="step-line"></div>
          </div>
          <div className="step-details">
            <div className="step-title">Prepare Your Sample for Shipment</div>
            <div className="step-desc">Follow these steps to pack your sample for shipping</div>
            <div className="step-card">
              <ol className="prep-list">
                <li>Place your silver collection bag inside your Omiver box.</li>
                <li>Put the box inside the black plastic poly mailer included and seal the top.</li>
                <li>Attach the included shipping label on the outside of the poly mailer bag.</li>
                <li>Drop it off at your local FedEx within a week of sample collection.</li>
              </ol>
              {!preparedForShipment ? (
                <button
                  className="confirm-btn"
                  onClick={() => setPreparedForShipment(true)}
                  disabled={!collectionConfirmed || !kitLinked}
                  title={!collectionConfirmed ? 'Confirm barcode placement first' : !kitLinked ? 'Link your kit first' : ''}
                >
                  I have dropped off my shipment
                </button>
              ) : (
                <div className="kit-linked-box" style={{ marginTop: 8 }}>
                  <Check size={18} /> Thank you! you can check update on your shipment.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 4: Ship Your Sample */}
        <div className="step-item">
          <div className="step-indicator">
            {/* Simulating this is next */}
            <div className={`step-circle ${preparedForShipment ? 'active' : ''}`} style={{ backgroundColor: preparedForShipment ? '#6b9b8a' : '#e0e0e0' }}>
              <Check size={18} style={{ opacity: preparedForShipment ? 1 : 0.3 }} />
            </div>
            <div className="step-line"></div>
          </div>
          <div className="step-details">
            <div className="step-title" style={{ opacity: preparedForShipment ? 1 : 0.6 }}>Ship Your Sample</div>
            <div className="step-desc" style={{ opacity: preparedForShipment ? 1 : 0.6 }}>Place your prepared box inside the prepaid return envelope and ship it to our laboratory</div>

            {/* Show hypothetical shipped state if collected? Or keep it simple as per mockup which shows logic flow */}
            {/* The mockup shows this step as 'Active/Completed' with "Sample Shipped". Let's assume for this demo we stop at collection confirmation */}

              <div className="step-card" style={{ opacity: 0.6 }}>
              <div className="status-badge" style={{ background: preparedForShipment ? '#eaf5ec' : '#eee', color: preparedForShipment ? '#6b9b8a' : '#999' }}>
                <Check size={12} /> Pending...
              </div>
              <div className="tracking-info">Tracking: PENDING</div>
            </div>
            {preparedForShipment && (
              <div style={{ marginTop: 10 }}>
                {shippedError && <div style={{ color: '#dc2626', marginBottom: 8 }}>{shippedError}</div>}
                <button
                  className="confirm-btn"
                  disabled={shippedLoading || !preparedForShipment || !kitLinked}
                  onClick={handleMarkShipped}
                >
                  {shippedLoading ? 'Updating shipment...' : 'Mark as Shipped'}
                </button>
              </div>
            )}
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

      {instructionsOpen && (
        <div className="instructions-overlay" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setInstructionsOpen(false);
        }}>
          <section className="instructions-modal" role="dialog" aria-modal="true" aria-labelledby="instructions-title">
            <div className="instructions-modal-header">
              <div>
                <div className="instructions-eyebrow">Sample collection</div>
                <h2 id="instructions-title">Before you collect</h2>
              </div>
              <button className="instructions-close" type="button" onClick={() => setInstructionsOpen(false)} aria-label="Close collection instructions">
                <X size={20} />
              </button>
            </div>
            <div className="instruction-step-list">
              <div className={`instruction-step ${instructionStep === 1 ? 'current' : 'complete'}`}>
                <span className="instruction-number">{instructionStep === 1 ? '1' : <Check size={16} />}</span>
                <div>
                  <h3>Open your box and scan the barcode</h3>
                  <p>Find the barcode on the bottom-right corner of the box and scan it, or enter the code on the collection page.</p>
                </div>
              </div>
              <div className={`instruction-step ${instructionStep === 2 ? 'current' : ''}`}>
                <span className="instruction-number">2</span>
                <div>
                  <h3>Place the collection device on your arm</h3>
                  <p>Follow the placement and collection instructions in the device manual. Keep the device in place for the recommended time.</p>
                </div>
              </div>
            </div>
            {kitError && instructionStep === 1 && <div className="instruction-error">{kitError}</div>}
            <button className="instruction-save-btn" type="button" onClick={handleInstructionNext}>
              {(instructionStep === 1 ? 'Next step' : 'Finish')}
            </button>
            {instructionStep === 2 && <button className="instruction-secondary-btn" type="button" onClick={() => { setInstructionStep(1) }}>Back</button>}
          </section>
        </div>
      )}
      </div>
    </div>
  );
};

export default CollectionStepsScreen;
