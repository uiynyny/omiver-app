import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Album, Bell, ChartPie, CircleUserRound, Cog, Link, ListChecks, LocateFixed, ScanLine } from 'lucide-react'

import './CollectionScreen.css'
import omiver from '../assets/omiver.svg';

const CollectionScreen: React.FC = () => {
  const navigate = useNavigate()
  // use context to show a friendly greeting when available
  const [url, setUrl] = useState('')

  const handleLink = () => {
    // placeholder behaviour: if url present, navigate to home or show success
    if (!url) return
    // in real app we'd validate and save to context/backend
    console.log('Linking kit url', url)
    navigate('/collection/steps')
  }

  return (
    <div className="collection-root">
      <header className="home-header">
        <div className="left-icons">
          <Bell className='icon-btn' size={20} />
        </div>
        <img src={omiver} alt="Omiver Logo" className="home-logo" width={150} />
        <div className="right-icons">
          <Cog className="icon-btn" size={20} />
        </div>
      </header>

      <main className="collection-main">
        <div className='kits-top'>
          <h2 className="kits-title">Complete your Test</h2>
        </div>
        <div className="bottom-card">
          <section className="collection-card">
            <div className='collection-card-group'>
              <div className='collection-card-text-group'>
                <div className="scan-title">Scan your Kit</div>
                <div className="scan-desc">Scan the barcode on your test kit to complete your test</div>
              </div>
              <div className='collection-card-icon'><ScanLine size={48} color='#D27644' /></div>
            </div>
            <button className="scan-cta" onClick={() => navigate('/collection/scan')}>Scan Kit Code ➜</button>
          </section>

          <div className="or-divider">OR</div>

          <section className="link-card">
            <div className='collection-card-group'>
              <div className='collection-card-text-group'>
                <div className="scan-title">Link your Kit</div>
                <div className="scan-desc">Copy and paste your test kit url to complete your test</div>
              </div>
              <div className='link-card-icon'><Link size={48} color='#C7A1BC' /></div>
            </div>
            <div className="url-row" style={{ marginTop: 12 }}>
              <input className="url-input" placeholder="Url..." value={url} onChange={e => setUrl(e.target.value)} />
              <button className="link-btn" onClick={handleLink}>Link</button>
            </div>
          </section>
        </div>
      </main>

      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/home')}><ChartPie size={28} />Dashboard</button>
        <button className="nav-item" onClick={() => navigate('/kits')}><Album size={28} />Kits</button>
        <button className="nav-item active" onClick={() => navigate('/collection')}><LocateFixed size={28} />Collection</button>
        <button className="nav-item" onClick={() => navigate('/orders')}><ListChecks size={28} />Orders</button>
        <button className="nav-item" onClick={() => navigate('/profile')}><CircleUserRound size={28} />Profile</button>
      </nav>
    </div>
  )
}

export default CollectionScreen
