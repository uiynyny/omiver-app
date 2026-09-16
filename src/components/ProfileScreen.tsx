import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, Utensils, Dumbbell, LogOut } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { useLogout } from '../hooks/useLogout';
import { calcAge, formatHeight, formatWeight } from '../utils/format';
import BottomNav from './BottomNav';
import './ProfileScreen.css';

/** A single label/value pair rendered as a hairline list row. */
interface Field {
  key: string;
  label: string;
  value: unknown;
}

const EMPTY = '—';

/**
 * Renders a definition list of fields.
 *
 * Absent values render as an em dash rather than being hidden, so the user can
 * see at a glance which parts of their profile are still blank — and so the
 * screen never invents data it does not have.
 */
const FieldList: React.FC<{ fields: Field[] }> = ({ fields }) => (
  <dl className="profile__fields">
    {fields.map((f) => {
      const hasValue = f.value !== undefined && f.value !== null && String(f.value).trim() !== '';
      return (
        <div className="profile__field" key={f.key}>
          <dt className="profile__field-label">{f.label}</dt>
          <dd className={`profile__field-value${hasValue ? '' : ' profile__field-value--empty'}`}>
            {hasValue ? String(f.value) : EMPTY}
          </dd>
        </div>
      );
    })}
  </dl>
);

const ProfileScreen: React.FC = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const handleLogout = useLogout();
  const reg = state.registration;

  const name = `${reg?.first_name || ''} ${reg?.last_name || ''}`.trim() || 'Omiver Individual';

  const age = calcAge(reg.date_of_birth) ?? EMPTY;
  const heightDisplay = formatHeight(reg?.height);
  const weightDisplay = formatWeight(reg?.weight);

  const healthConditions = reg?.healthConditions || (reg as Record<string, unknown>)?.health_conditions;
  const healthConditionsText =
    healthConditions && healthConditions !== '' ? String(healthConditions) : EMPTY;

  // User's dietary information
  const dietaryFields: Field[] = [
    { key: 'dietary_preferences', label: 'Dietary Preferences', value: reg?.dietary_preferences },
    { key: 'preferred_cuisines', label: 'Preferred Cuisines', value: reg?.preferred_cuisines },
    { key: 'avoided_cuisines', label: 'Avoided Cuisines', value: reg?.avoided_cuisines },
    { key: 'allergies', label: 'Allergies', value: reg?.allergies },
    { key: 'dietary_recall', label: 'Dietary Recall', value: reg?.dietary_recall },
    { key: 'dietary_typicality', label: 'Dietary Typicality', value: reg?.dietary_typicality },
    { key: 'dietary_preference_mode', label: 'Preference Mode', value: reg?.dietary_preference_mode },
  ];

  // User's exercise information
  const exerciseFields: Field[] = [
    { key: 'exercise_types', label: 'Exercise Types', value: reg?.exercise_types },
    { key: 'exercise_days_per_week', label: 'Days Per Week', value: reg?.exercise_days_per_week },
    { key: 'weekly_exercise_routine', label: 'Weekly Routine', value: reg?.weekly_exercise_routine },
    { key: 'exercise_recall', label: 'Exercise Recall', value: reg?.exercise_recall },
  ];

  return (
    <div className="screen screen--nav">
      <header className="app-header">
        <span />
        <h1 className="app-header__title">Profile</h1>
        <span />
      </header>

      <main className="container stack-lg profile">
        <section className="card fade-in">
          <div className="profile__head">
            <span className="profile__avatar" aria-hidden="true">
              <User size={20} />
            </span>
            <h2 className="card__title profile__card-title">Summary</h2>
          </div>

          <dl className="kv-grid">
            <div>
              <dt className="text-label text-tertiary">Name</dt>
              <dd className="kv-grid__value truncate">{name}</dd>
            </div>
            <div>
              <dt className="text-label text-tertiary">Age</dt>
              <dd className="kv-grid__value tabular">{age}</dd>
            </div>
            <div>
              <dt className="text-label text-tertiary">Height</dt>
              <dd className="kv-grid__value tabular">{heightDisplay}</dd>
            </div>
            <div>
              <dt className="text-label text-tertiary">Weight</dt>
              <dd className="kv-grid__value tabular">{weightDisplay}</dd>
            </div>
          </dl>
        </section>

        <section className="card fade-in">
          <div className="profile__head">
            <Heart size={20} className="text-accent" aria-hidden="true" />
            <h2 className="card__title profile__card-title">Health Conditions</h2>
          </div>
          <p className="text-body">{healthConditionsText}</p>
        </section>

        <section className="card fade-in">
          <div className="profile__head">
            <Utensils size={20} className="text-accent" aria-hidden="true" />
            <h2 className="card__title profile__card-title">Dietary Information</h2>
          </div>
          <FieldList fields={dietaryFields} />
        </section>

        <section className="card fade-in">
          <div className="profile__head">
            <Dumbbell size={20} className="text-accent" aria-hidden="true" />
            <h2 className="card__title profile__card-title">Exercise Information</h2>
          </div>
          <FieldList fields={exerciseFields} />
        </section>

        <div className="stack-sm fade-in">
          <button type="button" className="btn btn--secondary btn--block" onClick={() => navigate('/profile/settings')}>
            Go to Settings
          </button>
          <button type="button" className="btn btn--danger btn--block" onClick={handleLogout}>
            <LogOut size={18} aria-hidden="true" /> Logout Account
          </button>
        </div>
      </main>

      <BottomNav active="profile" />
    </div>
  );
};

export default ProfileScreen;
