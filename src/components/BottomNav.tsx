import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartPie, Album, LocateFixed, ListChecks, CircleUserRound, Lightbulb } from 'lucide-react';
import './BottomNav.css';

type Props = { active?: 'home' | 'kits' | 'collection' | 'orders' | 'recommendations' | 'profile' };

const BottomNav: React.FC<Props> = ({ active = 'home' }) => {
  const navigate = useNavigate();
  return (
    <nav className="bottom-nav">
      <button className={`nav-item ${active === 'home' ? 'active' : ''}`} onClick={() => navigate('/home')}>
        <ChartPie size={28} />
        <span>Dashboard</span>
      </button>
      <button className={`nav-item ${active === 'kits' ? 'active' : ''}`} onClick={() => navigate('/kits')}>
        <Album size={28} />
        <span>Kits</span>
      </button>
      <button className={`nav-item ${active === 'collection' ? 'active' : ''}`} onClick={() => navigate('/collection')}>
        <LocateFixed size={28} />
        <span>Collection</span>
      </button>

      <button className={`nav-item ${active === 'recommendations' ? 'active' : ''}`} onClick={() => navigate('/recommendations')}>
        <Lightbulb size={28} />
        <span>Recommendations</span>
      </button>
      <button className={`nav-item ${active === 'profile' ? 'active' : ''}`} onClick={() => navigate('/profile')}>
        <CircleUserRound size={28} />
        <span>Profile</span>
      </button>
    </nav>
  );
};

export default BottomNav;
