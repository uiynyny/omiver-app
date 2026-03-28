import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Album, Bell, ChartPie, CircleUserRound, Cog, ListChecks, LocateFixed } from 'lucide-react';

import './KitsScreen.css';
import omiver from '../assets/omiver.svg';
import { fetchKits } from '../api/user';

const kitDefaults: Record<string, { color: string; features: string[] }> = {
  'Basic Test': {
    color: '#d98252',
    features: [
      'Complete blood panel analysis',
      'Essential vitamin and mineral levels',
      'Basic hormone screening',
      'Cholesterol and glucose markers',
      'Personalized recommendations',
    ],
  },
  'Premium Test': {
    color: '#c99bb9',
    features: [
      'Advanced hormone panel',
      'Inflammatory markers analysis',
      'Food sensitivity testing',
      'Genetic predisposition markers',
      'Metabolic health insights',
      'Priority processing & support',
    ],
  },
};

const KitsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [kits, setKits] = useState<any[]>([]);

  useEffect(() => {
    fetchKits().then((data) => {
      const mappedKits = data.map((k: any) => ({
        id: k.id,
        title: k.name,
        subtitle: k.description,
        price: `$${k.price}`,
        frequency: 'one-time',
        color: kitDefaults[k.name]?.color || '#6b9b8a',
        badge: k.biomarker_count.toString(),
        features: kitDefaults[k.name]?.features || [
          'Biomarker analysis',
          'Personalized recommendations',
        ],
      }));
      setKits(mappedKits);
    }).catch((error) => console.error(error));
  }, []);

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
                  <div className="badge-label">Biomarkers Tested</div>
                  <div className="badge-pill" style={{ background: k.color }}>{k.badge}</div>
                </div>

                <ul className="kit-features">
                  {k.features.map((f) => (
                    <li key={f} className="kit-feature"><span className="check">✓</span>{f}</li>
                  ))}
                </ul>

                <button
                  className="kit-cta"
                  style={{ background: k.color }}
                  onClick={() => navigate('/payment', { state: { kit: k } })}
                >
                  Continue to Billing ➜
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <nav className="bottom-nav">
        <button className="nav-item" onClick={() => navigate('/home')}><ChartPie size={28} />Dashboard</button>
        <button className="nav-item active" onClick={() => navigate('/kits')}><Album size={28} />Kits</button>
        <button className="nav-item" onClick={() => navigate('/collection')}><LocateFixed size={28} />Collection</button>
        <button className="nav-item" onClick={() => navigate('/orders')}><ListChecks size={28} />Orders</button>
        <button className="nav-item" onClick={() => navigate('/profile')}><CircleUserRound size={28} />Profile</button>
      </nav>
    </div>
  );
};

export default KitsScreen;

