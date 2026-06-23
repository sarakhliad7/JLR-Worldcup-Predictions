'use client';

import { useLocale } from '../lib/i18n/LocaleContext';

const FILTER_KEYS = [
  { key: 'upcoming', labelKey: 'filter_upcoming' },
  { key: 'group', labelKey: 'filter_group' },
  { key: 'r32', labelKey: 'filter_r32' },
  { key: 'r16', labelKey: 'filter_r16' },
  { key: 'knockout', labelKey: 'filter_knockout' },
  { key: 'finished', labelKey: 'filter_finished' },
  { key: 'all', labelKey: 'filter_all' },
];

export default function RoundFilterChips({ value, onChange }) {
  const { t } = useLocale();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
      {FILTER_KEYS.map((f) => (
        <button
          key={f.key}
          onClick={() => onChange(f.key)}
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-ring ${
            value === f.key
              ? 'bg-gold text-white'
              : 'bg-card-soft text-ink-body border border-card-border/60'
          }`}
        >
          {t(f.labelKey)}
        </button>
      ))}
    </div>
  );
}
