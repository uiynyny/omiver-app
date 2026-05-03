import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, Cog, X, Box, Truck, CheckCircle, Package, Inbox, HelpCircle, Printer } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

import './KitsScreen.css';
import BottomNav from './BottomNav';
import omiver from '../assets/omiver.svg';
import { fetchKits, type Kit, fetchOrders, fetchOrderDetail, type Order, type DeliveryEvent } from '../api/user';

const kitDefaults: Record<string, { color: string; features: string[] }> = {
  'Basic Test': {
    color: '#d98252',
    features: [
      'At-home blood collection',
      'Free shipping and return kit',
      'Platform membership access',
      'Provider-guided support',
    ],
  },
  'Premium Test': {
    color: '#c99bb9',
    features: [
      'At-home blood collection',
      'Free shipping and return kit',
      'Platform membership access',
      'Annual membership benefits',
    ],
  },
};

const KitsScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const isProvider = state.auth.userType === 'PROVIDER';
  const clientId = state.auth.clientId;

  const [kits, setKits] = useState<Kit[]>([]);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [quantity, setQuantity] = useState(1);

  const [activeTab, setActiveTab] = useState<'kits' | 'orders'>('kits');
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<DeliveryEvent[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const queryParams = new URLSearchParams(location.search);
  const tabParam = queryParams.get('tab');

  useEffect(() => {
    if (tabParam === 'orders') {
      setActiveTab('orders');
    } else {
      setActiveTab('kits');
    }
  }, [tabParam]);

  useEffect(() => {
    fetchKits().then((data: Kit[]) => {
      const mappedKits = data.map((k) => ({
        id: k.id,
        title: k.name,
        subtitle: k.description,
        price: `$${k.price}`,
        frequency: 'one-time',
        color: kitDefaults[k.name]?.color || '#6b9b8a',
        badge: 'At-home kit',
        features: kitDefaults[k.name]?.features || [
          'At-home blood collection',
          'Free shipping and return kit',
          'Platform membership access',
        ],
      }));
      setKits(mappedKits);
    }).catch((error) => console.error(error));
  }, []);

  const handleKitSelect = (kit: Kit) => {
    if (isProvider) {
      // Show quantity modal for providers
      setSelectedKit(kit);
    } else {
      // Go directly to payment for individuals
      navigate('/payment', { state: { kit, quantity: 1 } });
    }
  };

  const handleConfirmQuantity = () => {
    if (selectedKit) {
      navigate('/payment', { state: { kit: selectedKit, quantity } });
      setSelectedKit(null);
      setQuantity(1);
    }
  };

  return (
    <div className="screen-root">
      <header className="home-header">
        <div className="left-icons">
          <Bell className='icon-btn' size={20} />
        </div>
        <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
        <div className="right-icons">
          <Cog className="icon-btn" size={20} />
        </div>
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
            <div className='kits-top'>
              <h2 className="kits-title">Choose Your Test Kit</h2>
            </div>

            <div className="bottom-card">
              <div className="kits-list">
                {kits.map((k) => (
                  <div className="kit-card" key={k.id}>
                    <div className="kit-top">
                      <div>
                        <h3 className="kit-title">{k.title}</h3>
                        <div className="kit-sub">{k.subtitle}</div>
                      </div>
                      <div className="kit-price">
                        <div className="price-amount">{k.price}</div>
                        <div className="price-sub">{k.frequency}</div>
                      </div>
                    </div>

                    <div className="kit-badge-row">
                      <div className="badge-label">Includes</div>
                      <div className="badge-pill" style={{ background: k.color }}>{k.badge}</div>
                    </div>

                    <ul className="kit-features">
                      {k.features.map((f: string) => (
                        <li key={f} className="kit-feature"><span className="check">✓</span>{f}</li>
                      ))}
                    </ul>

                    <button
                      className="kit-cta"
                      style={{ background: k.color }}
                      onClick={() => handleKitSelect(k)}
                    >
                      Continue to Billing ➜
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="orders-tab-content" style={{ padding: '0 16px' }}>
            <div className='order-top'>
              <h2 className='order-title'>Order Confirmed</h2>
              {loadingOrders ? (
                <div className="order-card empty-order-card">
                  <div className='collection-card-group'>
                    <div className='collection-card-text-group'>
                      <div style={{ opacity: 0.85, marginBottom: 6 }}>Loading your latest order</div>
                      <h2>Checking your order status</h2>
                    </div>
                    <div className='order-card-icon'><Package size={48} color='#fff' /></div>
                  </div>
                </div>
              ) : order ? (
                <div className="order-card">
                  <div className='collection-card-group'>
                    <div className='collection-card-text-group'>
                      <div style={{ opacity: 0.85, marginBottom: 6 }}>Home collection kit</div>
                      <h2>{order.testName}</h2>
                    </div>
                    <div className='order-card-icon'><Package size={48} color='#fff' /></div>
                  </div>
                  <div className="order-meta">
                    <div>ID: {order.id}</div>
                    <div>Order Date: {order.date}</div>
                  </div>
                </div>
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

            {order && (
              <div className='bottom-card' style={{ marginTop: 20 }}>
                <section className="tracking-panel">
                  <div className="tracking-label">Tracking Number</div>
                  <div style={{ color: '#777', marginBottom: 10 }}>Track your order</div>
                  <div className="tracking-number">
                    <div style={{ fontWeight: 700 }}>{order.tracking || 'Pending'}</div>
                    {order.tracking && <button className="copy-btn" onClick={() => navigator.clipboard?.writeText(order.tracking!)}>Copy</button>}
                  </div>
                </section>

                <section className="progress-card" style={{ marginTop: 20 }}>
                  <h3 style={{ marginTop: 0 }}>Delivery Progress</h3>

                  {events.length > 0 ? events.map((event) => (
                    <div className="progress-row" key={event.id} style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                      <div className="progress-icon">
                        {event.event_type === 'ORDER_PLACED' && <CheckCircle color="#6b9b8a" />}
                        {event.event_type === 'IN_TRANSIT' && <Truck color="#6b9b8a" />}
                        {event.event_type === 'DELIVERED' && <Box color="#6b9b8a" />}
                        {![ 'ORDER_PLACED', 'IN_TRANSIT', 'DELIVERED' ].includes(event.event_type) && <CheckCircle color="#6b9b8a" />}
                      </div>
                      <div>
                        <div className="progress-title">
                          {event.title}
                          {!event.is_completed && <span style={{ background: '#eaf5ec', color: '#6b9b8a', marginLeft: 8, padding: '4px 8px', borderRadius: 12, fontSize: 12 }}>In Progress</span>}
                        </div>
                        <div style={{ color: '#777' }}>{event.description}</div>
                      </div>
                    </div>
                  )) : (
                    <div style={{ color: '#777' }}>Tracking updates will appear here once your order is processed.</div>
                  )}
                </section>

                <section className="actions-card" style={{ marginTop: 20 }}>
                  <h3>Order Actions</h3>
                  <div className="actions-grid" style={{ display: 'flex', gap: 10 }}>
                    <button className="action-btn" onClick={() => window.print()}>
                      <Printer size={20} />
                      <span>Print Receipt</span>
                    </button>
                    <button className="action-btn" onClick={() => alert('Support team contact:\nsupport@omiver.me')}>
                      <HelpCircle size={20} />
                      <span>Contact Support</span>
                    </button>
                  </div>
                </section>

                <section className="next-card" style={{ marginTop: 20 }}>
                  <h3>Next Steps</h3>
                  <div style={{ color: '#777' }}>Proceed to the sample collection section to link your kit and begin the testing process.</div>
                  <button className="next-cta" onClick={() => navigate('/collection/steps')}>Start Sample Collection</button>
                </section>
              </div>
            )}
          </div>
        )}
      </main>

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
            <p className="modal-subtitle">{selectedKit.title}</p>
            
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

