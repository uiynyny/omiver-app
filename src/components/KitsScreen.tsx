import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Package, Inbox, ChevronRight, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

import './KitsScreen.css';
import BottomNav from './BottomNav';
import omiver from '../assets/omiver.svg';
import { fetchKits, fetchOrders, fetchOrderDetail, type Kit, type Order, type OrderDetail } from '../api/user';

const KitsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const isProvider = state.auth.userType === 'PROVIDER';

  const [kits, setKits] = useState<Kit[]>([]);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState<OrderDetail | null>(null);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);

  const [activeTab, setActiveTab] = useState<'kits' | 'orders'>('kits');

  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');

  useEffect(() => {
    if (tabParam === 'orders') setActiveTab('orders');
    else setActiveTab('kits');
  }, [tabParam]);

  useEffect(() => {
    fetchKits()
      .then((data: Kit[]) => setKits(data.filter(k => k.active !== false)))
      .catch((error) => console.error(error));
  }, []);

  useEffect(() => {
    if (state.auth.clientId) {
      fetchOrders(state.auth.clientId).then((data: Order[]) => setOrders(data)).catch((err) => console.error(err));
    }
  }, [activeTab, state.auth.clientId]);

  const handleKitSelect = (kit: Kit) => {
    if (isProvider) setSelectedKit(kit);
    else navigate('/payment', { state: { kit, quantity: 1 } });
  };

  const handleConfirmQuantity = () => {
    if (!selectedKit) return;
    navigate('/payment', { state: { kit: selectedKit, quantity } });
    setSelectedKit(null);
    setQuantity(1);
  };

  const formatOrderDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  const handleOrderClick = (orderId: number) => {
    setSelectedOrderId(orderId);
    setLoadingOrderDetail(true);
    fetchOrderDetail(orderId)
      .then((detail) => setSelectedOrderDetail(detail))
      .catch((err) => console.error('Failed to fetch order detail:', err))
      .finally(() => setLoadingOrderDetail(false));
  };

  const handleCloseOrderDetail = () => {
    setSelectedOrderId(null);
    setSelectedOrderDetail(null);
  };

  return (
    <div className="screen-root">
      <header className="home-header">
        <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
      </header>

      <main className="kits-main">
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'kits' ? 'active' : ''}`}
            onClick={() => navigate('/kits')}
          >
            <Package size={18} />
            <span>Browse Kits</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => navigate('/kits?tab=orders')}
          >
            <Inbox size={18} />
            <span>My Orders</span>
          </button>
        </div>

        {activeTab === 'kits' ? (
          <>
            <div className='kits-top'><h2 className="kits-title">Choose Your Test Kit</h2></div>
            <div className="bottom-card">
              <div className="kits-list">
                {kits.map((k) => {
                  const color = '#6b9b8a';
                  const features = [
                    'At-home blood collection',
                    'Free shipping and return kit',
                    'Platform membership access',
                  ];
                  return (
                    <div className="kit-card" key={k.id}>
                      <div className="kit-top">
                        <div>
                          <h3 className="kit-title">{k.name}</h3>
                          <div className="kit-sub">{k.description || ''}</div>
                        </div>
                        <div className="kit-price"><div className="price-amount">${k.price}</div><div className="price-sub">one-time</div></div>
                      </div>

                      <div className="kit-badge-row"><div className="badge-label">Includes</div><div className="badge-pill" style={{ background: color }}>At-home kit</div></div>

                      <ul className="kit-features">{features.map((f) => <li key={f} className="kit-feature"><span className="check">✓</span>{f}</li>)}</ul>

                      <button className="kit-cta" style={{ background: color }} onClick={() => handleKitSelect(k)}>
                        {k.price == 0 ? 'Get Your Free Kit' : 'Continue to Billing'} <ChevronRight size={18} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className="orders-tab-content" style={{ padding: 16 }}>
            {orders.length > 0 ? (
              <>
                {/* Latest Order */}
                {(() => {
                  const latest = orders[0];
                  return (
                    <div style={{ background: '#6b9b8a', borderRadius: 16, padding: 20, marginBottom: 24, color: 'white', cursor: 'pointer' }} onClick={() => handleOrderClick(latest.id)}>
                      <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Latest Order</h2>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ opacity: 0.9, fontSize: 13 }}>Order #{latest.order_number}</div>
                          <div style={{ opacity: 0.75, fontSize: 12 }}>{formatOrderDate(latest.created_at || latest.order_date)}</div>
                          <h3 style={{ fontSize: 16, fontWeight: 600 }}>{latest.test_kit_name}</h3>
                          <div style={{ fontSize: 13 }}>Status: <span style={{ fontWeight: 600 }}>{latest.status}</span></div>
                        </div>
                        <Package size={40} color='white' />
                      </div>
                    </div>
                  );
                })()}

                {/* History */}
                {orders.length > 1 && (
                  <div>
                    <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, opacity: 0.8 }}>Order History</h3>
                    {orders.slice(1).map((order) => (
                      <div key={order.id} className="order-card" style={{ marginBottom: 12, background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }} onClick={() => handleOrderClick(order.id)}>
                        <div className='collection-card-group' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div className='collection-card-text-group'>
                            <div style={{ opacity: 0.7, marginBottom: 2, fontSize: 12 }}>Order #{order.order_number}</div>
                            <div style={{ opacity: 0.6, marginBottom: 8, fontSize: 11 }}>{formatOrderDate(order.created_at || order.order_date)}</div>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>{order.test_kit_name}</h3>
                            <div style={{ opacity: 0.6, fontSize: 12, marginTop: 4 }}>Status: <span style={{ fontWeight: 600, color: order.status === 'DELIVERED' ? '#6b9b8a' : order.status === 'CANCELLED' ? '#6b7280' : '#f59e0b' }}>{order.status}</span></div>
                          </div>
                          <div style={{ opacity: 0.3 }}>{order.status === 'DELIVERED' ? <Package size={28} /> : <Inbox size={28} />}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="order-card empty-order-card">
                  <div className='collection-card-group'>
                    <div className='collection-card-text-group'>
                      <div style={{ opacity: 0.85, marginBottom: 6 }}>No recent orders</div>
                      <h2>Order a kit to get started</h2>
                    </div>
                    <div className='order-card-icon'><Inbox size={48} color='#fff' /></div>
                  </div>
                  <button className="next-cta" onClick={() => setActiveTab('kits')}>Browse Kits</button>
                </div>
            )}
          </div>
        )}
      </main>

      {/* Order Detail Modal */}
      {selectedOrderId && selectedOrderDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000 }} onClick={handleCloseOrderDetail}>
          <div style={{ background: 'white', height: '100vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: 16, display: 'flex', alignItems: 'center', borderBottom: '1px solid #e5e7eb' }}>
              <button onClick={handleCloseOrderDetail} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer' }}><ArrowLeft size={24} color="#6b9b8a" /></button>
              <h2 style={{ marginLeft: 12, fontSize: 18, fontWeight: 600 }}>Order Details</h2>
            </div>
            <div style={{ padding: 16 }}>
              {loadingOrderDetail ? <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div> : (
                <>
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600 }}>{selectedOrderDetail.test_kit_name}</h3>
                    <p style={{ opacity: 0.7 }}>Order #{selectedOrderDetail.order_number}</p>
                  </div>
                  {selectedOrderDetail.delivery_events && selectedOrderDetail.delivery_events.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Delivery Updates</h4>
                      {selectedOrderDetail.delivery_events.map((ev) => (
                        <div key={ev.id} style={{ display: 'flex', marginBottom: 16 }}>
                          <div style={{ width: 12, height: 12, borderRadius: '50%', background: ev.is_completed ? '#6b9b8a' : '#e5e7eb', marginRight: 12, marginTop: 4 }} />
                          <div>
                            <p style={{ fontSize: 14, fontWeight: 600 }}>{ev.title}</p>
                            {ev.description && <p style={{ fontSize: 12, opacity: 0.7 }}>{ev.description}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quantity Modal for Providers */}
      {selectedKit && isProvider && (
        <div className="modal-overlay">
          <div className="quantity-modal">
            <button
              className="modal-close"
              onClick={() => {
                setSelectedKit(null);
                setQuantity(1);
              }}
            >
              <X size={24} />
            </button>
            <h2>Select Quantity</h2>
            <p className="modal-subtitle">{selectedKit.name}</p>

            <div className="quantity-input-group">
              <label htmlFor="qty">How many kits would you like to order?</label>
              <input
                id="qty"
                type="number"
                min="1"
                max="9999"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              />
              <p className="discount-note">
                💡 Volume discounts apply: 5% off for 30+ kits
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => {
                  setSelectedKit(null);
                  setQuantity(1);
                }}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={handleConfirmQuantity}
              >
                Continue with {quantity} kit{quantity !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav active={activeTab === 'kits' ? 'kits' : 'orders'} />
    </div>
  );
};

export default KitsScreen;
