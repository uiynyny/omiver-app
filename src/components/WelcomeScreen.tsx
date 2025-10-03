
import React, { useState } from 'react';
import './WelcomeScreen.css';
import omiverLogo from '../assets/omiver.svg';

const WelcomeScreen = () => {
  const [page, setPage] = useState(1);

  const handleNext = () => {
    if (page < 4) {
      setPage(page + 1);
    }
  };

  return (
    <div className={`welcome-screen ${page === 1 ? 'page-1' : ''}`}>
      {page === 1 && (
        <img src={omiverLogo} alt="Omiver Logo" className="omiver-logo" />
      )}
      {page !== 1 && (
        <div className="welcome-content">
          <h1>Page {page}</h1>
          <p>This is page {page} of the welcome screen.</p>
        </div>
      )}
      <button onClick={handleNext} disabled={page === 4}>
        {page === 1 ? 'Start Now \u2192' : 'Continue'}
      </button>
    </div>
  );
};

export default WelcomeScreen;
