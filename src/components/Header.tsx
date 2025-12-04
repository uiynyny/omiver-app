import { User, MoreVertical } from 'lucide-react';
import omiverLogo from '../assets/omiver.svg';
import './Header.css';

const Header = () => {
  // TODO: Implement drawer navigation for the 'more' button
  const handleMoreClick = () => {
    alert('Drawer navigation to be implemented!');
  };

  return (
    <header className="app-header">
      <img src={omiverLogo} alt="Omiver Logo" className="header-logo" />
      <nav className="header-nav">
        <button className="demo-button">Demo</button>
        <button className="icon-button" aria-label="Profile">
          <User size={24} />
        </button>
        <button className="icon-button" aria-label="More options" onClick={handleMoreClick}>
          <MoreVertical size={24} />
        </button>
      </nav>
    </header>
  );
};

export default Header;