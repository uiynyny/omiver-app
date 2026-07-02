import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Truck, CheckCircle, Package, Inbox, HelpCircle, Printer, ArrowLeft } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { fetchOrders, fetchOrderDetail, type OrderDetail } from '../api/user';

import './OrderScreen.css';
import BottomNav from './BottomNav';
import omiver from '../assets/omiver.svg';

const OrderScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;
  const orderId = (location.state as { orderId?: number } | null)?.orderId;
  const [order, setOrder] = useState<OrderDetail | null>(null);

  const [loading, setLoading] = useState(true);

  const formatOrderDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    const loadOrder = async () => {
      if (orderId) {
        try {
          const detail = await fetchOrderDetail(orderId);
          setOrder(detail);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!clientId) {
        setLoading(false);
        return;
      }

      try {
        const orders = await fetchOrders(clientId);
        if (orders.length > 0) {
          const latestOrder = orders[0];
          const detail = await fetchOrderDetail(latestOrder.id);
          setOrder(detail);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [clientId, orderId]);

  const orderNumber = order?.order_number ?? order?.id;
  const orderName = order?.test_kit_name ?? order?.testName ?? 'Order';
  const orderDate = formatOrderDate(order?.order_date || order?.created_at || order?.date);
  const forwardTrackingNumber = order?.forward_tracking_number || order?.tracking_number || order?.tracking;
  const returnTrackingNumber = order?.return_tracking_number || '';
  const orderStatus = order?.status || 'PENDING';
  const getStatusMessage = () => {
    switch (orderStatus) {
      case 'CONFIRMED':
        return 'We are processing your order';
      case 'SHIPPED':
        return forwardTrackingNumber ? `Your order has shipped. Tracking: ${forwardTrackingNumber}` : 'Your order has shipped';
      case 'IN_TRANSIT':
        return forwardTrackingNumber ? `Your order is in transit. Tracking: ${forwardTrackingNumber}` : 'Your order is in transit';
      case 'OUT_FOR_DELIVERY':
        return forwardTrackingNumber ? `Your order is out for delivery. Tracking: ${forwardTrackingNumber}` : 'Your order is out for delivery';
      case 'DELIVERED':
        return forwardTrackingNumber ? `Your order has been delivered. Tracking: ${forwardTrackingNumber}` : 'Your order has been delivered';
      case 'CANCELLED':
        return 'Your order has been cancelled';
      default:
        return 'Your order has been received';
    }
  };

  const getStatusLink = () => {
    if (!forwardTrackingNumber || !['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(orderStatus)) {
      return null;
    }

    return (
      <a
        href={`https://tracking.com/?tracking=${encodeURIComponent(forwardTrackingNumber)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{ color: '#6b9b8a', textDecoration: 'none', fontWeight: 500 }}
      >
        {forwardTrackingNumber}
      </a>
    );
  };

  return (
    <div className="order-root">
      <header className="home-header">
        <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
      </header>

      <main className="order-main">
        <div className='order-top'>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12, position: 'relative', justifyContent: 'center' }}>
            <button onClick={() => navigate('/kits')} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', position: 'absolute', left: 0 }} aria-label="Back to orders">
              <ArrowLeft size={20} color="#fff" />
            </button>
            <h2 className='order-title' style={{ margin: 0 }}>My Order</h2>
          </div>
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
                  <h2>{orderName}</h2>
                </div>
                <div className='order-card-icon'><Package size={48} color='#fff' /></div>
              </div>
              <div className="order-meta">
                <div>ID: {orderNumber}</div>
                <div>Order Date: {orderDate}</div>
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
              <div className="tracking-label">Tracking Numbers</div>
              <div style={{ color: '#777', marginBottom: 10 }}>Track your order</div>
              <div className="tracking-number">
                <div className="tracking-list">
                  <div>
                    <div style={{ fontSize: 12, color: '#777', marginBottom: 4 }}>Forward</div>
                    <div style={{ fontWeight: 700 }}>{forwardTrackingNumber || 'Pending'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: '#777', marginBottom: 4 }}>Return</div>
                    <div style={{ fontWeight: 700 }}>{returnTrackingNumber || 'Pending'}</div>
                  </div>
                </div>
                {forwardTrackingNumber && <button className="copy-btn" onClick={() => navigator.clipboard?.writeText(forwardTrackingNumber)}>Copy forward</button>}
              </div>
            </section>

            <section className="progress-card">
              <h3 style={{ marginTop: 0 }}>Progress</h3>
              {order && (() => {
                const deliveryEvents = order.delivery_events || [];
                const isDelivered = orderStatus === 'DELIVERED' || deliveryEvents.some(e => e.event_type === 'DELIVERED');
                const stages = [
                  { id: 'ordered', label: 'Ordered', done: !!(order.order_date || order.created_at) },
                  { id: 'shipped', label: 'Shipped (forward)', done: !!forwardTrackingNumber },
                  { id: 'return_label', label: 'Return label included', done: !!returnTrackingNumber },
                  { id: 'returned', label: 'Sample returned', done: isDelivered },
                ];

                return (
                  <div className="progress-steps">
                    {stages.map(s => (
                      <div key={s.id} className={`step ${s.done ? 'done' : ''}`}>
                        <div className="step-dot">{s.done ? <CheckCircle size={16} color="#6b9b8a" /> : <div className="step-empty" />}</div>
                        <div className="step-label">{s.label}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
              <div className="progress-row">
                <div className="progress-icon">
                  {orderStatus === 'SHIPPED' || orderStatus === 'IN_TRANSIT' || orderStatus === 'OUT_FOR_DELIVERY' ? (
                    <Truck color="#6b9b8a" />
                  ) : orderStatus === 'DELIVERED' ? (
                    <Box color="#6b9b8a" />
                  ) : (
                    <CheckCircle color="#6b9b8a" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="progress-title">
                    {orderStatus}
                    <span style={{ background: '#eaf5ec', color: '#6b9b8a', marginLeft: 8, padding: '4px 8px', borderRadius: 12, fontSize: 12 }}>
                      Current Status
                    </span>
                  </div>
                  <div style={{ color: '#777' }}>
                    {getStatusMessage()} {getStatusLink() && <span style={{ marginLeft: 4 }}>- {getStatusLink()}</span>}
                  </div>
                </div>
              </div>
            </section>

            <section className="actions-card">
              <h3>Order Actions</h3>
              <div className="actions-grid">
                <button className="action-btn" onClick={() => window.print()}>
                  <Printer size={20} />
                  <span>Print Receipt</span>
                </button>
                <button
                  className="action-btn"
                  onClick={() => {
                    const to = 'info@omiver.me';
                    const subject = encodeURIComponent(`Order Support - ${orderNumber ?? ''}`);
                    const body = encodeURIComponent(`Order ID: ${orderNumber ?? ''}\n\nDescribe your issue here:`);
                    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
                  }}
                >
                  <HelpCircle size={20} />
                  <span>Contact Support</span>
                </button>
              </div>
            </section>

            <section className="next-card">
              <h3>Next Steps</h3>
              {returnTrackingNumber ? (
                <div style={{ color: '#777' }}>Please wait patiently for an update from us.</div>
              ) : (
                <>
                  <div style={{ color: '#777' }}>Proceed to the sample collection section to link your kit and begin the testing process.</div>
                  <button className="next-cta" onClick={() => navigate('/collection/steps', { state: { orderId: order.id } })}>Start Sample Collection</button>
                </>
              )}
            </section>
          </div>
        )}
      </main>

      <BottomNav active="orders" />
    </div>
  )
}

export default OrderScreen
