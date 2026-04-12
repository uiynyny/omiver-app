import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Album, Bell, ChartPie, CircleUserRound, Cog, HeartPulse, ListChecks, LocateFixed } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

import './HomeScreen.css';
import omiver from '../assets/omiver.svg';
import { fetchDashboard } from '../api/user';

const HomeScreen = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const personal = state.registration;
  const displayName = `${state.registration.firstName ?? ''} ${state.registration.lastName ?? ''}`.trim();
  console.log('state', state);
  
  const clientId = state.auth.clientId;
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (clientId) {
      fetchDashboard(clientId).then((data) => {
        setDashboardData(data);
      }).catch((error) => console.error(error));
    }
  }, [clientId]);

  const biomarkers = useMemo(() => {
    if (!dashboardData?.biomarker_results) return [];
    return Object.entries(dashboardData.biomarker_results).map(([section, data]: [string, any]) => ({
      section,
      count: data.biomarker_count,
      items: data.results.map((r: any) => ({
        value: r.value,
        unit: r.unit,
        name: r.biomarker_name,
        note: r.normal_range,
        tag: r.status,
      })),
    }));
  }, [dashboardData]);

  const age = useMemo(() => {
    if (!personal.date_of_birth) return undefined;
    const b = new Date(personal.date_of_birth);
    const diff = Date.now() - b.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
  }, [personal.date_of_birth]);

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

      <main className="home-main">
        <div className="top-summary">
          <section className="score-card">
            <div className='score' >
              <div className="score-left">
                <div className="score-label">Overall Health Score</div>
                <div className="score-value">{dashboardData?.health_score ?? 0}%</div>
              </div>
              <div className="score-right">
                <HeartPulse className='score-circle' size={36} strokeWidth={1} />
              </div>
            </div>

            <div className="score-bar">
              <div className="score-fill" style={{ width: `${dashboardData?.health_score ?? 0}%` }} />
              <div className="score-sub">{dashboardData?.optimal_biomarkers ?? 0} out of {dashboardData?.total_biomarkers ?? 0} biomarkers in optimal range</div>
            </div>
          </section>
        </div>
        <div className='bottom-card'>
          <section className="profile-summary">
            <h3>Profile Summary</h3>
            <div className="profile-grid">
              <div className="profile-card">
                <div className="card-label">Name</div>
                <div className="card-value">{dashboardData?.profile?.name || displayName || '—'}</div>
              </div>
              <div className="profile-card">
                <div className="card-label">Age</div>
                <div className="card-value">{dashboardData?.profile?.age || age || '—'}</div>
              </div>
              <div className="profile-card">
                <div className="card-label">Height</div>
                <div className="card-value">{dashboardData?.profile?.height || personal.height || '—'}</div>
              </div>
              <div className="profile-card">
                <div className="card-label">Weight</div>
                <div className="card-value">{dashboardData?.profile?.weight || personal.weight || '—'}</div>
              </div>
            </div>
          </section>

          {biomarkers.map((section) => (
            <section className="biomarker-section" key={section.section}>
              <div className="section-header">
                <div className="section-title">{section.section}</div>
                <div className="section-count">{section.count} Biomarkers</div>
              </div>

              <div className="biomarker-cards">
                {section.items.map((item: { value: number; unit: string; name: string; note: string; tag: string }) => (
                  <div className="biomarker-card" key={item.name}>
                    <div className="biomarker-left">
                      <div className="biomarker-value">{item.value}</div>
                      <div className="biomarker-unit">{item.unit}</div>
                    </div>
                    <div className="biomarker-mid">
                      <div className="biomarker-name">{item.name}</div>
                      <div className="biomarker-note">{item.note}</div>
                    </div>
                    <div className={`biomarker-tag ${item.tag === 'Optimal' ? 'tag-optimal' : 'tag-normal'}`}>
                      {item.tag}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          <section className="recommendations">
            {biomarkers.length === 0 ? (
              <div className="no-data-cta">
                <h3>Unlock Your Insights</h3>
                <p className="rec-lead">You haven't taken any biomarker tests yet. Order a test kit to begin tracking your health and receive personalized recommendations.</p>
                <button className="order-kit-btn" onClick={() => navigate('/kits')}>Order Test Kit</button>
              </div>
            ) : (
              <>
                <h3>Personalized Recommendations</h3>
                <p className="rec-lead">Based on your biomarker results and health goals, we recommend:</p>
                <ul className="rec-list">
                  {(dashboardData?.recommendations || []).map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
      </main>

      <nav className="bottom-nav">
        <button className="nav-item active" onClick={() => navigate('/home')}><ChartPie size={28} />Dashboard</button>
        <button className="nav-item" onClick={() => navigate('/kits')}><Album size={28} />Kits</button>
        <button className="nav-item" onClick={() => navigate('/collection')}><LocateFixed size={28} />Collection</button>
        <button className="nav-item" onClick={() => navigate('/orders')}><ListChecks size={28} />Orders</button>
        <button className="nav-item" onClick={() => navigate('/profile')}><CircleUserRound size={28} />Profile</button>
      </nav>
    </div>
  );
};

export default HomeScreen;

