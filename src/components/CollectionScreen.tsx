import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, Cog, Link, ScanLine } from 'lucide-react'

import './CollectionScreen.css'
import BottomNav from './BottomNav';
import omiver from '../assets/omiver.svg';

const CollectionScreen: React.FC = () => {
  const navigate = useNavigate()
  const [kitCode, setKitCode] = useState('')
  const [barcodeValue, setBarcodeValue] = useState('')

  const handleLink = () => {
    const code = (kitCode || barcodeValue).trim()
    if (!code) return
    navigate('/collection/steps', { state: { kitCode: code } })
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
                <div className="scan-desc">Scan the barcode on your test kit or enter the kit code manually</div>
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
                <div className="scan-desc">Enter your kit code manually to continue</div>
              </div>
              <div className='link-card-icon'><Link size={48} color='#C7A1BC' /></div>
            </div>
            <div className="url-row" style={{ marginTop: 12 }}>
              <input className="url-input" placeholder="Enter kit code" value={kitCode} onChange={e => setKitCode(e.target.value)} />
              <button className="link-btn" onClick={handleLink}>Link</button>
            </div>
            <input
              className="barcode-hidden-input"
              aria-label="Barcode reader input"
              value={barcodeValue}
              onChange={(e) => setBarcodeValue(e.target.value)}
              placeholder="Barcode input support"
            />
          </section>
        </div>
      </main>

      <BottomNav active="collection" />
    </div>
  );
};

export default CollectionScreen
