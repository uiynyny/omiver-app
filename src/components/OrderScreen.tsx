import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Truck, CheckCircle, Package, Inbox, HelpCircle, Printer, ArrowLeft, AlertCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { fetchOrders, fetchOrderDetail, type OrderDetail, type OrderStatus, type OrderProgressStage } from '../api/user';
import { formatDateTime } from '../utils/format';
import './OrderScreen.css';
import BottomNav from './BottomNav';

const OrderScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAppContext();
  const clientId = state.auth.clientId;
  const orderId = (location.state as { orderId?: number } | null)?.orderId;
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadOrder = async () => {
      setLoading(true);
      setError('');
      try {
        if (orderId) {
          const detail = await fetchOrderDetail(orderId);
          if (!cancelled) setOrder(detail);
        } else if (clientId) {
          const orders = await fetchOrders(clientId);
          if (orders.length > 0) {
            const latestOrder = orders[0];
            const detail = await fetchOrderDetail(latestOrder.id);
            if (!cancelled) setOrder(detail);
          }
        }
      } catch {
        if (!cancelled) setError('Could not load order details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadOrder();
    return () => { cancelled = true; };
  }, [clientId, orderId]);

  const orderNumber = order?.order_number ?? order?.id;
  const orderName = order?.test_kit_name ?? order?.testName ?? 'Order';
  const orderDate = formatDateTime(order?.order_date || order?.created_at || order?.date);
  const forwardTrackingNumber = order?.forward_tracking_number || order?.tracking_number || order?.tracking;
  const returnTrackingNumber = order?.return_tracking_number || '';
  // Whether the sample is already on its way back. Read from the order's own
  // status so this can't disagree with the timeline above it; the parallel
  // KitCollection status is a legacy second opinion.
  const isShipped = ['SAMPLE_SHIPPED', 'SAMPLE_DELIVERED'].includes(order?.status || '')
    || ['SHIPPING', 'TESTING', 'FINISHED'].includes(order?.collection_status || '');
  const orderStatus: OrderStatus = order?.status ?? 'CREATED';

  const getStatusMessage = () => {
    switch (orderStatus) {
      case 'SHIPPED': return 'Your kit has shipped';
      case 'IN_TRANSIT': return 'Your kit is in transit';
      case 'OUT_FOR_DELIVERY': return 'Your kit is out for delivery';
      case 'DELIVERED': return 'Your kit has been delivered';
      case 'SAMPLE_SHIPPED': return 'Your sample is on its way to the lab';
      case 'SAMPLE_DELIVERED': return 'The lab has received your sample';
      case 'CANCELLED': return 'Your order has been cancelled';
      default: return 'Your order has been received';
    }
  };

  // The round trip is computed server-side from the delivery-event feed, so
  // the app renders it rather than re-deriving it. `progress` is optional only
  // to tolerate an older backend; the fallback shows the first stage done.
  const stages: OrderProgressStage[] = order?.progress ?? [
    { key: 'ORDER_PLACED', label: 'Ordered', leg: 'outbound', done: !!(order?.order_date || order?.created_at), timestamp: null },
    { key: 'SHIPPED', label: 'Shipped to you', leg: 'outbound', done: false, timestamp: null },
    { key: 'DELIVERED', label: 'Delivered', leg: 'outbound', done: false, timestamp: null },
    { key: 'SAMPLE_SHIPPED', label: 'Sample shipped', leg: 'return', done: false, timestamp: null },
    { key: 'SAMPLE_DELIVERED', label: 'Sample delivered', leg: 'return', done: false, timestamp: null },
  ];

  // The return leg only becomes meaningful once the kit is in the customer's
  // hands, so label it to explain the jump from "delivered" to "shipped" again.
  const firstReturnIndex = stages.findIndex((s) => s.leg === 'return');

  return (
    <div className="screen screen--nav">
      <header className="app-header">
        <button type="button" className="icon-btn icon-btn--plain" onClick={() => navigate('/kits?tab=orders')} aria-label="Back to orders">
          <ArrowLeft size={20} />
        </button>
        <h1 className="app-header__title">Order Details</h1>
        <span />
      </header>

      <main className="container stack-lg order-detail">
        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="stack" aria-busy="true">
            <span className="sr-only">Loading order details...</span>
            <div className="skeleton" style={{ height: 100 }} />
            <div className="skeleton" style={{ height: 200 }} />
          </div>
        ) : order ? (
          <>
            <section className="card card--inset fade-in">
               <div className="row-between">
                  <div>
                     <p className="text-label text-tertiary">Home collection kit</p>
                     <h2 className="card__title">{orderName}</h2>
                  </div>
                  <div className="icon-btn" style={{ width: 48, height: 48, background: 'var(--surface-3)', pointerEvents: 'none' }} aria-hidden="true">
                     <Package size={24} className="text-accent" />
                  </div>
               </div>
               <div className="row-between" style={{ marginTop: 'var(--sp-4)' }}>
                  <div>
                     <p className="text-label text-tertiary">Order ID</p>
                     <p className="text-body tabular">{orderNumber}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                     <p className="text-label text-tertiary">Date</p>
                     <p className="text-body tabular">{orderDate}</p>
                  </div>
               </div>
            </section>

            <section className="card fade-in">
              <h2 className="card__title">Tracking</h2>
              <div className="list">
                <div className="list__row" style={{ paddingInline: 0 }}>
                  <div className="list__body">
                    <span className="list__title">Forward</span>
                    <span className="list__meta">{forwardTrackingNumber || 'Pending'}</span>
                  </div>
                  {forwardTrackingNumber && (
                    <button type="button" className="btn btn--sm btn--secondary" onClick={() => navigator.clipboard?.writeText(forwardTrackingNumber)}>
                      Copy
                    </button>
                  )}
                </div>
                <div className="list__row" style={{ paddingInline: 0, borderBottom: 'none' }}>
                  <div className="list__body">
                    <span className="list__title">Return</span>
                    <span className="list__meta">{returnTrackingNumber || 'Pending'}</span>
                  </div>
                  {returnTrackingNumber && (
                    <button type="button" className="btn btn--sm btn--secondary" onClick={() => navigator.clipboard?.writeText(returnTrackingNumber)}>
                      Copy
                    </button>
                  )}
                </div>
              </div>
            </section>

            <section className="card fade-in">
              <h2 className="card__title">Status</h2>
              <div className="order__status">
                <span className="order__status-icon" aria-hidden="true">
                  {orderStatus === 'CANCELLED' ? (
                    <AlertCircle size={20} />
                  ) : orderStatus === 'SHIPPED' || orderStatus === 'IN_TRANSIT'
                    || orderStatus === 'OUT_FOR_DELIVERY' || orderStatus === 'SAMPLE_SHIPPED' ? (
                    <Truck size={20} />
                  ) : orderStatus === 'DELIVERED' || orderStatus === 'SAMPLE_DELIVERED' ? (
                    <Box size={20} />
                  ) : (
                    <CheckCircle size={20} />
                  )}
                </span>
                <div>
                   <p className="order__status-label">{order?.status_display ?? orderStatus}</p>
                   <p className="text-secondary text-body">{getStatusMessage()}</p>
                </div>
              </div>

              {/* Fulfilment timeline. The kit makes a round trip — out to the
                  customer, then back to the lab — so both legs are shown. */}
              <ol className="order__timeline">
                {stages.map((s, i) => (
                  <React.Fragment key={s.key}>
                    {i === firstReturnIndex && (
                      <li className="order__leg-heading" aria-hidden="true">Return to lab</li>
                    )}
                    <li className={`order__stage${s.done ? ' order__stage--done' : ''}`}>
                      <span className="order__stage-dot" aria-hidden="true">
                        {s.done && <CheckCircle size={14} />}
                      </span>
                      <span className="order__stage-label">{s.label}</span>
                      {s.done && s.timestamp && (
                        <span className="order__stage-time">{formatDateTime(s.timestamp)}</span>
                      )}
                      <span className="sr-only">{s.done ? ' — complete' : ' — pending'}</span>
                    </li>
                  </React.Fragment>
                ))}
              </ol>
            </section>

            <section className="card card--flush fade-in">
              <ul className="list">
                <li>
                  <button type="button" className="list__row" onClick={() => window.print()}>
                    <Printer size={18} className="text-secondary" aria-hidden="true" />
                    <span className="list__body">
                       <span className="list__title">Print Receipt</span>
                    </span>
                  </button>
                </li>
                <li>
                  <button type="button" className="list__row" onClick={() => {
                    const to = 'info@omiver.me';
                    const subject = encodeURIComponent(`Order Support - ${orderNumber ?? ''}`);
                    const body = encodeURIComponent(`Order ID: ${orderNumber ?? ''}\n\nDescribe your issue here:`);
                    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
                  }}>
                    <HelpCircle size={18} className="text-secondary" aria-hidden="true" />
                    <span className="list__body">
                       <span className="list__title">Contact Support</span>
                    </span>
                  </button>
                </li>
              </ul>
            </section>

            <section className="card fade-in">
              <h2 className="card__title">Next Steps</h2>
              {isShipped ? (
                <p className="text-secondary text-body">Please wait patiently for an update from us.</p>
              ) : (
                <div className="stack-sm">
                  <p className="text-secondary text-body">Proceed to the sample collection section to link your kit and begin the testing process.</p>
                  <button type="button" className="btn btn--primary btn--block" onClick={() => navigate('/collection/steps', { state: { orderId: order.id } })}>
                    Start Sample Collection
                  </button>
                </div>
              )}
            </section>
          </>
        ) : (
          <div className="card empty-state fade-in">
            <span className="empty-state__icon" aria-hidden="true">
              <Inbox size={24} />
            </span>
            <h2 className="empty-state__title">No order found</h2>
            <p className="empty-state__body">We couldn't find the details for this order.</p>
            <button type="button" className="btn btn--primary" onClick={() => navigate('/kits')} style={{ marginTop: 'var(--sp-4)' }}>
              Browse Kits
            </button>
          </div>
        )}
      </main>

      <BottomNav active="orders" />
    </div>
  );
};

export default OrderScreen;
