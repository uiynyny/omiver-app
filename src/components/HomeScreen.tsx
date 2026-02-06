import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Album, Bell, ChartPie, CircleUserRound, Cog, HeartPulse, ListChecks, LocateFixed } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

import './HomeScreen.css';
import omiver from '../assets/omiver.svg';
import { login } from '../api/user';

const sampleBiomarkers = [
  {
    section: 'Metabolic Health',
    count: 3,
    items: [
      { value: '92', unit: 'mg/DL', name: 'Glucose (Fasting)', note: 'Normal: 70-100', tag: 'Optimal' },
      { value: '5.4', unit: '%', name: 'Hba1c', note: 'Normal: <5.7%', tag: 'Optimal' },
      { value: '8.5', unit: 'uIU/mL', name: 'Insulin', note: 'Normal: 70-100', tag: 'Normal' },
    ],
  },
  {
    section: 'Cardiovascular Health',
    count: 4,
    items: [
      { value: '185', unit: 'mg/DL', name: 'Total Cholesterol', note: 'Normal: 70-100', tag: 'Optimal' },
      { value: '98', unit: 'mg/DL', name: 'LDL Cholesterol', note: 'Normal: <5.7%', tag: 'Optimal' },
      { value: '2.5', unit: 'uIU/mL', name: 'Thyroid (TSH)', note: 'Normal: 70-100', tag: 'Normal' },
      { value: '15', unit: 'uIU/mL', name: 'Cortisol', note: 'Normal: 70-100', tag: 'Normal' },
    ],
  },
  {
    section: 'Inflammation',
    count: 2,
    items: [
      { value: '1.2', unit: 'mg/DL', name: 'C-Reactive Protein', note: 'Normal: 70-100', tag: 'Optimal' },
      { value: '8.5', unit: 'uIU/mL', name: 'Homocysteine', note: 'Normal: <5.7%', tag: 'Optimal' },
    ],
  },
];

const HomeScreen = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  const personal = state.registration;
  const displayName = `${state.registration.firstName ?? ''} ${state.registration.lastName ?? ''}`.trim();
  console.log('state', state);
  
  useEffect(() => {
    if (state.registration.email && state.registration.password) {
      login(state.registration.email, state.registration.password).then((res) => {
        console.log('login response', res);
      });
    }
  },[])



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
                <div className="score-value">60%</div>
              </div>
              <div className="score-right">
                <HeartPulse className='score-circle' size={36} strokeWidth={1} />
              </div>
            </div>

            <div className="score-bar">
              <div className="score-fill" style={{ width: '60%' }} />
              <div className="score-sub">10 out of 16 biomarkers in optimal range</div>
            </div>
          </section>
        </div>
        <div className='bottom-card'>
          <section className="profile-summary">
            <h3>Profile Summary</h3>
            <div className="profile-grid">
              <div className="profile-card">
                <div className="card-label">Name</div>
                <div className="card-value">{displayName ?? '—'}</div>
              </div>
              <div className="profile-card">
                <div className="card-label">Age</div>
                <div className="card-value">{age ?? '—'}</div>
              </div>
              <div className="profile-card">
                <div className="card-label">Height</div>
                <div className="card-value">{personal.height ?? '—'}</div>
              </div>
              <div className="profile-card">
                <div className="card-label">Weight</div>
                <div className="card-value">{personal.weight ?? '—'}</div>
              </div>
            </div>
          </section>

          {sampleBiomarkers.map((section) => (
            <section className="biomarker-section" key={section.section}>
              <div className="section-header">
                <div className="section-title">{section.section}</div>
                <div className="section-count">{section.count} Biomarkers</div>
              </div>

              <div className="biomarker-cards">
                {section.items.map((item) => (
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
            <h3>Personalized Recommendations</h3>
            <p className="rec-lead">Based on your biomarker results and health goals, we recommend:</p>
            <ul className="rec-list">
              <li>Continue maintaining your current metabolic health practices</li>
              <li>Consider increasing omega-3 intake for cardiovascular support</li>
              <li>Maintain your current exercise routine for optimal hormone balance</li>
            </ul>
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

