import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Package, Inbox, ChevronRight, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

import './KitsScreen.css';
import BottomNav from './BottomNav';
import { fetchKits, fetchOrders, type Kit, type Order } from '../api/user';
import { formatUSD, formatDateTime } from '../utils/format';

const KitsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const isProvider = state.auth.userType === 'PROVIDER';
  const clientId = state.auth.clientId;

  const [kits, setKits] = useState<Kit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [quantity, setQuantity] = useState(1);

  const queryParams = new URLSearchParams(location.search);
  const activeTab = queryParams.get('tab') === 'orders' ? 'orders' : 'browse';
  
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    const loadData = async () => {
      try {
        if (activeTab === 'browse') {
          const data = await fetchKits();
          if (!cancelled) setKits(data.filter((k) => k.active === true));
        } else {
          if (clientId) {
            const data = await fetchOrders(clientId);
            if (!cancelled) setOrders(data);
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load data. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [activeTab, clientId]);

  const handleKitSelect = (kit: Kit) => {
    if (isProvider) {
      setSelectedKit(kit);
      setQuantity(1);
    } else {
      navigate('/payment', { state: { kit, quantity: 1 } });
    }
  };

  const handleConfirmQuantity = () => {
    if (!selectedKit) return;
    navigate('/payment', { state: { kit: selectedKit, quantity } });
    setSelectedKit(null);
  };

  const closeQuantityModal = useCallback(() => {
    setSelectedKit(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedKit) {
        closeQuantityModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedKit, closeQuantityModal]);

  useEffect(() => {
    if (selectedKit && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [selectedKit]);

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    }
  };

  return (
    <div className="screen screen--nav">
      <header className="app-header">
        <span />
        <h1 className="app-header__title">Kits & Orders</h1>
        <span />
      </header>

      <main className="container stack-lg" style={{ paddingTop: 'var(--sp-4)' }}>
        <div className="segmented segmented--block" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'browse'}
            className="segmented__item"
            onClick={() => navigate('/kits?tab=browse')}
          >
            Browse Kits
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'orders'}
            className="segmented__item"
            onClick={() => navigate('/kits?tab=orders')}
          >
            My Orders
          </button>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="stack" aria-busy="true">
             <span className="sr-only">Loading...</span>
             <div className="skeleton" style={{ height: 120 }} />
             <div className="skeleton" style={{ height: 120 }} />
          </div>
        ) : activeTab === 'browse' ? (
          <div className="stack">
            <h2 className="sr-only">Browse Kits</h2>
            {kits.length > 0 ? kits.map((k) => (
              <section key={k.id} className="card fade-in stack-sm">
                <div className="card__header" style={{ marginBottom: 0 }}>
                  <div>
                    <h3 className="card__title">{k.name}</h3>
                    {k.description && <p className="text-secondary text-body">{k.description}</p>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="stat__value">{formatUSD(k.price)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  style={{ marginTop: 'var(--sp-2)' }}
                  onClick={() => handleKitSelect(k)}
                >
                  {k.price === 0 ? 'Get Your Free Kit' : 'Continue to Billing'}
                </button>
              </section>
            )) : (
               <div className="card empty-state">
                  <Package size={24} className="empty-state__icon" aria-hidden="true" />
                  <h3 className="empty-state__title">No kits available</h3>
               </div>
            )}
            <div style={{ textAlign: 'center', marginTop: 'var(--sp-4)' }}>
              <span className="text-secondary text-body">Already received test kits? </span>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => navigate('/collection/steps')}>
                Go to collection
              </button>
            </div>
          </div>
        ) : (
          <div className="stack">
            <h2 className="sr-only">My Orders</h2>
            {orders.length > 0 ? (
              <div className="card card--flush fade-in">
                <ul className="list">
                  {orders.map((order) => (
                    <li key={order.id}>
                      <button
                        type="button"
                        className="list__row"
                        onClick={() => navigate('/orders', { state: { orderId: order.id } })}
                      >
                        <span className="icon-btn icon-btn--plain" aria-hidden="true">
                           <Inbox size={18} />
                        </span>
                        <span className="list__body">
                          <span className="list__title">{order.test_kit_name || `Order #${order.order_number}`}</span>
                          <span className="list__meta">
                            {formatDateTime(order.created_at || order.order_date)} ·{' '}
                            <span className={`text-${
                              order.status === 'SAMPLE_DELIVERED' || order.status === 'DELIVERED'
                                ? 'optimal'
                                : order.status === 'CANCELLED'
                                  ? 'secondary'
                                  : 'watch'
                            }`}>
                              {order.status_display ?? order.status}
                            </span>
                          </span>
                        </span>
                        <ChevronRight size={18} className="list__chevron" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="card empty-state fade-in">
                <span className="empty-state__icon" aria-hidden="true">
                  <Inbox size={24} />
                </span>
                <h3 className="empty-state__title">No recent orders</h3>
                <p className="empty-state__body">Order a kit to get started</p>
                <div className="row" style={{ marginTop: 'var(--sp-2)' }}>
                  <button type="button" className="btn btn--primary" onClick={() => navigate('/kits?tab=browse')}>
                    Browse Kits
                  </button>
                  <button type="button" className="btn btn--secondary" onClick={() => navigate('/collection/steps')}>
                    Start Collection
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {selectedKit && isProvider && (
        <div className="modal-overlay" onClick={closeQuantityModal}>
          <div
            className="card modal-content fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            onClick={(e) => e.stopPropagation()}
            ref={modalRef}
            onKeyDown={handleModalKeyDown}
          >
            <div className="row-between" style={{ marginBottom: 'var(--sp-4)' }}>
              <h2 id="modal-title" className="card__title">Select Quantity</h2>
              <button type="button" className="icon-btn icon-btn--plain" onClick={closeQuantityModal} aria-label="Close dialog">
                <X size={20} />
              </button>
            </div>
            
            <p className="text-secondary text-body" style={{ marginBottom: 'var(--sp-4)' }}>{selectedKit.name}</p>

            <div className="field">
              <label htmlFor="qty" className="field__label">How many kits would you like to order?</label>
              <input
                id="qty"
                type="number"
                min="1"
                max="9999"
                className="input"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                ref={firstFocusableRef}
              />
            </div>
            
            <div className="row" style={{ marginTop: 'var(--sp-6)' }}>
              <button type="button" className="btn btn--secondary spacer" onClick={closeQuantityModal}>
                Cancel
              </button>
              <button type="button" className="btn btn--primary spacer" onClick={handleConfirmQuantity}>
                Continue with {quantity}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active={activeTab === 'orders' ? 'orders' : 'kits'} />
    </div>
  );
};

export default KitsScreen;
