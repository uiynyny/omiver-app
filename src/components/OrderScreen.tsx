import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Truck, CheckCircle, Bell, Cog, Package, Inbox, HelpCircle, Printer } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { fetchOrders, fetchOrderDetail } from '../api/user';

import './OrderScreen.css';
import BottomNav from './BottomNav';
import omiver from '../assets/omiver.svg';

type Order = {
  id?: string | number;
  testName?: string;
  date?: string;
  tracking?: string;
  kitName?: string;
};

type DeliveryEvent = {
  id: string | number;
  event_type: string;
  title: string;
  description?: string;
  is_completed?: boolean;
};

const OrderScreen: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;
  const [order, setOrder] = useState<Order | null>(null);
  const [events, setEvents] = useState<DeliveryEvent[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (clientId) {
      fetchOrders(clientId).then((orders) => {
        setLoading(false);
        if (orders.length > 0) {
          const latestOrder = orders[0];
          setOrder({
            id: latestOrder.order_number || latestOrder.id,
            testName: latestOrder.test_kit_name,
            date: latestOrder.order_date || latestOrder.created_at,
            tracking: latestOrder.tracking_number,
            kitName: latestOrder.test_kit_name,
          });

          fetchOrderDetail(latestOrder.id).then((detail) => {
            setEvents(detail.delivery_events || []);
          }).catch((error) => console.error(error));
        }
      }).catch((error) => console.error(error));
    } else {
      setLoading(false);
    }
  }, [clientId]);

  return (
    <div className="order-root">
      <header className="home-header">
        <div className="left-icons">
          <Bell className='icon-btn' size={20} />
        </div>
        <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
        <div className="right-icons">
          <Cog className="icon-btn" size={20} />
        </div>
      </header>

      <main className="order-main">
        <div className='order-top'>
          <h2 className='order-title'>Order Confirmed</h2>
          {loading ? (
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
              <button className="next-cta" onClick={() => navigate('/kits')}>Browse Kits</button>
            </div>
          )}
        </div>

        {order && (
          <div className='bottom-card'>
            <section className="tracking-panel">
              <div className="tracking-label">Tracking Number</div>
              <div style={{ color: '#777', marginBottom: 10 }}>Track your order</div>
              <div className="tracking-number">
                <div style={{ fontWeight: 700 }}>{order.tracking || 'Pending'}</div>
                {order.tracking && <button className="copy-btn" onClick={() => navigator.clipboard?.writeText(order.tracking!)}>Copy</button>}
              </div>
            </section>

            <section className="progress-card">
              <h3 style={{ marginTop: 0 }}>Delivery Progress</h3>

              {events.length > 0 ? events.map((event: DeliveryEvent) => (
                <div className="progress-row" key={event.id}>
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

            <section className="actions-card">
              <h3>Order Actions</h3>
              <div className="actions-grid">
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

            <section className="next-card">
              <h3>Next Steps</h3>
              <div style={{ color: '#777' }}>Proceed to the sample collection section to link your kit and begin the testing process.</div>
              <button className="next-cta" onClick={() => navigate('/collection/steps')}>Start Sample Collection</button>
            </section>
          </div>
        )}
      </main>

      <BottomNav active="orders" />
    </div>
  )
}

export default OrderScreen
