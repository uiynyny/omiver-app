import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Lock, FlaskConical, Sparkles, AlertCircle } from 'lucide-react';

import { useAppContext } from '../context/AppContext';
import BottomNav from './BottomNav';
import {
  fetchDashboard,
  fetchClient,
  setCustomProfileKey,
  getCustomProfileKey,
  fetchBiomarkerTests,
  fetchBiomarkerTestDetail,
  fetchRecommendations,
  fetchBiomarkerReports,
  type BiomarkerSection,
  type Dashboard,
  type BiomarkerTest,
  type BiomarkerTestDetail,
} from '../api/user';
import {
  classifyStatus,
  statusChipClass,
  statusLabel,
  formatBiomarkerValue,
  summarise,
  groupByCategory,
  type BiomarkerRow,
} from '../utils/biomarkers';
import { calcAge, formatDate, formatDateLong, formatHeight, formatWeight } from '../utils/format';
import './HomeScreen.css';

/** Raw rows come back loosely typed; normalise once at the boundary. */
type RawResult = {
  id?: number;
  biomarker?: number;
  biomarker_name?: string;
  name?: string;
  value?: number;
  unit?: string;
  normal_range?: string;
  category?: string;
  status?: string;
};

const toRows = (results: RawResult[] | undefined): BiomarkerRow[] =>
  (results ?? []).map((r, i) => ({
    id: r.id ?? r.biomarker ?? i,
    name: r.biomarker_name || r.name || `Biomarker #${r.biomarker ?? i}`,
    value: Number(r.value ?? 0),
    unit: r.unit ?? '',
    range: r.normal_range,
    category: r.category,
    status: r.status ?? '',
  }));

