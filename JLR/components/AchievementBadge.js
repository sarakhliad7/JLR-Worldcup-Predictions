'use client';

import { useLocale } from '../lib/i18n/LocaleContext';

const ICONS = {
  astoori: '🔮',
  muhannak: '🔥',
  batal_tawaqqu: '🎯',
  wahsh_usboo: '👑',
  saed_mufajaat: '⚡',
  sinbaq: '⏱️',
};

const COLORS = {
  astoori: '#8B7FD9',
  muhannak: '#B9513F',
  batal_tawaqqu: '#9B6A43',
  wahsh_usboo: '#C8A45D',
  saed_mufajaat: '#A9744F',
  sinbaq: '#6FA8B8',
};

// Maps achievement codes to their dictionary key prefix
const I18N_KEY = {
  astoori: 'ach_astoori',
  muhannak: 'ach_muhannak',
  batal_tawaqqu: 'ach_batal',
  wahsh_usboo: 'ach_wahsh',
  saed_mufajaat: 'ach_saed',
  sinbaq: 'ach_sinbaq',
};

export default function AchievementBadge({ code, unlocked }) {
  const { t } = useLocale();
  const icon = ICONS[code] || '🏅';
  const color = COLORS[code] || '#9B6A43';
  const keyPrefix = I18N_KEY[code] || code;

  return (
    <div
      className={`rounded-2xl border p-4 flex flex-col items-center text-center gap-1 transition-opacity ${
        unlocked ? 'bg-card-soft border-card-border/60' : 'bg-card-soft/40 border-card-border/30 opacity-50'
      }`}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl mb-1"
        style={{ backgroundColor: unlocked ? `${color}26` : 'rgba(58,44,34,0.04)' }}
      >
        {icon}
      </div>
      <p className="text-ink text-sm font-semibold leading-tight">{t(`${keyPrefix}_name`)}</p>
      <p className="text-ink-faint text-[11px] leading-tight">{t(`${keyPrefix}_desc`)}</p>
    </div>
  );
}
