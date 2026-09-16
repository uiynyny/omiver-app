import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Copy, CheckCheck, Users, Link2, LogOut, Share2,
  ChevronDown, ChevronUp, Calendar, Weight, Ruler,
  HeartPulse, Utensils, Target, Mail, ClipboardList,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { getReferralLink, getProviderPatients, type Patient } from '../api/user';
import { useLogout } from '../hooks/useLogout';
import { formatHeight, formatWeight, calcAge } from '../utils/format';
import './ProviderDashboardScreen.css';

function buildReferralUrl(code: string): string {
  const base = import.meta.env.VITE_APP_URL?.replace(/\/$/, '') || window.location.origin;
  const path = import.meta.env.VITE_WEB ? '/app/register' : '/register';
  return `${base}${path}?ref=${code}`;
}

function formatDateStr(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const PatientCard = ({ patient, onReview }: { patient: Patient; onReview: (patient: Patient) => void }) => {
  const [expanded, setExpanded] = useState(false);
  const initials = patient.full_name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="list__row stack-sm" style={{ padding: 'var(--sp-4)', alignItems: 'stretch' }}>
      <button
        type="button"
        className="row-between"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        style={{ width: '100%', textAlign: 'left', background: 'transparent', padding: 0 }}
      >
        <div className="row">
          <div className="patient-avatar">{initials || '?'}</div>
          <div className="stack" style={{ gap: '2px' }}>
            <span className="list__title">{patient.full_name}</span>
            <span className="list__meta">
              {calcAge(patient.date_of_birth) ?? '—'} yrs
              {patient.gender ? ` · ${patient.gender}` : ''}
              {patient.total_orders > 0 ? ` · ${patient.total_orders} order${patient.total_orders !== 1 ? 's' : ''}` : ''}
            </span>
          </div>
        </div>
        <div className="list__chevron">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="stack-sm fade-in" style={{ marginTop: 'var(--sp-3)' }}>
          <div className="grid-2col">
            <div className="row text-secondary text-body">
              <Mail size={14} /> <span>{patient.email}</span>
            </div>
            {patient.height && (
              <div className="row text-secondary text-body">
                <Ruler size={14} /> <span>{formatHeight(patient.height)} height</span>
              </div>
            )}
            {patient.weight && (
              <div className="row text-secondary text-body">
                <Weight size={14} /> <span>{formatWeight(patient.weight)}</span>
              </div>
            )}
            {patient.latest_test_date && (
              <div className="row text-secondary text-body">
                <Calendar size={14} /> <span>Last test: {formatDateStr(patient.latest_test_date)}</span>
              </div>
            )}
            <div className="row text-secondary text-body">
              <Calendar size={14} /> <span>Joined: {formatDateStr(patient.created_at)}</span>
            </div>
          </div>

          {patient.health_conditions && (
            <div className="stack" style={{ gap: '4px', marginTop: 'var(--sp-2)' }}>
              <div className="row text-label text-accent"><HeartPulse size={14} /> Health Conditions</div>
              <p className="text-body text-secondary">{patient.health_conditions}</p>
            </div>
          )}
          {patient.dietary_preferences && (
            <div className="stack" style={{ gap: '4px', marginTop: 'var(--sp-2)' }}>
              <div className="row text-label text-accent"><Utensils size={14} /> Dietary Preferences</div>
              <p className="text-body text-secondary">{patient.dietary_preferences}</p>
            </div>
          )}
          {patient.fitness_goal && (
            <div className="stack" style={{ gap: '4px', marginTop: 'var(--sp-2)' }}>
              <div className="row text-label text-accent"><Target size={14} /> Fitness Goal</div>
              <p className="text-body text-secondary">{patient.fitness_goal}</p>
            </div>
          )}

          <button type="button" className="btn btn--secondary btn--sm" style={{ marginTop: 'var(--sp-2)' }} onClick={() => onReview(patient)}>
            Review / Edit Intake
          </button>
        </div>
      )}
    </div>
  );
};

const ProviderDashboardScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const clientId = state.auth.clientId;

  const [referralCode, setReferralCode] = useState<string>(state.registration.referralCode ?? '');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [copied, setCopied] = useState(false);
  /** Handle for the "Copied" toast timer, so it can be cleared on unmount. */
  const copiedTimerRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareSupported] = useState(() => typeof navigator.share === 'function');
  const [activeTab, setActiveTab] = useState<'patients' | 'referral'>('patients');
  const [refreshing, setRefreshing] = useState(false);
  
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);

  const providerName = [state.registration.first_name, state.registration.last_name]
    .filter(Boolean)
    .join(' ');

  const referralUrl = referralCode ? buildReferralUrl(referralCode) : '';

  const loadData = useCallback(async (isMounted: { current: boolean }) => {
    if (!clientId) {
      if (isMounted.current) setLoading(false);
      return;
    }
    try {
      const [refData, patData] = await Promise.all([
        getReferralLink(clientId),
        getProviderPatients(clientId)
      ]);
      if (isMounted.current) {
        setReferralCode(refData.referral_code);
        dispatch({ type: 'UPDATE_REGISTRATION', payload: { referralCode: refData.referral_code } });
        setPatients(patData);
      }
    } catch {
      // Ignored
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [clientId, dispatch]);

  useEffect(() => {
    const isMounted = { current: true };
    loadData(isMounted);
    return () => {
      isMounted.current = false;
    };
  }, [loadData]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) setStartY(e.touches[0].pageY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      const diff = e.touches[0].pageY - startY;
      if (diff > 0) setPullDistance(Math.min(diff, 100));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > 60) {
      setRefreshing(true);
      await loadData({ current: true });
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
    try {
      await navigator.clipboard.writeText(referralUrl);
    } catch {
      const el = document.createElement('textarea');
      el.value = referralUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    // NOTE: a cleanup function returned from an event handler is discarded —
    // only useEffect consumes one. The timer is tracked in a ref instead and
    // cleared on unmount (see the effect below), so it cannot fire into an
    // unmounted component.
    if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => setCopied(false), 2500);
  };

  useEffect(() => () => {
    if (copiedTimerRef.current) window.clearTimeout(copiedTimerRef.current);
  }, []);

  const handleLogout = useLogout();

  const handleReviewPatient = (patient: Patient) => {
    navigate(`/provider/patient/${patient.id}`, { state: { patient } });
  };

  return (
    <div
      className="screen"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className={`pull-refresh-bar ${pullDistance > 0 ? 'visible' : ''}`} style={{ height: `${pullDistance}px` }}>
        {refreshing ? 'Refreshing...' : pullDistance > 60 ? 'Release to refresh' : 'Pull to refresh'}
      </div>

      <header className="app-header" style={{ borderBottom: 'none' }}>
        <span />
        <div className="brand-logo dash__logo" role="img" aria-label="Omiver" />
        <button type="button" className="icon-btn icon-btn--plain" onClick={handleLogout} aria-label="Logout">
          <LogOut size={20} />
        </button>
      </header>

      <main className="container stack-lg" style={{ paddingTop: 'var(--sp-4)', paddingBottom: 'var(--sp-6)' }}>
        
        <section className="fade-in">
          <p className="text-label text-tertiary text-uppercase">Provider Dashboard</p>
          <h1 className="display-name">{providerName || 'Provider'}</h1>
        </section>

        <section className="card card--flush row">
          <div className="stack" style={{ flex: 1, alignItems: 'center', padding: 'var(--sp-4)', gap: '4px' }}>
            <span className="stat__value">{patients.length}</span>
            <span className="text-label text-secondary row" style={{ gap: '4px' }}><Users size={14} /> Patients</span>
          </div>
          <div className="divider" style={{ width: '1px', height: '40px' }} />
          <div className="stack" style={{ flex: 1, alignItems: 'center', padding: 'var(--sp-4)', gap: '4px' }}>
            <span className="stat__value">{patients.reduce((sum, p) => sum + p.total_orders, 0)}</span>
            <span className="text-label text-secondary row" style={{ gap: '4px' }}><ClipboardList size={14} /> Orders</span>
          </div>
          <div className="divider" style={{ width: '1px', height: '40px' }} />
          <div className="stack" style={{ flex: 1, alignItems: 'center', padding: 'var(--sp-4)', gap: '4px' }}>
            <span className="stat__value">{patients.filter((p) => p.latest_test_date).length}</span>
            <span className="text-label text-secondary row" style={{ gap: '4px' }}><HeartPulse size={14} /> Tests</span>
          </div>
        </section>

        <div className="segmented segmented--block" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'patients'}
            className="segmented__item row"
            style={{ justifyContent: 'center' }}
            onClick={() => setActiveTab('patients')}
          >
            <Users size={16} /> Patients
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'referral'}
            className="segmented__item row"
            style={{ justifyContent: 'center' }}
            onClick={() => setActiveTab('referral')}
          >
            <Link2 size={16} /> Referral
          </button>
        </div>

        {activeTab === 'patients' && (
          <section className="fade-in">
            {loading ? (
              <div className="stack-sm" aria-busy="true">
                <span className="sr-only">Loading patients...</span>
                <div className="skeleton" style={{ height: 64 }} />
                <div className="skeleton" style={{ height: 64 }} />
                <div className="skeleton" style={{ height: 64 }} />
              </div>
            ) : patients.length === 0 ? (
              <div className="empty-state card">
                <span className="empty-state__icon" aria-hidden="true"><Users size={24} /></span>
                <h3 className="empty-state__title">No patients yet</h3>
                <p className="empty-state__body">Share your referral link with patients to get started.</p>
                <button type="button" className="btn btn--primary" onClick={() => setActiveTab('referral')}>
                  <Link2 size={16} /> Get Referral Link
                </button>
              </div>
            ) : (
              <div className="card card--flush list">
                {patients.map((p) => (
                  <PatientCard key={p.id} patient={p} onReview={handleReviewPatient} />
                ))}
              </div>
            )}
          </section>
        )}

        {activeTab === 'referral' && (
          <section className="fade-in card stack-lg">
            <div className="stack-sm">
              <div className="row text-accent">
                <Link2 size={24} />
                <h2 className="section-title" style={{ margin: 0 }}>Your Referral Link</h2>
              </div>
              <p className="text-body text-secondary">
                Share this link with patients to onboard them onto Omiver. Their accounts will be automatically associated with you.
              </p>
            </div>

            {loading ? (
              <div className="skeleton" style={{ height: 96 }} aria-label="Loading link..." />
            ) : (
              <div className="stack">
                <div className="card card--inset row-between">
                  <span className="text-label text-accent text-uppercase">Code</span>
                  <span className="text-body tabular" style={{ fontWeight: 600 }}>{referralCode || '—'}</span>
                </div>
                <div className="card card--inset">
                  <span className="text-body text-secondary" style={{ wordBreak: 'break-all' }}>
                    {referralUrl || 'No referral code available'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn--primary btn--block"
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
              </div>
            )}

            <div className="card card--inset stack-sm">
              <h3 className="text-label text-tertiary text-uppercase">How it works</h3>
              <ol className="text-body text-secondary" style={{ paddingLeft: 'var(--sp-4)', margin: 0 }}>
                <li>Tap <strong>{shareSupported ? 'Share' : 'Copy'}</strong> to send your unique referral link.</li>
                <li>Share it with your patient via email, SMS, or in-person.</li>
                <li>When they sign up using your link, their account is automatically linked to you.</li>
                <li>Track your referred patients under the Patients tab.</li>
              </ol>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default ProviderDashboardScreen;
