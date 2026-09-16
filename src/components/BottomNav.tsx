import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChartPie, Album, CircleUserRound, Lightbulb } from 'lucide-react';
import './BottomNav.css';

export type NavKey = 'home' | 'kits' | 'orders' | 'recommendations' | 'profile';

type Props = { active?: NavKey };

const items: { key: NavKey; label: string; path: string; Icon: typeof ChartPie }[] = [
  { key: 'home', label: 'Dashboard', path: '/home', Icon: ChartPie },
  { key: 'kits', label: 'Kits', path: '/kits', Icon: Album },
  { key: 'recommendations', label: 'Plan', path: '/recommendations', Icon: Lightbulb },
  { key: 'profile', label: 'Profile', path: '/profile', Icon: CircleUserRound },
];

const BottomNav: React.FC<Props> = ({ active = 'home' }) => {
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav" aria-label="Primary">
      <div className="bottom-nav__inner">
        {items.map(({ key, label, path, Icon }) => {
          // Orders is reached from Kits and has no tab of its own, so it keeps
          // the Kits tab lit rather than leaving the bar with nothing active.
          const isActive = active === key || (active === 'orders' && key === 'kits');

          return (
            <button
              key={key}
              type="button"
              className={`bottom-nav__item ${isActive ? 'is-active' : ''}`}
              onClick={() => navigate(path)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={22} strokeWidth={isActive ? 2.4 : 1.9} aria-hidden="true" />
              <span className="bottom-nav__label">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
