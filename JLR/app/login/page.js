'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useLocale } from '../../lib/i18n/LocaleContext';

export default function LoginPage() {
  const router = useRouter();
  const { t, locale, setLocale } = useLocale();
  const [email, setEmail] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [showEmployeeCode, setShowEmployeeCode] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const res = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      employeeCode: employeeCode.trim(),
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError(t('login_error'));
      return;
    }

    router.push('/predictions');
  }

  return (
    <main className="min-h-screen relative overflow-hidden bg-cream text-ink">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#FFF8ED_0%,transparent_38%),linear-gradient(180deg,#F7F1E6_0%,#EFE1CD_100%)]" />
      <div className="absolute -top-20 -start-20 h-72 w-72 rounded-full bg-gold-bright/20 blur-3xl" />
      <div className="absolute bottom-0 end-0 h-80 w-80 rounded-full bg-terracotta/15 blur-3xl" />

      <section className="relative z-10 min-h-screen flex items-center justify-center px-5 py-8">
        <div className="w-full max-w-md">
          <header className="flex items-center justify-between mb-5">
            <img src="/jlr-logo-tan.png" alt="JLR" className="h-8 w-auto opacity-80" />
            <button
              type="button"
              onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
              className="flex items-center gap-1 rounded-full border border-gold/25 bg-white/50 p-1 text-sm font-bold shadow-sm backdrop-blur focus-ring"
              aria-label="Switch language"
            >
              <span className={`rounded-full px-3 py-1.5 transition-colors ${locale === 'ar' ? 'bg-gold text-white' : 'text-gold-dark'}`}>
                AR
              </span>
              <span className={`rounded-full px-3 py-1.5 transition-colors ${locale === 'en' ? 'bg-gold text-white' : 'text-gold-dark'}`}>
                EN
              </span>
            </button>
          </header>

          <div className="relative rounded-card border border-card-border/70 bg-card shadow-card backdrop-blur-xl overflow-hidden">
            <div className="px-0 pt-6 pb-6 text-center">
              <div
                className="w-full h-72 mb-3"
                style={{
                  backgroundImage: 'url(/trophy-hero-sm.png)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  maskImage: 'linear-gradient(to bottom, black 88%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to bottom, black 88%, transparent 100%)',
                }}
                role="img"
                aria-label="World Cup trophy"
              />

              <div className="px-7">
                <p className="text-[11px] tracking-[0.22em] uppercase text-gold-eyebrow font-bold mb-3">
                  {t('worldCup2026')}
                </p>

                <h1 className="text-3xl font-extrabold leading-tight text-ink font-display">
                  <span className="block text-ink">{t('login_title_line1')}</span>
                  <span className="block text-gold">{t('login_title_line2')}</span>
                </h1>

                <p className="text-sm leading-6 text-ink-body mt-3 max-w-xs mx-auto">
                  {t('login_subtitle')}
                </p>

                <form onSubmit={handleSubmit} className="mt-7 space-y-4 text-start">
                  <div className="rounded-2xl bg-card-soft border border-card-border/70 shadow-sm overflow-hidden">
                    <div className="px-4 pt-4 pb-3 border-b border-card-border/60 flex items-start gap-3">
                      <MailIcon />
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-ink-label mb-1">
                          {t('login_email')}
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t('login_emailPlaceholder')}
                          className="w-full bg-transparent outline-none text-ink placeholder:text-ink-placeholder"
                        />
                      </div>
                    </div>

                    <div className="px-4 pt-4 pb-4 flex items-start gap-3">
                      <IdIcon />
                      <div className="flex-1">
                        <label className="block text-sm font-bold text-ink-label mb-1">
                          {t('login_employeeId')}
                        </label>
                        <input
                          type={showEmployeeCode ? 'text' : 'password'}
                          required
                          value={employeeCode}
                          onChange={(e) => setEmployeeCode(e.target.value)}
                          placeholder={t('login_employeeIdPlaceholder')}
                          className="w-full bg-transparent outline-none text-ink placeholder:text-ink-placeholder"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowEmployeeCode((s) => !s)}
                        className="text-ink-faint focus-ring shrink-0 mt-0.5"
                        aria-label={showEmployeeCode ? 'Hide employee ID' : 'Show employee ID'}
                      >
                        {showEmployeeCode ? <EyeIcon /> : <EyeOffIcon />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <div className="rounded-2xl border border-flare-dim/25 bg-flare-dim/10 px-4 py-3 text-sm font-semibold text-flare">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 rounded-2xl bg-gold hover:bg-gold-dark text-white font-extrabold shadow-button transition disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {loading ? t('login_submitting') : t('login_submit')}
                    {!loading && <ArrowIcon flip={locale === 'ar'} />}
                  </button>
                </form>

                <p className="text-xs text-ink-faint mt-5">{t('login_secure')}</p>
              </div>
            </div>
          </div>

          <footer className="mt-7 text-center">
            <div className="flex items-center justify-center gap-4 opacity-40">
              <div className="h-px w-20 bg-ink-body" />
              <img src="/jlr-logo-tan.png" alt="JLR" className="h-5 w-auto opacity-60" />
              <div className="h-px w-20 bg-ink-body" />
            </div>
            <p className="text-xs text-ink-faint mt-3">{t('login_created')}</p>
          </footer>
        </div>
      </section>
    </main>
  );
}

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gold mt-0.5 shrink-0">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3 7l9 6 9-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IdIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-gold mt-0.5 shrink-0">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="12" r="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14 10h4M14 14h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function ArrowIcon({ flip }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      style={{ transform: flip ? 'scaleX(-1)' : 'none' }}
    >
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}