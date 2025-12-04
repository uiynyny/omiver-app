import { Outlet } from 'react-router-dom';
import Header from './Header';

const WelcomeLayout = () => {
  return (
    <div>
      <Header />
      <main style={{ paddingTop: '64px' }}> {/* Offset content to avoid being hidden by the fixed header */}
        <Outlet />
      </main>
    </div>
  );
};

export default WelcomeLayout;