import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy, CheckCheck, Users, Link2, LogOut, Share2,
  ChevronDown, ChevronUp, Calendar, Weight, Ruler,
  HeartPulse, Utensils, Target, Mail, ClipboardList,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getReferralLink, getProviderPatients, type Patient } from '../api/user';
import './ProviderDashboardScreen.css';

/** Build the referral URL on the frontend — always correct for the current environment */
function buildReferralUrl(code: string): string {
  const base =
    import.meta.env.VITE_APP_URL?.replace(/\/$/, '') ||
    window.location.origin;
  const path = import.meta.env.VITE_WEB ? '/app/register' : '/register';
  return `${base}${path}?ref=${code}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function calcAge(dob: string | null): string {
  if (!dob) return '—';
  const d = new Date(dob);
  const age = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
  return `${age} yrs`;
}

// ── Patient card ─────────────────────────────────────────────────────────────
const PatientCard = ({ patient, onReview }: { patient: Patient; onReview: (patient: Patient) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const initials = patient.full_name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className={`patient-card ${expanded ? 'expanded' : ''}`}>
      {/* Summary row */}
      <button
        className="patient-card-summary"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        <div className="patient-avatar">{initials || '?'}</div>
        <div className="patient-summary-info">
          <span className="patient-name">{patient.full_name}</span>
          <span className="patient-meta">
            {calcAge(patient.date_of_birth)}
            {patient.gender ? ` · ${patient.gender}` : ''}
            {patient.total_orders > 0 ? ` · ${patient.total_orders} order${patient.total_orders !== 1 ? 's' : ''}` : ''}
          </span>
        </div>
        {expanded ? <ChevronUp size={18} className="expand-icon" /> : <ChevronDown size={18} className="expand-icon" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="patient-detail">
          <div className="patient-detail-grid">
            <div className="detail-item">
              <Mail size={14} />
              <span>{patient.email}</span>
            </div>
            {patient.height && (
              <div className="detail-item">
                <Ruler size={14} />
                <span>{patient.height}" height</span>
              </div>
            )}
            {patient.weight && (
              <div className="detail-item">
                <Weight size={14} />
                <span>{patient.weight} lbs</span>
              </div>
            )}
            {patient.latest_test_date && (
              <div className="detail-item">
                <Calendar size={14} />
                <span>Last test: {formatDate(patient.latest_test_date)}</span>
              </div>
            )}
            <div className="detail-item">
              <Calendar size={14} />
              <span>Joined: {formatDate(patient.created_at)}</span>
            </div>
          </div>

          {patient.health_conditions && (
            <div className="detail-section">
              <div className="detail-section-label"><HeartPulse size={13} /> Health Conditions</div>
              <p className="detail-section-text">{patient.health_conditions}</p>
            </div>
          )}
          {patient.dietary_preferences && (
            <div className="detail-section">
              <div className="detail-section-label"><Utensils size={13} /> Dietary Preferences</div>
              <p className="detail-section-text">{patient.dietary_preferences}</p>
            </div>
          )}
          {patient.fitness_goal && (
            <div className="detail-section">
              <div className="detail-section-label"><Target size={13} /> Fitness Goal</div>
              <p className="detail-section-text">{patient.fitness_goal}</p>
            </div>
          )}

          <button className="primary-action-btn" onClick={() => onReview(patient)}>
            Review / Edit Intake
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────────
const ProviderDashboardScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const clientId = state.auth.clientId;

  const [referralCode, setReferralCode] = useState<string>(state.registration.referralCode ?? '');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shareSupported] = useState(() => typeof navigator.share === 'function');
  const [activeTab, setActiveTab] = useState<'patients' | 'referral'>('patients');
  const [refreshing, setRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const providerName = [state.registration.firstName, state.registration.lastName]
    .filter(Boolean)
    .join(' ');

  const referralUrl = referralCode ? buildReferralUrl(referralCode) : '';

  const loadData = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    try {
      await Promise.all([
        getReferralLink(clientId).then((d) => {
          setReferralCode(d.referral_code);
          dispatch({ type: 'UPDATE_REGISTRATION', payload: { referralCode: d.referral_code } });
        }),
        getProviderPatients(clientId).then(setPatients),
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [clientId, dispatch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setStartY(e.touches[0].pageY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      const currentY = e.touches[0].pageY;
      const diff = currentY - startY;
      if (diff > 0) {
        setPullDistance(Math.min(diff, 100)); // Limit distance to 100px
      }
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setRefreshing(true);
      await loadData();
      setRefreshing(false);
    }
    setPullDistance(0);
  };

  const handleShare = async () => {
    if (shareSupported) {
      try {
        await navigator.share({
          title: 'Join me on Omiver',
          text: `${providerName || 'Your provider'} has invited you to Omiver. Click to get started!`,
          url: referralUrl,
        });
        return;
      } catch { /* dismissed */ }
    }
    try { await navigator.clipboard.writeText(referralUrl); }
    catch {
      const el = document.createElement('textarea');
      el.value = referralUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleLogout = () => {
    dispatch({ type: 'CLEAR_AUTH' });
    dispatch({ type: 'RESET_REGISTRATION' });
    navigate('/');
  };

  const handleReviewPatient = (patient: Patient) => {
    navigate(`/provider/patient/${patient.id}`, { state: { patient } });
  };

  return (
    <div
      className="provider-dashboard"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`pull-to-refresh-indicator ${pullDistance > 0 ? 'visible' : ''}`} style={{ height: `${pullDistance}px` }}>
        <div className="pull-to-refresh-content">
          {refreshing ? (
            <span className="refresh-status">Refreshing...</span>
          ) : pullDistance > 60 ? (
            <span className="refresh-status">Release to refresh</span>
          ) : (
            <span className="refresh-status">Pull to refresh</span>
          )}
        </div>
      </div>
      {/* ── Header ─────────────────────────────────────────── */}
      <header className="provider-header">
        <div className="provider-header-left">
          <div className="provider-avatar-lg">
            {providerName ? providerName[0].toUpperCase() : 'P'}
          </div>
          <div>
            <p className="provider-greeting">Provider Dashboard</p>
            <h2 className="provider-name">{providerName || 'Provider'}</h2>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          <LogOut size={20} />
        </button>
      </header>

      {/* ── Stat bar ───────────────────────────────────────── */}
      <div className="stat-bar">
        <div className="stat-item">
          <Users size={18} className="stat-icon" />
          <div>
            <span className="stat-value">{patients.length}</span>
            <span className="stat-label">Patients</span>
          </div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <ClipboardList size={18} className="stat-icon" />
          <div>
            <span className="stat-value">
              {patients.reduce((sum, p) => sum + p.total_orders, 0)}
            </span>
            <span className="stat-label">Total Orders</span>
          </div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <HeartPulse size={18} className="stat-icon" />
          <div>
            <span className="stat-value">
              {patients.filter((p) => p.latest_test_date).length}
            </span>
            <span className="stat-label">Tests Done</span>
          </div>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────── */}
      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          <Users size={15} /> Patients
        </button>
        <button
          className={`tab-btn ${activeTab === 'referral' ? 'active' : ''}`}
          onClick={() => setActiveTab('referral')}
        >
          <Link2 size={15} /> Referral Link
        </button>
      </div>

      <div className="provider-content">
        {/* ── Patients tab ───────────────────────────────────── */}
        {activeTab === 'patients' && (
          <>
            {loading ? (
              <div className="patients-loading">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="patient-skeleton" />
                ))}
              </div>
            ) : patients.length === 0 ? (
              <div className="empty-state">
                <Users size={48} className="empty-icon" />
                <h3>No patients yet</h3>
                <p>Share your referral link with patients to get started.</p>
                <button className="primary-action-btn" onClick={() => setActiveTab('referral')}>
                  <Link2 size={16} /> Get Referral Link
                </button>
              </div>
            ) : (
              <div className="patients-list">
                <div className="patients-list-header">
                  <span>{patients.length} patient{patients.length !== 1 ? 's' : ''}</span>
                </div>
                {patients.map((p) => (
                  <PatientCard key={p.id} patient={p} onReview={handleReviewPatient} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Referral tab ───────────────────────────────────── */}
        {activeTab === 'referral' && (
          <div className="referral-card">
            <div className="referral-card-header">
              <Link2 size={20} />
              <h3>Your Referral Link</h3>
            </div>
            <p className="referral-card-desc">
              Share this link with patients to onboard them onto Omiver. Their accounts will be automatically associated with you.
            </p>

            {loading ? (
              <div className="referral-skeleton" aria-label="Loading…" />
            ) : (
              <>
                <div className="referral-code-badge">
                  <span className="referral-code-label">Code</span>
                  <span className="referral-code-value">{referralCode || '—'}</span>
                </div>

                <div className="referral-url-box" title={referralUrl}>
                  <span className="referral-url-text">
                    {referralUrl || 'No referral code available'}
                  </span>
                </div>

                <button
                  id="copy-referral-btn"
                  className={`copy-btn ${copied ? 'copied' : ''}`}
                  onClick={handleShare}
                  disabled={!referralCode}
                >
                  {copied ? (
                    <><CheckCheck size={18} /> Copied!</>
                  ) : shareSupported ? (
                    <><Share2 size={18} /> Share Referral Link</>
                  ) : (
                    <><Copy size={18} /> Copy Referral Link</>
                  )}
                </button>
              </>
            )}

            <div className="instructions-card">
              <h4>How it works</h4>
              <ol className="instructions-list">
                <li>Tap <strong>{shareSupported ? 'Share' : 'Copy'}</strong> to send your unique referral link.</li>
                <li>Share it with your patient via email, SMS, or in-person.</li>
                <li>When they sign up using your link, their account is automatically linked to you.</li>
                <li>Track your referred patients under the Patients tab.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboardScreen;
