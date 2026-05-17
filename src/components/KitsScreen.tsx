import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Package, Inbox, ChevronRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

import './KitsScreen.css';
import BottomNav from './BottomNav';
import omiver from '../assets/omiver.svg';
import { fetchKits, fetchOrders, type Kit, type Order } from '../api/user';

const KitsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const isProvider = state.auth.userType === 'PROVIDER';

  const [kits, setKits] = useState<Kit[]>([]);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [orders, setOrders] = useState<Order[]>([]);
 

  const [activeTab, setActiveTab] = useState<'browse' | 'orders'>('browse');

  // Color palette for kit cards
  const kitColors = ['#6b9b8a', '#8b5e83', '#d97706', '#059669', '#7c3aed', '#dc2626', '#0891b2', '#ea580c'];

  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');

  useEffect(() => {
    if (tabParam === 'orders') setActiveTab('orders');
    else if (tabParam === 'browse') setActiveTab('browse');
    else setActiveTab('browse');
  }, [tabParam]);

  useEffect(() => {
    fetchKits()
      .then((data: Kit[]) => setKits(data.filter(k => k.active === true)))
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

  const handleMyOrdersClick = () => {
    navigate('/kits?tab=orders');
  };

  

  return (
    <div className="screen-root">
      <header className="home-header">
        <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
      </header>

      <main className="kits-main">
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'browse' ? 'active' : ''}`}
            onClick={() => navigate('/kits?tab=browse')}
          >
            <Package size={18} />
            <span>Browse Kits</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={handleMyOrdersClick}
          >
            <Inbox size={18} />
            <span>My Orders</span>
          </button>
        </div>

        {activeTab === 'browse' ? (
          <>
            <div className='kits-top'><h2 className="kits-title">Choose Your Test Kit</h2></div>
            <div className="bottom-card">
              <div className="kits-list">
                {kits.map((k, index) => {
                  const color = kitColors[index % kitColors.length];
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
              <div className="kits-helper">
                Already received test kits? <button className="kits-link" onClick={() => navigate('/collection/steps')}>Go to collection</button>
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
                      <div style={{ background: '#6b9b8a', borderRadius: 16, padding: 20, marginBottom: 24, color: 'white', cursor: 'pointer' }} onClick={() => navigate('/orders', { state: { orderId: latest.id } })}>
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
                      <div key={order.id} className="order-card" style={{ marginBottom: 12, background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', cursor: 'pointer' }} onClick={() => navigate('/orders', { state: { orderId: order.id } })}>
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
                    <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                      <button className="next-cta" onClick={() => navigate('/kits?tab=browse')}>Browse Kits</button>
                      <button className="alt-cta" onClick={() => navigate('/collection/steps')}>Start Collection</button>
                    </div>
                  </div>
            )}
          </div>
        )}
      </main>

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

      <BottomNav active={activeTab === 'orders' ? 'orders' : 'kits'} />
    </div>
  );
};

export default KitsScreen;
