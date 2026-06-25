'use client';

import { useLocale } from '../lib/i18n/LocaleContext';

const LABELS = {
  batal_tawaqqu: {
    icon: '🎯',
    color: '#9B6A43',
    enName: 'Prediction Accuracy',
    arName: 'دقّة التوقع',
    enDesc: 'Correctly predicted the exact score',
    arDesc: 'أصاب النتيجة بالضبط',
  },
  muhannak: {
    icon: '🔥',
    color: '#B9513F',
    enName: 'Winning Streak',
    arName: 'سلسلة نجاح',
    enDesc: '5 correct predictions in a row',
    arDesc: '5 توقعات صحيحة متتالية',
  },
  astoori: {
    icon: '🔮',
    color: '#8B7FD9',
    enName: 'Full Group Prediction',
    arName: 'توقع المجموعة كاملة',
    enDesc: 'Predicted all matches in a group',
    arDesc: 'توقع جميع مباريات مجموعة كاملة',
  },
  sinbaq: {
    icon: '⏱️',
    color: '#6FA8B8',
    enName: 'Early Predictor',
    arName: 'التوقع المبكر',
    enDesc: 'Submitted predictions 24 hours early',
    arDesc: 'أرسل توقعاته قبل 24 ساعة',
  },
  saed_mufajaat: {
    icon: '⚡',
    color: '#A9744F',
    enName: 'Upset Predictor',
    arName: 'توقع المفاجآت',
    enDesc: 'Correctly predicted an underdog win',
    arDesc: 'توقع فوز الفريق الأقل ترشيحًا',
  },
  wahsh_usboo: {
    icon: '👑',
    color: '#C8A45D',
    enName: 'Star of the Week',
    arName: 'نجم الأسبوع',
    enDesc: 'Best weekly prediction performance',
    arDesc: 'أفضل أداء في توقعات الأسبوع',
  },
};

export default function AchievementBadge({ code, unlocked }) {
  const { locale } = useLocale();
  const item = LABELS[code] || {};

  const icon = item.icon || '🏅';
  const color = item.color || '#9B6A43';
  const name = locale === 'ar' ? item.arName : item.enName;
  const description = locale === 'ar' ? item.arDesc : item.enDesc;

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

      <p className="text-ink text-sm font-semibold leading-tight">
        {name || code}
      </p>

      <p className="text-ink-faint text-[11px] leading-tight">
        {description || ''}
      </p>
    </div>
  );
}