const HomeScreen = () => {
  const navigate = useNavigate();
  const { state, dispatch } = useAppContext();
  const personal = state.registration;
  const clientId = state.auth.clientId;

  const displayName = `${personal.first_name ?? ''} ${personal.last_name ?? ''}`.trim();
  const firstName = (personal.first_name ?? '').trim();

  // Profile lock state
  const [profileKey, setProfileKey] = useState<string | null>(() => getCustomProfileKey());
  const isLocked = !!personal.use_custom_key && !profileKey;
  const [unlockKey, setUnlockKey] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Data
  const [dashboardData, setDashboardData] = useState<Dashboard | null>(null);
  const [biomarkerTests, setBiomarkerTests] = useState<BiomarkerTest[]>([]);
  const [hasReports, setHasReports] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Selected test
  const [selectedTestId, setSelectedTestId] = useState<number | null>(null);
  const [selectedTestDetail, setSelectedTestDetail] = useState<BiomarkerTestDetail | null>(null);
  const [selectedTestRecs, setSelectedTestRecs] = useState<string[]>([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [viewMode, setViewMode] = useState<'category' | 'flat'>('category');

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    setLoading(true);
    setLoadError('');

    Promise.allSettled([
      fetchDashboard(clientId),
      fetchBiomarkerTests(clientId),
      fetchBiomarkerReports(clientId),
    ]).then(([dash, tests, reports]) => {
      if (cancelled) return;

      if (dash.status === 'fulfilled') setDashboardData(dash.value);
      if (tests.status === 'fulfilled') setBiomarkerTests(tests.value);
      if (reports.status === 'fulfilled') setHasReports(reports.value.length > 0);

      // Only surface an error if the primary request failed — a missing
      // reports list is a normal state, not a failure worth alarming about.
      if (dash.status === 'rejected' && tests.status === 'rejected') {
        setLoadError('We could not load your results. Check your connection and try again.');
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const handleUnlock = async () => {
    if (!unlockKey.trim() || !clientId) return;
    setUnlocking(true);
    setUnlockError('');

    try {
      setCustomProfileKey(unlockKey);
      const clientData = await fetchClient(clientId);

      if (clientData.first_name === '[Locked]' || clientData.last_name === '[Locked]') {
        setCustomProfileKey(null);
        setUnlockError('That passphrase did not work. Please try again.');
        return;
      }

      setProfileKey(unlockKey);
      dispatch({
        type: 'UPDATE_REGISTRATION',
        payload: {
          ...clientData,
          healthConditions: clientData.health_conditions || clientData.healthConditions || '',
        },
      });

      const [dash, tests] = await Promise.all([
        fetchDashboard(clientId).catch(() => null),
        fetchBiomarkerTests(clientId).catch(() => null),
      ]);
      if (dash) setDashboardData(dash);
      if (tests) setBiomarkerTests(tests);
    } catch {
      setCustomProfileKey(null);
      setUnlockError('Something went wrong while unlocking. Please try again.');
    } finally {
      setUnlocking(false);
    }
  };

  const handleSelectTest = async (testId: number) => {
    setSelectedTestId(testId);
    setLoadingDetail(true);
    setDetailError('');
    setViewMode('category');

    try {
      const detail = await fetchBiomarkerTestDetail(testId);
      setSelectedTestDetail(detail);
      const recsData = await fetchRecommendations(clientId!, testId).catch(() => []);
      setSelectedTestRecs(recsData.map((r) => r.text || '').filter(Boolean));
    } catch {
      setSelectedTestDetail(null);
      setDetailError('We could not load this report. Please try again.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const clearSelection = () => {
    setSelectedTestId(null);
    setSelectedTestDetail(null);
    setSelectedTestRecs([]);
    setDetailError('');
  };

  // Prefer the richer `data.result` payload, falling back to typed `results`.
  const selectedRows = useMemo<BiomarkerRow[]>(() => {
    if (!selectedTestDetail) return [];
    const raw = (selectedTestDetail.data?.result ?? selectedTestDetail.results) as RawResult[] | undefined;
    return toRows(raw);
  }, [selectedTestDetail]);

  const selectedSummary = useMemo(() => summarise(selectedRows), [selectedRows]);
  const groupedRows = useMemo(() => groupByCategory(selectedRows), [selectedRows]);

  const dashboardRows = useMemo<BiomarkerRow[]>(() => {
    if (!dashboardData?.biomarker_results) return [];
    return Object.entries(dashboardData.biomarker_results).flatMap(
      ([section, data]: [string, BiomarkerSection]) =>
        data.results.map((r) => ({
          name: r.biomarker_name,
          value: r.value,
          unit: r.unit,
          range: r.normal_range,
          category: section,
          status: r.status,
        })),
    );
  }, [dashboardData]);

  const overview = useMemo(() => summarise(dashboardRows), [dashboardRows]);

  const age = dashboardData?.profile?.age ?? calcAge(personal.date_of_birth);
  const height = formatHeight(dashboardData?.profile?.height ?? personal.height);
  const weight = formatWeight(dashboardData?.profile?.weight ?? personal.weight);
  const profileName = dashboardData?.profile?.name || displayName || '—';

  /* ---------------------------------------------------------- Locked ---- */

  if (isLocked) {
    return (
      <div className="screen screen--nav">
        <div className="container home__locked">
          <div className="card home__lock-card fade-in">
            <div className="home__lock-icon" aria-hidden="true">
              <Lock size={22} />
            </div>
            <h1 className="section-title">Profile locked</h1>
            <p className="text-secondary">
              Your name is encrypted with a passphrase only you hold. Enter it to unlock your profile.
            </p>

            <form
              className="home__lock-form"
              onSubmit={(e) => {
                e.preventDefault();
                void handleUnlock();
              }}
            >
              <div className="field">
                <label className="field__label" htmlFor="unlock-key">
                  Passphrase
                </label>
                <input
                  id="unlock-key"
                  className="input"
                  type="password"
                  autoComplete="off"
                  placeholder="Enter your passphrase"
                  value={unlockKey}
                  onChange={(e) => setUnlockKey(e.target.value)}
                  aria-invalid={!!unlockError}
                />
                {unlockError && <span className="field__error">{unlockError}</span>}
              </div>

              <button
                type="submit"
                className="btn btn--primary btn--block"
                disabled={unlocking || !unlockKey.trim()}
                aria-busy={unlocking}
              >
                {unlocking ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Unlocking
                  </>
                ) : (
                  'Unlock profile'
                )}
              </button>
            </form>
          </div>
        </div>
        <BottomNav active="home" />
      </div>
    );
  }

  /* ------------------------------------------------------ Test detail ---- */

  if (selectedTestId !== null) {
    return (
      <div className="screen screen--nav">
        <header className="app-header">
          <button type="button" className="icon-btn" onClick={clearSelection} aria-label="Back to reports">
            <ArrowLeft size={20} />
          </button>
          <span className="app-header__title">Report</span>
          <span />
        </header>

        <main className="container home__main">
          {loadingDetail && (
            <div className="stack" aria-busy="true">
              <span className="sr-only">Loading report</span>
              <div className="skeleton" style={{ height: 128 }} />
              <div className="skeleton" style={{ height: 64 }} />
              <div className="skeleton" style={{ height: 64 }} />
            </div>
          )}

          {!loadingDetail && detailError && (
            <div className="error-banner" role="alert">
              <AlertCircle size={18} aria-hidden="true" />
              {detailError}
            </div>
          )}

          {!loadingDetail && !detailError && selectedTestDetail && (
            <>
              <section className="home__hero fade-in">
                <p className="stat__label">Health score</p>
                <p className="stat__value stat__value--display">
                  {selectedSummary.healthScore}
                  <span className="stat__unit">/ 100</span>
                </p>
                <p className="text-label text-tertiary">
                  {formatDateLong(selectedTestDetail.recorded_at)}
                </p>

                <div className="home__hero-stats">
                  <div className="home__hero-stat">
                    <span className="stat__value home__hero-num">{selectedSummary.total}</span>
                    <span className="text-label text-secondary">Analysed</span>
                  </div>
                  <div className="home__hero-stat">
                    <span className="stat__value home__hero-num text-optimal">{selectedSummary.optimal}</span>
                    <span className="text-label text-secondary">Optimal</span>
                  </div>
                  <div className="home__hero-stat">
                    <span className="stat__value home__hero-num text-watch">{selectedSummary.toWatch}</span>
                    <span className="text-label text-secondary">To watch</span>
                  </div>
                </div>
              </section>

              <section className="card home__meta">
                <dl className="home__meta-grid">
                  <div>
                    <dt className="text-label text-tertiary">Kit</dt>
                    <dd className="text-body">{selectedTestDetail.kit_name || 'Standard kit'}</dd>
                  </div>
                  <div>
                    <dt className="text-label text-tertiary">Barcode</dt>
                    <dd className="text-body tabular">{selectedTestDetail.barcode_number || '—'}</dd>
                  </div>
                </dl>
              </section>

              <div className="segmented segmented--block" role="tablist" aria-label="Result grouping">
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'category'}
                  className="segmented__item"
                  onClick={() => setViewMode('category')}
                >
                  By category
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={viewMode === 'flat'}
                  className="segmented__item"
                  onClick={() => setViewMode('flat')}
                >
                  All {selectedRows.length}
                </button>
              </div>

              {viewMode === 'flat' ? (
                <section className="card card--flush">
                  <ul className="list">
                    {selectedRows.map((row) => (
                      <li key={row.id}>
                        <BiomarkerItem row={row} showCategory />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : (
                groupedRows.map((group) => (
                  <section key={group.section} className="home__group">
                    <div className="home__group-head">
                      <h2 className="section-title">{group.section}</h2>
                      <span className="text-label text-tertiary">{group.items.length}</span>
                    </div>
                    <div className="card card--flush">
                      <ul className="list">
                        {group.items.map((row) => (
                          <li key={row.id}>
                            <BiomarkerItem row={row} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </section>
                ))
              )}

              <section className="card">
                <h2 className="card__title">Recommendations</h2>
                {selectedTestRecs.length === 0 ? (
                  <p className="text-secondary" style={{ marginTop: 'var(--sp-2)' }}>
                    No approved recommendations for this report yet.
                  </p>
                ) : (
                  <ul className="home__rec-list">
                    {selectedTestRecs.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                )}
              </section>
            </>
          )}
        </main>

        <BottomNav active="home" />
      </div>
    );
  }

  /* --------------------------------------------------------- Overview ---- */

  return (
    <div className="screen screen--nav">
      <header className="app-header">
        <span />
        <span className="app-header__title">Dashboard</span>
        <span />
      </header>

      <main className="container home__main">
        <section className="home__greeting fade-in">
          <p className="text-label text-tertiary">Welcome back</p>
          <h1 className="display-name">{firstName || profileName}</h1>
        </section>

        {loadError && (
          <div className="error-banner" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            {loadError}
          </div>
        )}

        {loading ? (
          <div className="stack" aria-busy="true">
            <span className="sr-only">Loading your dashboard</span>
            <div className="skeleton" style={{ height: 150 }} />
            <div className="skeleton" style={{ height: 84 }} />
            <div className="skeleton" style={{ height: 84 }} />
          </div>
        ) : (
          <>
            {overview.total > 0 && (
              <section className="home__hero fade-in">
                <p className="stat__label">Health score</p>
                <p className="stat__value stat__value--display">
                  {dashboardData?.health_score ?? overview.healthScore}
                  <span className="stat__unit">/ 100</span>
                </p>

                <div className="progress home__score-bar">
                  <div
                    className="progress__fill"
                    style={{ width: `${Math.min(100, dashboardData?.health_score ?? overview.healthScore)}%` }}
                  />
                </div>

                <div className="home__hero-stats">
                  <div className="home__hero-stat">
                    <span className="stat__value home__hero-num">{overview.total}</span>
                    <span className="text-label text-secondary">Tracked</span>
                  </div>
                  <div className="home__hero-stat">
                    <span className="stat__value home__hero-num text-optimal">{overview.optimal}</span>
                    <span className="text-label text-secondary">Optimal</span>
                  </div>
                  <div className="home__hero-stat">
                    <span className="stat__value home__hero-num text-watch">{overview.toWatch}</span>
                    <span className="text-label text-secondary">To watch</span>
                  </div>
                </div>
              </section>
            )}

            <section className="card">
              <h2 className="card__title">Profile</h2>
              <dl className="kv-grid">
                <div>
                  <dt className="text-label text-tertiary">Name</dt>
                  <dd className="kv-grid__value truncate">{profileName}</dd>
                </div>
                <div>
                  <dt className="text-label text-tertiary">Age</dt>
                  <dd className="kv-grid__value tabular">{age ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-label text-tertiary">Height</dt>
                  <dd className="kv-grid__value tabular">{height}</dd>
                </div>
                <div>
                  <dt className="text-label text-tertiary">Weight</dt>
                  <dd className="kv-grid__value tabular">{weight}</dd>
                </div>
              </dl>
            </section>

            {biomarkerTests.length > 0 ? (
              <section>
                <h2 className="section-title">Your reports</h2>
                <div className="card card--flush">
                  <ul className="list">
                    {biomarkerTests.map((test) => (
                      <li key={test.id}>
                        <button
                          type="button"
                          className="list__row"
                          onClick={() => handleSelectTest(test.id)}
                        >
                          <span className="home__report-icon" aria-hidden="true">
                            <FlaskConical size={18} />
                          </span>
                          <span className="list__body">
                            <span className="list__title">{formatDate(test.recorded_at)}</span>
                            <span className="list__meta">
                              {test.result_count ?? 0} biomarkers analysed
                            </span>
                          </span>
                          <ChevronRight size={18} className="list__chevron" aria-hidden="true" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            ) : (
              <section className="card">
                <div className="empty-state">
                  <span className="empty-state__icon" aria-hidden="true">
                    <FlaskConical size={24} />
                  </span>
                  <h2 className="empty-state__title">No results yet</h2>
                  <p className="empty-state__body">
                    Order a kit to start tracking your biomarkers and get a personalised plan.
                  </p>
                  <button type="button" className="btn btn--primary" onClick={() => navigate('/kits')}>
                    Browse kits
                  </button>
                </div>
              </section>
            )}

            {hasReports && (
              <button type="button" className="card card--tappable home__plan-cta" onClick={() => navigate('/recommendations')}>
                <span className="home__plan-icon" aria-hidden="true">
                  <Sparkles size={18} />
                </span>
                <span className="list__body">
                  <span className="list__title">Your plan is ready</span>
                  <span className="list__meta">Precision diet and exercise protocols</span>
                </span>
                <ChevronRight size={18} className="list__chevron" aria-hidden="true" />
              </button>
            )}

            {(dashboardData?.recommendations?.length ?? 0) > 0 && (
              <section className="card">
                <h2 className="card__title">Recommendations</h2>
                <ul className="home__rec-list">
                  {dashboardData!.recommendations!.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        )}

        <footer className="home__legal">
          <p className="home__legal-text">
            Omiver provides wellness and nutrition insights for informational purposes only. Your
            biomarker results and recommendations are not medical advice, diagnosis, or treatment.
            Always consult a qualified healthcare professional before acting on them.
          </p>
          <p className="home__legal-text">
            By continuing to use this app you agree to our{' '}
            <button
              type="button"
              className="home__legal-link"
              onClick={() => navigate('/terms?mode=readonly&section=terms')}
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              className="home__legal-link"
              onClick={() => navigate('/terms?mode=readonly&section=privacy')}
            >
              Privacy Policy
            </button>
            .
          </p>
          <p className="home__legal-copy">
            &copy; {new Date().getFullYear()} Omiver Nutrition, Inc. All rights reserved.
          </p>
        </footer>
      </main>

      <BottomNav active="home" />
    </div>
  );
};

/** A single biomarker result row: name and range left, value and status right. */
const BiomarkerItem = ({ row, showCategory = false }: { row: BiomarkerRow; showCategory?: boolean }) => (
  <div className="list__row biomarker">
    <span className={`biomarker__marker biomarker__marker--${classifyStatus(row.status)}`} aria-hidden="true" />
    <span className="list__body">
      <span className="list__title">{row.name}</span>
      <span className="list__meta">
        {showCategory && row.category ? `${row.category} · ` : ''}
        {row.range || 'No reference range'}
      </span>
    </span>
    <span className="biomarker__readout">
      <span className="biomarker__value tabular">
        {formatBiomarkerValue(row.value)}
        {row.unit && <span className="stat__unit">{row.unit}</span>}
      </span>
      <span className={statusChipClass(row.status)}>{statusLabel(row.status)}</span>
    </span>
  </div>
);

export default HomeScreen;
