import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Box, Truck, CheckCircle, CircleUserRound, ListChecks, LocateFixed, ChartPie, Album, Bell, Cog, Package } from 'lucide-react'

import './OrderScreen.css'
import omiver from '../assets/omiver.svg';

const OrderScreen: React.FC = () => {
  const navigate = useNavigate()

  const order = {
    id: '182u0572572283',
    testName: 'Premium Test',
    date: '10/02/2025',
    tracking: 'TK19283JEJT',
    biomarkers: 650,
  }

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
          <div className="order-card">
            <div className='collection-card-group'>
              <div className='collection-card-text-group'>
                <div style={{ opacity: 0.85, marginBottom: 6 }}>{order.biomarkers} biomarkers</div>
                <h2>{order.testName}</h2>
              </div>
              <div className='order-card-icon'><Package size={48} color='#fff' /></div>
            </div>
            <div className="order-meta">
              <div>ID: {order.id}</div>
              <div>Order Date: {order.date}</div>
            </div>
          </div>
        </div>

        <div className='bottom-card'>
          <section className="tracking-panel">
            <div className="tracking-label">Tracking Number</div>
            <div style={{ color: '#777', marginBottom: 10 }}>Track your order</div>
            <div className="tracking-number">
              <div style={{ fontWeight: 700 }}>{order.tracking}</div>
              <button className="copy-btn" onClick={() => navigator.clipboard?.writeText(order.tracking)}>Copy</button>
            </div>
          </section>

          <section className="progress-card">
            <h3 style={{ marginTop: 0 }}>Delivery Progress</h3>

            <div className="progress-row">
              <div className="progress-icon"><CheckCircle color="#6b9b8a" /></div>
              <div>
                <div className="progress-title">Order Placed</div>
                <div style={{ color: '#777' }}>Your order has been received</div>
              </div>
            </div>

            <div className="progress-row">
              <div className="progress-icon"><Truck color="#6b9b8a" /></div>
              <div>
                <div className="progress-title">Metabolic Health</div>
                <div style={{ color: '#777' }}>Your kit is on its way</div>
              </div>
            </div>

            <div className="progress-row">
              <div className="progress-icon"><Box color="#6b9b8a" /></div>
              <div>
                <div className="progress-title">Kit Delivered <span style={{ background: '#eaf5ec', color: '#6b9b8a', marginLeft: 8, padding: '4px 8px', borderRadius: 12, fontSize: 12 }}>In Progress</span></div>
                <div style={{ color: '#777' }}>Ready for sample collection</div>
              </div>
            </div>
          </section>

          <section className="next-card">
            <h3>Next Steps</h3>
            <div style={{ color: '#777' }}>Your test kit has been delivered! Please proceed to the Sample Collection section to link your kit and begin the testing process.</div>
            <button className="next-cta" onClick={() => navigate('/collection/steps')}>Start Sample Collection</button>
          </section>
        </div>
      </main>

      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/home')}><ChartPie size={28} />Dashboard</button>
        <button className="nav-item" onClick={() => navigate('/kits')}><Album size={28} />Kits</button>
        <button className="nav-item" onClick={() => navigate('/collection')}><LocateFixed size={28} />Collection</button>
        <button className="nav-item active" onClick={() => navigate('/orders')}><ListChecks size={28} />Orders</button>
        <button className="nav-item" onClick={() => navigate('/profile')}><CircleUserRound size={28} />Profile</button>
      </nav>
    </div>
  )
}

export default OrderScreen
